from flask import Blueprint, request, jsonify, g
import time
from app.db import detections, clusters
from app.auth import optional_auth
from app.services.dbscan import dbscan_clus, process_detection
from app.utils.helpers import generate_cluster_id
from app.services.priority import priority as calculate_priority

potholes_bp = Blueprint('potholes', __name__)

@potholes_bp.route('/', methods=['GET'])
@optional_auth
def get_potholes():
    query = {}
    status = request.args.get("status")
    priority_filter = request.args.get("priority")
    state = request.args.get("state")
    city = request.args.get("city")

    if status:
        status_map = {"reported": "OPEN", "in-progress": "IN_PROGRESS", "repaired": "RESOLVED"}
        query["status"] = status_map.get(status, status.upper())

    if priority_filter:
        if priority_filter == "high":
            query["priority"] = {"$gte": 100}
        elif priority_filter == "medium":
            query["priority"] = {"$gte": 50, "$lt": 100}
        elif priority_filter == "low":
            query["priority"] = {"$lt": 50}

    if state: query["state"] = state
    if city: query["city"] = city

    all_clusters = list(clusters.find(query, {"_id": 0}).sort("priority", -1))
    
    # Mapping logic from main.py
    potholes = []
    for c in all_clusters:
        lat = c["center"]["coordinates"][1]
        lng = c["center"]["coordinates"][0]
        status_map_rev = {"OPEN": "reported", "IN_PROGRESS": "in-progress", "RESOLVED": "repaired"}
        
        p_val = c.get("priority", 0)
        p_label = "high" if p_val >= 100 else "medium" if p_val >= 50 else "low"

        base = {
            "id": c.get("cluster_id", ""),
            "lat": lat,
            "lng": lng,
            "locationName": c.get("location_name", "Unknown Location"),
            "city": c.get("city", "Unknown"),
            "state": c.get("state", "Unknown"),
            "priority": p_label,
            "status": status_map_rev.get(c.get("status", "OPEN"), "reported"),
            "areaType": c.get("area_type", "urban"),
            "uniqueVehicleCount": c.get("unique_vehicle_count", c.get("report_count", 1)),
            "totalReports": c.get("report_count", 1),
            "images": c.get("images", []),
        }
        
        count = c.get("report_count", 1)
        for i in range(count):
            p = base.copy()
            p["id"] = f"{base['id']}_{i}"
            potholes.append(p)

    return jsonify({"data": potholes, "total": len(potholes)})

@potholes_bp.route('/sync', methods=['POST'])
@optional_auth
def sync():
    data = request.json
    if not data or "lat" not in data or "lon" not in data:
        return jsonify({"error": "Invalid data"}), 400
    
    result = process_detection(data)
    return jsonify({"message": "Stored & clustered successfully", "cluster_id": result.get("cluster_id")})

@potholes_bp.route('/cluster', methods=['GET'])
@optional_auth
def trigger_clustering():
    # Force rerun clustering on unprocessed points
    all_detections = list(detections.find({}, {"_id": 0}))
    if len(all_detections) < 1:
        return jsonify({"message": "No detections to cluster"}), 200

    cluster_groups = dbscan_clus(all_detections)
    clusters.delete_many({})

    for group in cluster_groups:
        c_data = {
            "cluster_id": generate_cluster_id(),
            "center": {"type": "Point", "coordinates": [group["lon"], group["lat"]]},
            "report_count": group["count"],
            "severity": group.get("severity", 0),
            "status": "OPEN",
            "last_seen": time.time(),
            "created_at": time.time(),
            "priority": calculate_priority(group) if callable(calculate_priority) else 100
        }
        clusters.insert_one(c_data)

    return jsonify({"message": "Clusters updated"})

@potholes_bp.route('/resolve/<cluster_id>', methods=['POST'])
@optional_auth
def resolve(cluster_id):
    clusters.update_one({"cluster_id": cluster_id}, {"$set": {"status": "RESOLVED", "updated_at": time.time()}})
    return jsonify({"message": "Resolved"})

@potholes_bp.route('/assign-work', methods=['POST'])
@optional_auth
def assign_work():
    data = request.json
    clusters.update_one({"cluster_id": data["cluster_id"]}, {"$set": {"assigned_to": data["assigned_to"]}})
    return jsonify({"message": "Assigned"})

@potholes_bp.route('/detect', methods=['POST'])
def detect():
    data = request.json
    if not data or "lat" not in data or "lon" not in data:
        return jsonify({"error": "Invalid data"}), 400
    result = process_detection(data)
    return jsonify({
        "status": "processed",
        "cluster_id": result.get("cluster_id"),
        "is_new": result.get("is_new")
    })

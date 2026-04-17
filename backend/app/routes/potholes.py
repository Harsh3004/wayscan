from flask import Blueprint, request, jsonify, g
import time
from app.db import detections, clusters, save_cluster
from app.auth import optional_auth
from app.services.dbscan import dbscan_clus, process_detection
from app.utils.helpers import generate_cluster_id, get_location_details
from app.services.priority import priority as calculate_priority

potholes_bp = Blueprint('potholes', __name__)

@potholes_bp.route('/potholes', methods=['GET'])
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
    payload = request.json
    if not payload:
        return jsonify({"error": "Invalid data"}), 400
    
    # Handle both single object and list of objects
    if isinstance(payload, list):
        detections_list = payload
    elif isinstance(payload, dict) and "detections" in payload:
        detections_list = payload["detections"]
    else:
        detections_list = [payload]

    # Offload to background task using threading
    import threading
    from app.tasks import process_sync_task
    user_id = g.get("current_user", {}).get("user_id", "guest")
    
    # Run in a background thread
    thread = threading.Thread(target=process_sync_task, args=(detections_list, user_id))
    thread.daemon = True  # Ensure thread dies when main process dies
    thread.start()
    
    return jsonify({
        "message": "Batch processing started in background",
        "batch_size": len(detections_list)
    }), 202

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
        lat = group["lat"]
        lon = group["lon"]
        
        # Enrich each cluster with location details
        city, state, location_name = get_location_details(lat, lon)
        
        c_data = {
            "cluster_id": generate_cluster_id(),
            "lat": lat,
            "lon": lon,
            "report_count": group["count"],
            "severity": group.get("severity", 0),
            "status": "OPEN",
            "last_seen": time.time(),
            "created_at": time.time(),
            "city": city,
            "state": state,
            "location_name": location_name,
            "priority": calculate_priority(group) if callable(calculate_priority) else 100
        }
        save_cluster(c_data)

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
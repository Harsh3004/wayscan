from flask import Flask, request, jsonify
from flask_cors import CORS
import time
from db import detections, clusters
from app.services.dbscan import dbscan_clus
from app.services.lifecycle import update_lifecycle
from db import create_indexes
from db import generate_cluster_id
from app.services.priority import priority


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

from math import radians, cos, sin, sqrt, atan2

create_indexes()
def distance_in_meters(lat1, lon1, lat2, lon2):
    R = 6371000  # Earth radius (meters)

    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)

    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return R * c
# HEALTH
@app.route("/")
def home():
    return "Backend Running"


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


# INGESTION
@app.route("/sync", methods=["POST"])
def sync():
    data = request.json

    if "lat" not in data or "lon" not in data:
        return jsonify({"error": "Invalid data"}), 400

    lat = float(data["lat"])
    lon = float(data["lon"])

    detection = {
        "lat": lat,
        "lon": lon,
        "confidence": float(data.get("confidence", 0)),
        "timestamp": time.time(),
        "processed": False,
        "device_id": data.get("device_id", "unknown"),
        "image_url": data.get("image_url", None)
    }

    # get nearby candidates (fast pre-filter)
    candidates = list(detections.find({
        "lat": {"$gte": lat - 0.0005, "$lte": lat + 0.0005},
        "lon": {"$gte": lon - 0.0005, "$lte": lon + 0.0005}
    }))

    # check real distance
    for existing in candidates:
        dist = distance_in_meters(
            lat, lon,
            existing["lat"], existing["lon"]
        )

        if dist < 3:  # 3 meters threshold
            return jsonify({
                "message": "Duplicate ignored",
                "status": "skipped"
            }), 200

    # insert if not duplicate
    detections.insert_one(detection)

    return jsonify({"message": "Stored successfully"})


# CLUSTERING
@app.route("/cluster", methods=["GET"])
def cluster_data():
    all_detections = list(detections.find({"processed": False}, {"_id": 0}))

    if len(all_detections) < 2:
        return jsonify({"message": "Not enough data"}), 200

    cluster_groups = dbscan_clus(all_detections)

    for group in cluster_groups:
        lat = group["lat"]
        lon = group["lon"]

        point = {
            "type": "Point",
            "coordinates": [lon, lat]
        }

        existing = clusters.find_one({
    "center": {
        "$near": {
            "$geometry": {
                "type": "Point",
                "coordinates": [lon, lat]
            },
            "$maxDistance": 5   # meters
        } } })

        if existing:
            existing["report_count"] += group["count"]
            existing["last_seen"] = time.time()

            existing = update_lifecycle(existing)

            clusters.update_one(
                {"cluster_id": existing["cluster_id"]},
                {"$set": existing}
            )

        else:
            cluster_data={
                "cluster_id": generate_cluster_id(),   # ✅ added
                "center": point,
                "report_count": group["count"],
                "severity": group.get("severity", 0),
                "status": "OPEN",
                "last_seen": time.time(),
                "no_detection_count": 0,
                "image_url": None
            }
            cluster_data["priority"] = priority(cluster_data)
            clusters.insert_one(cluster_data)


    detections.update_many(
        {"processed": False},
        {"$set": {"processed": True}}
    )

    return jsonify({"message": "Clusters updated"})

def get_clusters():
    status = request.args.get("status")
    
    query = {}
    if status:
        query["status"] = status

    data = list(clusters.find(query, {"_id": 0}).sort("priority", -1))

    return jsonify(data)



@app.route("/cluster/<cluster_id>", methods=["GET"])
def get_cluster(cluster_id):
    cluster = clusters.find_one({"cluster_id": cluster_id}, {"_id": 0})

    if not cluster:
        return jsonify({"error": "Not found"}), 404

    return jsonify(cluster)


# HEATMAP
@app.route("/heatmap", methods=["GET"])
def heatmap():
    all_clusters = list(clusters.find({}, {"_id": 0}))

    return jsonify([
        {
            "lat": c["center"]["coordinates"][1],
            "lon": c["center"]["coordinates"][0],
            "weight": c["report_count"]
        }
        for c in all_clusters
    ])


# ANALYTICS
@app.route("/analytics", methods=["GET"])
def analytics():
    total = clusters.count_documents({})
    open_issues = clusters.count_documents({"status": "OPEN"})
    resolved = clusters.count_documents({"status": "RESOLVED"})

    return jsonify({
        "total_issues": total,
        "open": open_issues,
        "resolved": resolved
    })


# PRIORITY
@app.route("/priority", methods=["GET"])
def priority_route():

    data = list(clusters.find({}, {"_id": 0}))

    results = []

    for c in data:
        reports = c.get("report_count", 1)
        severity = c.get("severity", 1)
        last_seen = c.get("last_seen", time.time())

        recency = max(1, 1000 / (time.time() - last_seen + 1))

        score = (reports ** 0.5) * severity * recency

        results.append({
            "cluster": c,
            "priority_score": score
        })

    return jsonify(results)


@app.route("/resolve/<cluster_id>", methods=["POST"])
def resolve(cluster_id):
    clusters.update_one(
        {"cluster_id": cluster_id},
        {"$set": {"status": "RESOLVED"}}
    )
    return jsonify({"message": "Resolved"})

@app.route("/assign-work", methods=["POST"])
def assign_work():
    data = request.json

    clusters.update_one(
        {"cluster_id": data["cluster_id"]},
        {"$set": {"assigned_to": data["assigned_to"]}}
    )

    return jsonify({"message": "Assigned"})


@app.route("/devices", methods=["GET"])
def get_devices():
    pipeline = [
        {
            "$group": {
                "_id": "$device_id",
                "last_seen": {"$max": "$timestamp"},
                "total_reports": {"$sum": 1}
            }
        }
    ]

    result = list(detections.aggregate(pipeline))

    return jsonify([
        {
            "device_id": d["_id"],
            "last_seen": d["last_seen"],
            "total_reports": d["total_reports"]
        }
        for d in result
    ])

# RUN
if __name__ == "__main__":
    app.run(debug=True)
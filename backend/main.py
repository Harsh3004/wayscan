from flask import Flask, request, jsonify
from db import detections, clusters
from app.services.dbscan import dbscan_clus
from app.services.lifecycle import update_lifecycle
import time
from flask_cors import CORS
app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Backend Running"

# STORE DETECTION
@app.route("/sync", methods=["POST"])
def sync():
    data = request.json

    if "lat" not in data or "lon" not in data:
        return jsonify({"error": "Invalid data"}), 400

    detection = {
        "lat": data["lat"],
        "lon": data["lon"],
        "confidence": data.get("confidence", 0),
        "timestamp": time.time()
    }

    detections.insert_one(detection)

    return jsonify({"message": "Stored successfully"})


# CLUSTER + LIFECYCLE
@app.route("/cluster", methods=["GET"])
def cluster_data():
    all_detections = list(detections.find({"processed": {"$ne": True}}))

    cluster_groups = dbscan_clus(all_detections)

    for group in cluster_groups:
        lat = sum([p["lat"] for p in group]) / len(group)
        lon = sum([p["lon"] for p in group]) / len(group)

        # Correct GeoJSON format
        point = {
            "type": "Point",
            "coordinates": [lon, lat]
        }

        # Find nearby cluster (5m ≈ 0.005 km)
        existing = clusters.find_one({
            "center": {
                "$near": {
                    "$geometry": point,
                    "$maxDistance": 5
                }
            }
        })

        if existing:
            updated = {
                "report_count": existing["report_count"] + len(group),
                "last_seen": time.time()
            }

            existing.update(updated)
            existing = update_lifecycle(existing)

            clusters.update_one(
                {"_id": existing["_id"]},
                {"$set": existing}
            )

        else:
            clusters.insert_one({
                "center": point,
                "report_count": len(group),
                "status": "OPEN",
                "last_seen": time.time(),
                "no_detection_count": 0
            })

    # mark detections processed
    detections.update_many(
        {"processed": {"$ne": True}},
        {"$set": {"processed": True}}
    )

    return jsonify({"message": "Clusters updated"})


@app.route("/heatmap", methods=["GET"])
def heatmap():
    all_clusters = list(clusters.find({}, {"_id": 0}))

    heatmap_data = []

    for c in all_clusters:
        heatmap_data.append({
            "lat": c["center"]["coordinates"][1],
            "lon": c["center"]["coordinates"][0],
            "weight": c["report_count"]
        })

    return jsonify(heatmap_data)


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

@app.route("/report", methods=["POST"])
def report():
    try:
        data = request.json

        # Validation
        if "lat" not in data or "lon" not in data:
            return jsonify({"error": "Missing lat/lon"}), 400

        # Clean data
        data["lat"] = float(data["lat"])
        data["lon"] = float(data["lon"])
        data["confidence"] = float(data.get("confidence", 0))
        data["issue"] = data.get("issue", "pothole")
        data["timestamp"] = time.time()
        data["cluster_id"] = -1

        detections.insert_one(data)

        dbscan_clus()

        return jsonify({"message": "Stored & Clustered"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/priority", methods=["GET"])
def priority():
    pipeline = [
        {
            "$group": {
                "_id": "$cluster_id",
                "count": {"$sum": 1},
                "lat": {"$avg": "$lat"},
                "lon": {"$avg": "$lon"},
                "severity": {"$avg": "$confidence"}
            }
        }
    ]

    clusters = list(detections.aggregate(pipeline))

    for c in clusters:
        c["priority_score"] = c["count"] * c["severity"]

    return jsonify(clusters)

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True)
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import time
from db import detections, clusters
from app.services.dbscan import dbscan_clus
from app.services.lifecycle import update_lifecycle
from db import create_indexes
from db import generate_cluster_id
from app.services.priority import priority
from app.auth import create_token, require_auth, optional_auth
from math import radians, cos, sin, sqrt, atan2

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

create_indexes()

def distance_in_meters(lat1, lon1, lat2, lon2):
    R = 6371000
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c

def cluster_to_pothole(c):
    lat = c["center"]["coordinates"][1]
    lng = c["center"]["coordinates"][0]
    status_map = {"OPEN": "reported", "IN_PROGRESS": "in-progress", "RESOLVED": "repaired"}
    priority_val = c.get("priority", 0)
    if priority_val >= 100:
        p = "high"
    elif priority_val >= 50:
        p = "medium"
    else:
        p = "low"

    def ts_to_iso(ts):
        if ts is None:
            return None
        if isinstance(ts, (int, float)):
            from datetime import datetime
            return datetime.fromtimestamp(ts).isoformat() + "Z"
        return ts

    return {
        "id": c.get("cluster_id", ""),
        "lat": lat,
        "lng": lng,
        "locationName": c.get("location_name", "Unknown Location"),
        "city": c.get("city", "Unknown"),
        "state": c.get("state", "Unknown"),
        "priority": p,
        "status": status_map.get(c.get("status", "OPEN"), "reported"),
        "areaType": c.get("area_type", "urban"),
        "uniqueVehicleCount": c.get("unique_vehicle_count", c.get("report_count", 1)),
        "totalReports": c.get("report_count", 1),
        "firstDetected": ts_to_iso(c.get("first_seen", c.get("created_at"))),
        "lastDetected": ts_to_iso(c.get("last_seen", time.time())),
        "images": c.get("images", []),
        "notes": c.get("notes", ""),
        "assignedTeam": c.get("assigned_team", c.get("assigned_to", None)),
        "internalNotes": c.get("internal_notes", []),
        "deadline": ts_to_iso(c.get("deadline")) if c.get("deadline") else None,
    }

@app.route("/")
def home():
    return "Backend Running"

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")

    if username == "admin" and password == "admin123":
        token = create_token("admin-user", "admin")
        return jsonify({"token": token, "user": {"id": "admin-user", "role": "admin"}})

    if username == "viewer" and password == "viewer123":
        token = create_token("viewer-user", "viewer")
        return jsonify({"token": token, "user": {"id": "viewer-user", "role": "viewer"}})

    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/sync", methods=["POST"])
@optional_auth
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

    candidates = list(detections.find({
        "lat": {"$gte": lat - 0.0005, "$lte": lat + 0.0005},
        "lon": {"$gte": lon - 0.0005, "$lte": lon + 0.0005}
    }))

    for existing in candidates:
        dist = distance_in_meters(lat, lon, existing["lat"], existing["lon"])
        if dist < 3:
            return jsonify({"message": "Duplicate ignored", "status": "skipped"}), 200

    detections.insert_one(detection)
    return jsonify({"message": "Stored successfully"})

@app.route("/cluster", methods=["GET"])
@optional_auth
def cluster_data():
    all_detections = list(detections.find({"processed": False}, {"_id": 0}))
    if len(all_detections) < 0:
        return jsonify({"message": "Not enough data"}), 200

    cluster_groups = dbscan_clus(all_detections)

    for group in cluster_groups:
        lat = group["lat"]
        lon = group["lon"]
        point = {"type": "Point", "coordinates": [lon, lat]}

        existing = clusters.find_one({
            "center": {
                "$near": {
                    "$geometry": {"type": "Point", "coordinates": [lon, lat]},
                    "$maxDistance": 5
                }
            }
        })

        if existing:
            existing["report_count"] += group["count"]
            existing["last_seen"] = time.time()
            existing = update_lifecycle(existing)
            clusters.update_one({"cluster_id": existing["cluster_id"]}, {"$set": existing})
        else:
            cluster_data = {
                "cluster_id": generate_cluster_id(),
                "center": point,
                "report_count": group["count"],
                "severity": group.get("severity", 0),
                "status": "OPEN",
                "last_seen": time.time(),
                "no_detection_count": 0,
                "image_url": None,
                "created_at": time.time(),
            }
            cluster_data["priority"] = priority(cluster_data)
            clusters.insert_one(cluster_data)

    detections.update_many({"processed": False}, {"$set": {"processed": True}})
    return jsonify({"message": "Clusters updated"})

@app.route("/cluster/<cluster_id>", methods=["GET"])
@optional_auth
def get_cluster(cluster_id):
    cluster = clusters.find_one({"cluster_id": cluster_id}, {"_id": 0})
    if not cluster:
        return jsonify({"error": "Not found"}), 404
    return jsonify(cluster)

@app.route("/heatmap", methods=["GET"])
@optional_auth
def heatmap():
    all_clusters = list(clusters.find({}, {"_id": 0}))
    return jsonify([
        {"lat": c["center"]["coordinates"][1], "lon": c["center"]["coordinates"][0], "weight": c["report_count"]}
        for c in all_clusters
    ])

@app.route("/analytics", methods=["GET"])
@optional_auth
def analytics():
    total = clusters.count_documents({})
    open_issues = clusters.count_documents({"status": "OPEN"})
    resolved = clusters.count_documents({"status": "RESOLVED"})
    return jsonify({"total_issues": total, "open": open_issues, "resolved": resolved})

@app.route("/priority", methods=["GET"])
@optional_auth
def priority_route():
    data = list(clusters.find({}, {"_id": 0}))
    results = []
    for c in data:
        reports = c.get("report_count", 1)
        severity = c.get("severity", 1)
        last_seen = c.get("last_seen", time.time())
        recency = max(1, 1000 / (time.time() - last_seen + 1))
        score = (reports ** 0.5) * severity * recency
        results.append({"cluster": c, "priority_score": score})
    return jsonify(results)

@app.route("/resolve/<cluster_id>", methods=["POST"])
@optional_auth
def resolve(cluster_id):
    clusters.update_one({"cluster_id": cluster_id}, {"$set": {"status": "RESOLVED"}})
    return jsonify({"message": "Resolved"})

@app.route("/assign-work", methods=["POST"])
@optional_auth
def assign_work():
    data = request.json
    clusters.update_one({"cluster_id": data["cluster_id"]}, {"$set": {"assigned_to": data["assigned_to"]}})
    return jsonify({"message": "Assigned"})

@app.route("/devices", methods=["GET"])
@optional_auth
def get_devices():
    pipeline = [
        {"$group": {"_id": "$device_id", "last_seen": {"$max": "$timestamp"}, "total_reports": {"$sum": 1}}}
    ]
    result = list(detections.aggregate(pipeline))
    return jsonify([{"device_id": d["_id"], "last_seen": d["last_seen"], "total_reports": d["total_reports"]} for d in result])

@app.route("/potholes", methods=["GET"])
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
    if state:
        query["state"] = state
    if city:
        query["city"] = city

    all_clusters = list(clusters.find(query, {"_id": 0}).sort("priority", -1))
    potholes = [cluster_to_pothole(c) for c in all_clusters]
    return jsonify({"data": potholes, "total": len(potholes)})

@app.route("/potholes/<cluster_id>", methods=["GET"])
@optional_auth
def get_pothole(cluster_id):
    cluster = clusters.find_one({"cluster_id": cluster_id}, {"_id": 0})
    if not cluster:
        return jsonify({"error": "Not found"}), 404
    return jsonify(cluster_to_pothole(cluster))

@app.route("/potholes/<cluster_id>", methods=["PATCH"])
@optional_auth
def update_pothole(cluster_id):
    data = request.json
    if not data:
        return jsonify({"error": "No data provided"}), 400

    update_fields = {}
    if "status" in data:
        status_map = {"reported": "OPEN", "in-progress": "IN_PROGRESS", "repaired": "RESOLVED"}
        update_fields["status"] = status_map.get(data["status"], data["status"].upper())
    if "assignedTeam" in data:
        update_fields["assigned_team"] = data["assignedTeam"]
    if "notes" in data:
        update_fields["notes"] = data["notes"]
    if "deadline" in data:
        update_fields["deadline"] = data["deadline"]
    if "internalNotes" in data:
        update_fields["internal_notes"] = data["internalNotes"]
    if "locationName" in data:
        update_fields["location_name"] = data["locationName"]
    if "city" in data:
        update_fields["city"] = data["city"]
    if "state" in data:
        update_fields["state"] = data["state"]

    update_fields["updated_at"] = time.time()

    result = clusters.update_one({"cluster_id": cluster_id}, {"$set": update_fields})
    if result.matched_count == 0:
        return jsonify({"error": "Not found"}), 404

    updated = clusters.find_one({"cluster_id": cluster_id}, {"_id": 0})
    return jsonify(cluster_to_pothole(updated))

@app.route("/dashboard/stats", methods=["GET"])
@optional_auth
def dashboard_stats():
    total_active = clusters.count_documents({"status": {"$ne": "RESOLVED"}})
    critical_hazards = clusters.count_documents({"priority": {"$gte": 100}})
    repaired_this_month = clusters.count_documents({
        "status": "RESOLVED",
        "updated_at": {"$gte": time.time() - 30 * 24 * 60 * 60}
    })
    pending_sync = detections.count_documents({"processed": False})

    resolved = list(clusters.find({"status": "RESOLVED"}, {"_id": 0, "updated_at": 1, "created_at": 1}))
    avg_resolution = 0
    if resolved:
        total_time = 0
        count = 0
        for r in resolved:
            if r.get("updated_at") and r.get("created_at"):
                total_time += (r["updated_at"] - r["created_at"]) / (24 * 60 * 60)
                count += 1
        if count > 0:
            avg_resolution = round(total_time / count, 1)

    return jsonify({
        "totalActive": total_active,
        "criticalHazards": critical_hazards,
        "repairedThisMonth": repaired_this_month,
        "avgResolutionTime": avg_resolution if avg_resolution > 0 else 4.2,
        "pendingSync": pending_sync,
    })

@app.route("/dashboard/trends", methods=["GET"])
@optional_auth
def dashboard_trends():
    weeks = []
    now = time.time()
    for i in range(4):
        week_start = now - (i + 1) * 7 * 24 * 60 * 60
        week_end = now - i * 7 * 24 * 60 * 60
        reported = clusters.count_documents({"created_at": {"$gte": week_start, "$lt": week_end}})
        repaired = clusters.count_documents({"status": "RESOLVED", "updated_at": {"$gte": week_start, "$lt": week_end}})
        weeks.insert(0, {"week": f"W{4-i}", "reported": reported, "repaired": repaired})
    return jsonify({"weekly": weeks})

@app.route("/analytics/cities", methods=["GET"])
@optional_auth
def analytics_cities():
    pipeline = [
        {"$group": {"_id": "$city", "count": {"$sum": "$report_count"}}},
        {"$sort": {"count": -1}}
    ]
    result = list(clusters.aggregate(pipeline))
    return jsonify({
        "data": [{"name": r["_id"] or "Unknown", "count": r["count"]} for r in result]
    })

@app.route("/analytics/monthly", methods=["GET"])
@optional_auth
def analytics_monthly():
    months = []
    now = time.time()
    for i in range(6):
        month_start = now - (i + 1) * 30 * 24 * 60 * 60
        month_end = now - i * 30 * 24 * 60 * 60
        created = clusters.count_documents({"created_at": {"$gte": month_start, "$lt": month_end}})
        resolved = clusters.count_documents({"status": "RESOLVED", "updated_at": {"$gte": month_start, "$lt": month_end}})
        months.insert(0, {"month": f"M{6-i}", "reported": created, "resolved": resolved})
    return jsonify({"data": months})

@app.route("/analytics/priority-distribution", methods=["GET"])
@optional_auth
def analytics_priority():
    high = clusters.count_documents({"priority": {"$gte": 100}})
    medium = clusters.count_documents({"priority": {"$gte": 50, "$lt": 100}})
    low = clusters.count_documents({"priority": {"$lt": 50}})
    return jsonify({
        "data": [
            {"name": "High", "count": high, "color": "#ef4444"},
            {"name": "Medium", "count": medium, "color": "#f97316"},
            {"name": "Low", "count": low, "color": "#10b981"}
        ]
    })

@app.route("/analytics/status-distribution", methods=["GET"])
@optional_auth
def analytics_status():
    open_count = clusters.count_documents({"status": "OPEN"})
    in_progress = clusters.count_documents({"status": "IN_PROGRESS"})
    resolved = clusters.count_documents({"status": "RESOLVED"})
    return jsonify({
        "data": [
            {"name": "Open", "count": open_count, "color": "#ef4444"},
            {"name": "In Progress", "count": in_progress, "color": "#3b82f6"},
            {"name": "Resolved", "count": resolved, "color": "#10b981"}
        ]
    })

@app.route("/events/stream")
def event_stream():
    from flask import Response
    import json

    def generate():
        while True:
            try:
                stats = {
                    "totalActive": clusters.count_documents({"status": {"$ne": "RESOLVED"}}),
                    "criticalHazards": clusters.count_documents({"priority": {"$gte": 100}}),
                    "repairedThisMonth": clusters.count_documents({
                        "status": "RESOLVED",
                        "updated_at": {"$gte": time.time() - 30 * 24 * 60 * 60}
                    }),
                    "pendingSync": detections.count_documents({"processed": False}),
                    "timestamp": time.time()
                }
                yield f"data: {json.dumps(stats)}\n\n"
                time.sleep(5)
            except GeneratorExit:
                break

    return Response(generate(), mimetype='text/event-stream')

if __name__ == "__main__":
    app.run(debug=True, port=5000)
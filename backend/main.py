from flask import Flask, request, jsonify, g
from flask_cors import CORS
import time
from db import detections, clusters
from app.services.dbscan import dbscan_clus, process_detection
from app.services.lifecycle import update_lifecycle
from db import create_indexes
from db import generate_cluster_id
from app.services.priority import priority
from app.auth import create_token, require_auth, optional_auth
from math import radians, cos, sin, sqrt, atan2

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

create_indexes()
import requests

def get_location_details(lat, lon):
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"

        res = requests.get(
            url,
            headers={"User-Agent": "wayscan-app"},
            timeout=5
        )

        data = res.json()
        address = data.get("address", {})

        city = (
            address.get("city")
            or address.get("town")
            or address.get("village")
            or address.get("county")
            or "Unknown"
        )

        state = address.get("state", "Unknown")
        location = data.get("display_name", "Unknown Location")

        return city, state, location

    except Exception as e:
        print("LOCATION ERROR:", e)
        return "Unknown", "Unknown", "Unknown Location"
    
    
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

    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/sync", methods=["POST"])
@optional_auth
def sync():
    data = request.json

    if not data or "lat" not in data or "lon" not in data:
        return jsonify({"error": "Invalid data"}), 400

    lat = float(data["lat"])
    lon = float(data["lon"])

    # 🌍 Get location
    city, state, location_name = get_location_details(lat, lon)

    detection = {
        "lat": lat,
        "lon": lon,
        "confidence": float(data.get("confidence", 0)),
        "timestamp": time.time(),
        "device_id": data.get("device_id", "unknown"),
        "image_url": data.get("image_url", None),
        "city": city,
        "state": state,
        "location_name": location_name
    }

    # ✅ Use robust process_detection (handles location, duplicate guard, and incremental clustering)
    result = process_detection(detection)
    
    print("LOG:", result.get("status"), result.get("cluster_id"))

    print("LOCATION:", city, state, location_name)

    return jsonify({"message": "Stored & processed successfully", "status": result.get("status")})


@app.route("/cluster", methods=["GET"])
@optional_auth
def cluster_data():
    # ✅ Find unprocessed points or run full re-cluster if requested
    all_detections = list(detections.find({"processed": False}, {"_id": 0}))

    if len(all_detections) < 1:
        return jsonify({"message": "No new detections to cluster"}), 200

    cluster_groups = dbscan_clus(all_detections)

    for group in cluster_groups:
        lat = group["lat"]
        lon = group["lon"]

        point = {"type": "Point", "coordinates": [lon, lat]}

        # Find existing cluster near this center
        existing = clusters.find_one({
            "center": {
                "$nearSphere": {
                    "$geometry": point,
                    "$maxDistance": 10
                }
            }
        })

        if existing:
            # Update existing
            new_count = existing["report_count"] + group["count"]
            clusters.update_one(
                {"cluster_id": existing["cluster_id"]},
                {
                    "$set": {
                        "report_count": new_count,
                        "last_seen": time.time(),
                        "severity": (existing.get("severity", 0) * existing["report_count"] + group["severity"] * group["count"]) / new_count
                    }
                }
            )
        else:
            # Create new
            new_cluster = {
                "cluster_id": generate_cluster_id(),
                "center": point,
                "report_count": group["count"],
                "severity": group["severity"],
                "status": "OPEN",
                "last_seen": time.time(),
                "created_at": time.time(),
                "city": "Unknown", # Could reverse search here
                "state": "Unknown",
                "location_name": "New Area"
            }
            new_cluster["priority"] = priority(new_cluster)
            clusters.insert_one(new_cluster)

    # Mark all processed
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

    potholes = []

    for c in all_clusters:
        base = cluster_to_pothole(c)
        count = c.get("report_count", 1)

        for i in range(count):
            pothole = base.copy()
            pothole["id"] = f"{base['id']}_{i}"
            potholes.append(pothole)

    # ALWAYS RETURN THIS
    return jsonify({
        "data": potholes,
        "total": len(potholes)
    })


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
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import time
from app.db import detections, clusters, create_indexes, generate_cluster_id
from app.services.dbscan import dbscan_clus, process_detection
from app.services.lifecycle import update_lifecycle
from app.services.priority import priority
from app.auth import create_token, require_auth, optional_auth
from app.routes.dashboard import dashboard_bp
from app.routes.potholes import potholes_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

create_indexes()
# Register Blueprints
app.register_blueprint(dashboard_bp, url_prefix="/dashboard")
app.register_blueprint(potholes_bp, url_prefix="/potholes")

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





@app.route("/devices", methods=["GET"])
@optional_auth
def get_devices():
    pipeline = [
        {"$group": {"_id": "$device_id", "last_seen": {"$max": "$timestamp"}, "total_reports": {"$sum": 1}}}
    ]
    result = list(detections.aggregate(pipeline))
    return jsonify([{"device_id": d["_id"], "last_seen": d["last_seen"], "total_reports": d["total_reports"]} for d in result])








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
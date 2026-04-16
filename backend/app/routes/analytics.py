from flask import Blueprint, request, jsonify, Response
import time
import json
from app.db import detections, clusters
from app.auth import optional_auth

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/stats', methods=['GET'])
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

@analytics_bp.route('/trends', methods=['GET'])
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

@analytics_bp.route('/heatmap', methods=['GET'])
@optional_auth
def heatmap():
    all_clusters = list(clusters.find({}, {"_id": 0}))
    return jsonify([
        {"lat": c["center"]["coordinates"][1], "lon": c["center"]["coordinates"][0], "weight": c["report_count"]}
        for c in all_clusters
    ])

@analytics_bp.route('/cities', methods=['GET'])
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

@analytics_bp.route('/priority-distribution', methods=['GET'])
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

@analytics_bp.route('/status-distribution', methods=['GET'])
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

@analytics_bp.route('/events/stream')
def event_stream():
    def generate():
        while True:
            try:
                stats = {
                    "totalActive": clusters.count_documents({"status": {"$ne": "RESOLVED"}}),
                    "criticalHazards": clusters.count_documents({"priority": {"$gte": 100}}),
                    "timestamp": time.time()
                }
                yield f"data: {json.dumps(stats)}\n\n"
                time.sleep(5)
            except GeneratorExit:
                break
    return Response(generate(), mimetype='text/event-stream')

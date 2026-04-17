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

@analytics_bp.route('/monthly', methods=['GET'])
@optional_auth
def analytics_monthly():
    import datetime
    months_data = []
    now = time.time()
    for i in range(6):
        month_start = now - (i + 1) * 30 * 24 * 60 * 60
        month_end = now - i * 30 * 24 * 60 * 60
        
        dt = datetime.datetime.fromtimestamp(month_start)
        month_label = dt.strftime('%b')
        
        # Sum report_count for reported in this month range
        reported_pipeline = [
            {"$match": {"created_at": {"$gte": month_start, "$lt": month_end}}},
            {"$group": {"_id": None, "total": {"$sum": "$report_count"}}}
        ]
        reported_res = list(clusters.aggregate(reported_pipeline))
        reported = reported_res[0]["total"] if reported_res else 0

        # Sum report_count for resolved in this month range
        resolved_pipeline = [
            {"$match": {"status": "RESOLVED", "updated_at": {"$gte": month_start, "$lt": month_end}}},
            {"$group": {"_id": None, "total": {"$sum": "$report_count"}}}
        ]
        resolved_res = list(clusters.aggregate(resolved_pipeline))
        resolved = resolved_res[0]["total"] if resolved_res else 0
        
        months_data.insert(0, {"month": month_label, "reported": reported, "resolved": resolved})
    return jsonify({"data": months_data})



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
    def get_sum(query):
        pipe = [{"$match": query}, {"$group": {"_id": None, "total": {"$sum": "$report_count"}}}]
        res = list(clusters.aggregate(pipe))
        return res[0]["total"] if res else 0

    high = get_sum({"priority": {"$gte": 100}})
    medium = get_sum({"priority": {"$gte": 50, "$lt": 100}})
    low = get_sum({"priority": {"$lt": 50}})

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
    def get_sum(query):
        pipe = [{"$match": query}, {"$group": {"_id": None, "total": {"$sum": "$report_count"}}}]
        res = list(clusters.aggregate(pipe))
        return res[0]["total"] if res else 0

    open_count = get_sum({"status": "OPEN"})
    in_progress = get_sum({"status": "IN_PROGRESS"})
    resolved = get_sum({"status": "RESOLVED"})

    return jsonify({
        "data": [
            {"name": "Open", "count": open_count, "color": "#ef4444"},
            {"name": "In Progress", "count": in_progress, "color": "#3b82f6"},
            {"name": "Resolved", "count": resolved, "color": "#10b981"}
        ]
    })



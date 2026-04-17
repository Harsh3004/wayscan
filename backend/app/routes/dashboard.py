import time
from flask import Blueprint, jsonify
from app.db import get_all_clusters, detections, clusters

dashboard_bp = Blueprint('dashboard', __name__)


@dashboard_bp.route('/clusters', methods=['GET'])
def get_clusters():
    all_clusters = get_all_clusters()
    return jsonify(all_clusters)


@dashboard_bp.route('/stats', methods=['GET'])
def dashboard_stats():
    # Use aggregation to sum report_count for active clusters
    active_pipeline = [
        {"$match": {"status": {"$ne": "RESOLVED"}}},
        {"$group": {"_id": None, "total": {"$sum": "$report_count"}}}
    ]
    active_result = list(clusters.aggregate(active_pipeline))
    total_active = active_result[0]["total"] if active_result else 0

    # Sum report_count for high priority
    critical_pipeline = [
        {"$match": {"priority": {"$gte": 100}}},
        {"$group": {"_id": None, "total": {"$sum": "$report_count"}}}
    ]
    critical_result = list(clusters.aggregate(critical_pipeline))
    critical_hazards = critical_result[0]["total"] if critical_result else 0

    # Sum report_count for repaired this month
    repaired_pipeline = [
        {"$match": {
            "status": "RESOLVED",
            "updated_at": {"$gte": time.time() - 30 * 24 * 60 * 60}
        }},
        {"$group": {"_id": None, "total": {"$sum": "$report_count"}}}
    ]
    repaired_result = list(clusters.aggregate(repaired_pipeline))
    repaired_this_month = repaired_result[0]["total"] if repaired_result else 0

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



@dashboard_bp.route('/trends', methods=['GET'])
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
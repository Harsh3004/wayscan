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
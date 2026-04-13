from flask import Blueprint, request, jsonify
from app.services.dbscan import process_detection

detection_bp = Blueprint('detection', __name__)

@detection_bp.route('/detect', methods=['POST'])
def detect():
    data = request.json

    result = process_detection(data)

    return jsonify({
        "status": "processed",
        "cluster_id": result.get("cluster_id"),
        "is_new": result.get("is_new")
    })
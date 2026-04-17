from flask import Blueprint, request, jsonify
from app.services.dbscan import process_detection
import time

detection_bp = Blueprint('detection', __name__)

@detection_bp.route('/detect', methods=['POST'])
def detect():
    data = request.json 


    if not data or "lat" not in data or "lon" not in data:
        return jsonify({"error": "Invalid data"}), 400

    try:
        detection = {
            "lat": float(data["lat"]),
            "lon": float(data["lon"]),
            "confidence": float(data.get("confidence", 0)),
            "timestamp": time.time(),
            "device_id": data.get("device_id", "unknown"),
            "image_url": data.get("image_url", None)
        }

        result = process_detection(detection)

        return jsonify({
            "status": result.get("status", "processed"),
            "cluster_id": result.get("cluster_id"),
            "is_new": result.get("is_new")
        })

    except Exception as e:
        print("ERROR in /detect:", str(e))
        return jsonify({"error": "Processing failed"}), 500
import time
from flask import Blueprint, request, jsonify, g
from app.services.dbscan import process_detection
from app.auth import optional_auth
from app.utils.helpers import get_location_details

detection_bp = Blueprint('detection', __name__)

@detection_bp.route('/detect', methods=['POST'])
@optional_auth
def detect():
    #Endpoint for mobile devices to post pothole detections.Supports anonymous reporting via 'optional_auth'.
    
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        # 1. Validation
        lat = data.get("lat")
        lon = data.get("lon")
        
        if lat is None or lon is None:
            return jsonify({"error": "Latitude and Longitude are required"}), 400

        # 2. Metadata Enrichment
        # Get City/State (Reverse Geocode)
        city, state, location_name = get_location_details(float(lat), float(lon))
        
        detection = {
            "lat": float(lat),
            "lon": float(lon),
            "confidence": float(data.get("confidence", 0)),
            "timestamp": data.get("timestamp", time.time()),
            "device_id": data.get("device_id", "unknown"),
            "image_url": data.get("image_url", None),
            "city": city,
            "state": state,
            "location_name": location_name,
            "reported_by": g.get("current_user", {}).get("user_id", "guest")
        }

        # 3. Process Detection (Duplicate guard and Incremental Clustering)
        result = process_detection(detection)

        # 4. Response Mapping
        # Return 201 Created for a new area, 200 OK for an existing cluster/duplicate
        status_code = 201 if result.get("is_new") else 200
        
        return jsonify({
            "status": result.get("status", "processed"),
            "cluster_id": result.get("cluster_id"),
            "is_new": result.get("is_new"),
            "location": {
                "city": city,
                "state": state,
                "address": location_name
            }
        }), status_code

    except ValueError as e:
        return jsonify({"error": f"Invalid data format: {str(e)}"}), 400
    except Exception as e:
        print(f"DETECTION ERROR: {str(e)}")
        return jsonify({"error": "An internal server error occurred"}), 500
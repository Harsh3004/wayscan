from flask import Flask, request, jsonify, g
from flask_cors import CORS
import time
from app.db import detections, clusters, create_indexes, generate_cluster_id
from app.services.dbscan import dbscan_clus, process_detection
from app.services.lifecycle import update_lifecycle
from app.services.priority import priority
from app.routes.auth import auth_bp
from app.routes.potholes import potholes_bp
from app.routes.analytics import analytics_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

create_indexes()

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(potholes_bp, url_prefix="/potholes")
app.register_blueprint(analytics_bp, url_prefix="/analytics")

def cluster_to_pothole(c):
    lat = c["center"]["coordinates"][1]
    lng = c["center"]["coordinates"][0]
    status_map = {"OPEN": "reported", "IN_PROGRESS": "in-progress", "RESOLVED": "repaired"}
    priority_val = c.get("priority", 0)
    p = "high" if priority_val >= 100 else "medium" if priority_val >= 50 else "low"

    def ts_to_iso(ts):
        if ts is None: return None
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
    }

@app.route("/")
def home():
    return "Backend Running"

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
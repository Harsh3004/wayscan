from flask import Flask, jsonify
from flask_cors import CORS
from app.db import create_indexes
from app.routes.auth import auth_bp
from app.routes.potholes import potholes_bp
from app.routes.analytics import analytics_bp
from app.routes.dashboard import dashboard_bp

app = Flask(__name__)
CORS(app, resources={r"/*": {
    "origins": "*",
    "methods": ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix="/auth")
app.register_blueprint(potholes_bp) # Registered at root to support /sync, /cluster, /potholes
app.register_blueprint(analytics_bp, url_prefix="/analytics")
app.register_blueprint(dashboard_bp, url_prefix="/dashboard")

# Initialize DB indexes
print("Initializing database indexes...")
with app.app_context():
    create_indexes()
print("Database indexes initialized.")

@app.route("/")
def home():
    print("Home route accessed")
    return "Wayscan Backend Modular Running"

@app.route("/health")
def health():
    print("Health check accessed")
    return jsonify({"status": "ok", "version": "2.0.0-modular"})





if __name__ == "__main__":
    app.run(debug=True, port=5001, threaded=True)

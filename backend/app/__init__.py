from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config
from app.routes.auth import auth_bp
from app.routes.potholes import potholes_bp
from app.routes.analytics import analytics_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, resources={r"/*": {"origins": "*"}})

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(potholes_bp, url_prefix='/potholes')
    app.register_blueprint(analytics_bp, url_prefix='/analytics')

    @app.route('/health')
    def health():
        return jsonify({
            "status": "healthy", 
            "service": "wayscan-backend",
            "environment": "development" if app.config['DEBUG'] else "production"
        })

    @app.route('/')
    def index():
        return "WayScan API v2.0 - Active"

    return app

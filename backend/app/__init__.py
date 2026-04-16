from flask import Flask, jsonify
from app.config import Config
from app.extensions import init_extensions
from app.routes.auth import auth_bp
from app.routes.potholes import potholes_bp
from app.routes.analytics import analytics_bp

def create_app(config_class=Config):
    """App factory for creating a Flask app instance."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    init_extensions(app)

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

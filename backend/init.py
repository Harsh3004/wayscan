from flask import Flask
from .config import Config
from .extensions import init_extensions
from .routes.sync import sync_bp
from .routes.dashboard import dashboard_bp
from .routes.detection import detection_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    init_extensions(app)

    # Register blueprints with prefixes (recommended)
    app.register_blueprint(sync_bp, url_prefix="/sync")
    app.register_blueprint(dashboard_bp, url_prefix="/dashboard")
    app.register_blueprint(detection_bp, url_prefix="/detection")

    return app
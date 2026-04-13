from flask import Flask
from .config import Config
from .extensions import init_extensions
from .routes.sync import sync_bp
from .routes.dashboard import dashboard_bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    init_extensions(app)

    app.register_blueprint(sync_bp)
    app.register_blueprint(dashboard_bp)

    return app
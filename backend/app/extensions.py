from flask_cors import CORS

cors = CORS()

def init_extensions(app):
    """Initializes all extensions with the given app."""
    cors.init_app(app, resources={r"/*": {"origins": "*"}})

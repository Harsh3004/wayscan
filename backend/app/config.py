import os
class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "wayscan-dev-secret")
    JWT_SECRET = os.getenv("JWT_SECRET", "wayscan-jwt-secret")
    MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
    DEBUG = os.getenv("FLASK_DEBUG", "True") == "True"
    PORT = int(os.getenv("PORT", 5000))
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")

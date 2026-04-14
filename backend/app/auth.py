import jwt
import os
from functools import wraps
from flask import request, jsonify, g

SECRET_KEY = os.getenv("JWT_SECRET", "wayscan-secret-key-change-in-production")
ALGORITHM = "HS256"

def create_token(user_id: str, role: str = "admin") -> str:
    import time
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": int(time.time()) + 86400,
        "iat": int(time.time())
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict | None:
    import time
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:st
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid authorization header"}), 401

        token = auth_header[7:]
        payload = decode_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired token"}), 401

        g.current_user = payload
        return f(*args, **kwargs)
    return decorated

def optional_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
            payload = decode_token(token)
            if payload:
                g.current_user = payload
        return f(*args, **kwargs)
    return decorated
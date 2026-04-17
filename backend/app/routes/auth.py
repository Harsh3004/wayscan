import time
import uuid
import hashlib
from flask import Blueprint, request, jsonify, g
from app.db import users
from app.auth import create_token, require_auth, optional_auth

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")

    if username == "admin" and password == "admin123":
        token = create_token("admin-user", "admin")
        return jsonify({"token": token, "user": {"id": "admin-user", "role": "admin"}})

    if username == "viewer" and password == "viewer123":
        token = create_token("viewer-user", "viewer")
        return jsonify({"token": token, "user": {"id": "viewer-user", "role": "viewer"}})

    return jsonify({"error": "Invalid credentials"}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json or {}
    name = data.get("name")
    email = data.get("email")
    username = data.get("username")
    password = data.get("password")

    if not all([name, email, username, password]):
        return jsonify({"error": "All fields are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # These helpers would ideally be in app/db.py
    if users.find_one({"username": username}):
        return jsonify({"error": "Username already exists"}), 400

    if users.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 400

    password_hash = hashlib.sha256(password.encode()).hexdigest()

    user_data = {
        "user_id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "username": username,
        "password": password_hash,
        "role": "user",
        "created_at": time.time()
    }

    users.insert_one(user_data)

    token = create_token(username, "user")
    return jsonify({
        "token": token,
        "user": {
            "id": username,
            "role": "user",
            "name": name
        }
    }), 201

@auth_bp.route('/me', methods=['GET'])
@optional_auth
def get_me():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"error": "No token provided"}), 401

    token = auth_header[7:]
    from app.auth import decode_token
    payload = decode_token(token)
    if not payload:
        return jsonify({"error": "Invalid token"}), 401

    user = users.find_one({"username": payload.get("user_id")})
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user["username"],
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role")
    })


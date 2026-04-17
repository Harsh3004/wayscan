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
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    # Hardcoded demo credentials
    if username == "admin" and password == "admin123":
        token = create_token("admin", "admin")
        return jsonify({
            "token": token, 
            "user": {
                "id": "admin", 
                "role": "admin",
                "name": "Super Admin"
            }
        })

    if username == "viewer" and password == "viewer123":
        token = create_token("viewer", "viewer")
        return jsonify({
            "token": token, 
            "user": {
                "id": "viewer", 
                "role": "viewer",
                "name": "Demo Viewer"
            }
        })

    # Database check
    user = users.find_one({"username": username})
    if user:
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        if user["password"] == password_hash:
            token = create_token(username, user.get("role", "user"))
            return jsonify({
                "token": token,
                "user": {
                    "id": user["username"],
                    "role": user.get("role", "user"),
                    "name": user.get("name", username)
                }
            })

    return jsonify({"error": "Invalid credentials"}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")
    email = data.get("email", username)
    name = data.get("name", username)

    if not all([username, password]):
        return jsonify({"error": "Username and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if users.find_one({"username": username}) or username in ["admin", "viewer"]:
        return jsonify({"error": "Username already exists"}), 400

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
@require_auth
def get_me():
    # g.current_user is populated by @require_auth decorator
    user_payload = g.current_user
    username = user_payload.get("user_id")

    # Hardcoded checks first
    if username == "admin":
        return jsonify({
            "id": "admin",
            "name": "Super Admin",
            "role": "admin"
        })
    if username == "viewer":
        return jsonify({
            "id": "viewer",
            "name": "Demo Viewer",
            "role": "viewer"
        })

    user = users.find_one({"username": username})
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user["username"],
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role")
    })



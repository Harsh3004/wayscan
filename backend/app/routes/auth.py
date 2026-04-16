from flask import Blueprint, request, jsonify, g
from app.db import users
from app.auth import create_token, require_auth
from werkzeug.security import check_password_hash, generate_password_hash
from bson import ObjectId

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400

    user = users.find_one({"username": username})
    
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_token(str(user["_id"]), user.get("role", "viewer"))
    
    return jsonify({
        "token": token, 
        "user": {
            "id": str(user["_id"]), 
            "username": user["username"],
            "role": user.get("role", "viewer")
        }
    })

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.json or {}
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing credentials"}), 400

    if users.find_one({"username": username}):
        return jsonify({"error": "User already exists"}), 400

    hashed_password = generate_password_hash(password)

    user = {
        "username": username,
        "password": hashed_password,
        "role": "viewer" 
    }

    result = users.insert_one(user)
    token = create_token(str(result.inserted_id), "viewer")
    
    return jsonify({
        "message": "User created successfully",
        "token": token,
        "user": {
            "id": str(result.inserted_id),
            "username": username,
            "role": "viewer"
        }
    })

@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_me():
    user_id = g.current_user.get("user_id")
    user = users.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({
        "id": str(user["_id"]),
        "username": user["username"],
        "role": user.get("role", "viewer")
    })

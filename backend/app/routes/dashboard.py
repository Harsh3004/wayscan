from flask import Blueprint, jsonify
from db import get_all_clusters

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/clusters', methods=['GET'])
def get_clusters():
    clusters = get_all_clusters()

    return jsonify([c.to_dict() for c in clusters])
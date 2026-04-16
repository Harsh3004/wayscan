from pymongo import MongoClient
import os
import uuid

client = MongoClient(os.getenv("MONGO_URL"))

civic_db = client["civic_db"]
detections = civic_db["detections"]
clusters = civic_db["clusters"]
users = civic_db["users"]


def generate_cluster_id():
    return str(uuid.uuid4())


# DETECTION

def save_detection(detection):
    # Ensure GeoJSON location is present
    if "lat" in detection and "lon" in detection:
        detection["location"] = {
            "type": "Point",
            "coordinates": [float(detection["lon"]), float(detection["lat"])]
        }

    # Set default processed flag
    if "processed" not in detection:
        detection["processed"] = False

    result = detections.insert_one(detection)
    return str(result.inserted_id)


def get_all_detections():
    # Fetch all detections
    return list(detections.find({}, {"_id": 0}))


def clear_detections():
    # Delete all detections (useful for testing)
    detections.delete_many({})


# CLUSTERS

def save_cluster(cluster):
    # Insert a new cluster
    result = clusters.insert_one(cluster)
    return str(result.inserted_id)


def get_all_clusters():
    # Fetch all clusters
    return list(clusters.find({}, {"_id": 0}))


def update_cluster(cluster_id, updated_data):
    # Update cluster by cluster_id
    return clusters.update_one(
        {"cluster_id": cluster_id},
        {"$set": updated_data}
    )


def clear_clusters():
    # Delete all clusters (useful for testing)
    clusters.delete_many({})


def find_cluster_by_id(cluster_id):
    # Get a single cluster
    return clusters.find_one({"cluster_id": cluster_id}, {"_id": 0})


def create_indexes():
    clusters.create_index([("center", "2dsphere")])
    detections.create_index([("location", "2dsphere")])
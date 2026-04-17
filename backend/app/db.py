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
    if "lat" in detection and "lon" in detection:
        detection["location"] = {
            "type": "Point",
            "coordinates": [float(detection["lon"]), float(detection["lat"])]
        }

    if "processed" not in detection:
        detection["processed"] = False

    result = detections.insert_one(detection)
    return str(result.inserted_id)


def get_all_detections():
    return list(detections.find({}, {"_id": 0}))


def clear_detections():
    detections.delete_many({})


# CLUSTERS

def save_cluster(cluster):
    if "lat" in cluster and "lon" in cluster:
        cluster["center"] = {
            "type": "Point",
            "coordinates": [float(cluster["lon"]), float(cluster["lat"])]
        }
    
    result = clusters.insert_one(cluster)
    return str(result.inserted_id)

def get_all_clusters():
    return list(clusters.find({}, {"_id": 0}))

def update_cluster(cluster_id, updated_data):
    return clusters.update_one(
        {"cluster_id": cluster_id},
        {"$set": updated_data}
    )

def clear_clusters():
    clusters.delete_many({})


def find_cluster_by_id(cluster_id):
    return clusters.find_one({"cluster_id": cluster_id}, {"_id": 0})

def create_indexes():
    clusters.create_index([("center", "2dsphere")])
    detections.create_index([("location", "2dsphere")])
    users.create_index([("username", "text"), ("email", "text")])

def find_user_by_username(username):
    return users.find_one({"username": username}, {"_id": 0})

def find_user_by_email(email):
    return users.find_one({"email": email}, {"_id": 0})

def create_user(user_data):
    result = users.insert_one(user_data)
    return str(result.inserted_id)

def get_all_users():
    return list(users.find({}, {"_id": 0, "password": 0}))

from sklearn.cluster import DBSCAN
import numpy as np
import time
from app.db import detections, clusters, save_detection
from app.utils.helpers import generate_cluster_id
from app.services.priority import priority as calculate_priority

EPS_METERS = 0.00005
MIN_SAMPLES = 2

def dbscan_clus(detection_list, eps_meters=EPS_METERS):
    
    if not detection_list:
        return []

    if len(detection_list) == 1:
        return [{
            "cluster_id": 0,
            "lat": detection_list[0]["lat"],
            "lon": detection_list[0]["lon"],
            "count": 1,
            "severity": detection_list[0].get("confidence", 0)
        }]

    eps_rad = eps_meters / 6371000.0

    coords = np.array([[np.radians(d["lat"]), np.radians(d["lon"])] for d in detection_list])

    model = DBSCAN(eps=eps_rad, min_samples=MIN_SAMPLES, metric='haversine', algorithm='ball_tree')
    labels = model.fit_predict(coords)

    results = []
    unique_labels = set(labels)

    for label in unique_labels:
        if label == -1:
            for i, d in enumerate(detection_list):
                if labels[i] == -1:
                    results.append({
                        "cluster_id": -1,
                        "lat": d["lat"],
                        "lon": d["lon"],
                        "count": 1,
                        "severity": d.get("confidence", 0)
                    })
            continue

        cluster_points = [
            detection_list[i]
            for i in range(len(detection_list))
            if labels[i] == label
        ]

        center_lat = np.mean([d["lat"] for d in cluster_points])
        center_lon = np.mean([d["lon"] for d in cluster_points])
        avg_severity = np.mean([d.get("confidence", 0) for d in cluster_points])

        results.append({
            "cluster_id": int(label),
            "lat": float(center_lat),
            "lon": float(center_lon),
            "count": len(cluster_points),
            "severity": float(avg_severity)
        })

    return results

def process_detection(data):
    lat = float(data.get("lat"))
    lon = float(data.get("lon"))
    
    point = {"type": "Point", "coordinates": [lon, lat]}
    
    duplicate = detections.find_one({
        "location": {
            "$nearSphere": {
                "$geometry": point,
                "$maxDistance": 3
            }
        }
    })
    
    if duplicate:
        return {
            "status": "duplicate",
            "cluster_id": duplicate.get("cluster_id"),
            "is_new": False
        }

    det_id = save_detection(data)
    

    nearest_cluster = clusters.find_one({
        "center": {
            "$nearSphere": {
                "$geometry": point,
                "$maxDistance": EPS_METERS
            }
        }
    })
    
    if nearest_cluster:
        new_count = nearest_cluster.get("report_count", 1) + 1
        old_center = nearest_cluster["center"]["coordinates"]
        new_lon = (old_center[0] * (new_count - 1) + lon) / new_count
        new_lat = (old_center[1] * (new_count - 1) + lat) / new_count
        
        update_data = {
            "report_count": new_count,
            "center": {"type": "Point", "coordinates": [new_lon, new_lat]},
            "last_seen": time.time(),
            "severity": (nearest_cluster.get("severity", 0) * (new_count - 1) + float(data.get("confidence", 0))) / new_count
        }
        update_data["priority"] = calculate_priority(update_data)
        
        clusters.update_one(
            {"cluster_id": nearest_cluster["cluster_id"]},
            {"$set": update_data}
        )
        
        from bson import ObjectId
        detections.update_one(
            {"_id": ObjectId(det_id)},
            {"$set": {"processed": True, "cluster_id": nearest_cluster["cluster_id"]}}
        )
        
        return {
            "status": "associated",
            "cluster_id": nearest_cluster["cluster_id"],
            "is_new": False
        }

    return {
        "status": "stored",
        "cluster_id": None,
        "is_new": True
    }
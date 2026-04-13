from sklearn.cluster import DBSCAN
import numpy as np
from app.models import cluster, create_detection
EPS = 0.00005
MIN_SAMPLES = 2

def dbscan_clus(detections):
    if len(detections) < 2:
        return []

    coords = np.array([[d["lat"], d["lon"]] for d in detections])
    model = DBSCAN(eps=EPS, min_samples=MIN_SAMPLES)
    labels = model.fit_predict(coords)

    clusters = []
    for label in set(labels):
        if label == -1:
            continue

        cluster_points = [detections[i] for i in range(len(detections)) if labels[i] == label]

        # Compute center
        center_lat = np.mean([d["lat"] for d in cluster_points])
        center_lon = np.mean([d["lon"] for d in cluster_points])

        # Compute severity
        severity = np.mean([d.get("confidence", 0) for d in cluster_points])

        clusters.append({
            "cluster_id": int(label),
            "lat": float(center_lat),
            "lon": float(center_lon),
            "count": len(cluster_points),
            "severity": float(severity)
        })

    return clusters

def process_detection(data):
    # data = {lat, lon, confidence, class}

    nearby_points = create_detection(data)

    cluster = dbscan_clus(nearby_points)

    if cluster is None:
        # New pothole
        cluster_id = create_cluster(data)
        return {"cluster_id": cluster_id, "is_new": True}
    
    else:
        # Existing pothole
        create_cluster(cluster, data)
        return {"cluster_id": cluster.id, "is_new": False}
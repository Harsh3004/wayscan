from sklearn.cluster import DBSCAN
import numpy as np
from app.models import cluster
from app.models import detection
EPS = 5
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


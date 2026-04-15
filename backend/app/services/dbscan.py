from sklearn.cluster import DBSCAN
import numpy as np

EPS = 0.00005
MIN_SAMPLES = 2

def dbscan_clus(detections):

    # ✅ FIX 1: handle empty
    if not detections:
        return []

    # ✅ FIX 2: single detection
    if len(detections) == 1:
        return [{
            "cluster_id": 0,
            "lat": detections[0]["lat"],
            "lon": detections[0]["lon"],
            "count": 1,
            "severity": detections[0].get("confidence", 0)
        }]

    coords = np.array([[d["lat"], d["lon"]] for d in detections])

    model = DBSCAN(eps=EPS, min_samples=MIN_SAMPLES)
    labels = model.fit_predict(coords)

    clusters = []

    for label in set(labels):

        # ✅ FIX 3: handle noise properly
        if label == -1:
            for i, d in enumerate(detections):
                if labels[i] == -1:
                    clusters.append({
                        "cluster_id": -1,
                        "lat": d["lat"],
                        "lon": d["lon"],
                        "count": 1,
                        "severity": d.get("confidence", 0)
                    })
            continue

        cluster_points = [
            detections[i]
            for i in range(len(detections))
            if labels[i] == label
        ]

        center_lat = np.mean([d["lat"] for d in cluster_points])
        center_lon = np.mean([d["lon"] for d in cluster_points])
        severity = np.mean([d.get("confidence", 0) for d in cluster_points])

        clusters.append({
            "cluster_id": int(label),
            "lat": float(center_lat),
            "lon": float(center_lon),
            "count": len(cluster_points),
            "severity": float(severity)
        })

    print("TOTAL DETECTIONS:", len(detections))
    return clusters
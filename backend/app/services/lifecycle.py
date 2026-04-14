import time

def update_lifecycle(cluster):
    last_seen = cluster.get("last_seen") or time.time()

    if last_seen is None:
        return cluster

    if time.time() - last_seen > 3600:
        cluster["no_detection_count"] += 1
    else:
        cluster["no_detection_count"] = 0

    if cluster["no_detection_count"] >= 5:
        cluster["status"] = "RESOLVED"

    return cluster
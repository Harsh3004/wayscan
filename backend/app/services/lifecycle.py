import time

def update_lifecycle(cluster):
    if time.time() - cluster["last_seen",0] > 3600:
        cluster["no_detection_count"] += 1
    else:
        cluster["no_detection_count"] = 0

        
    if cluster["no_detection_count"] >= 5:
        cluster["status"] = "RESOLVED"

    return cluster
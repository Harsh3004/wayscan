import math
import time

def priority(cluster):
    reports = cluster.get("report_count", 1)
    
    # recency (recent = higher score)
    time_diff = time.time() - cluster.get("last_seen", time.time())
    recency = max(1, 1000 / (time_diff + 1))


    return math.log(reports + 1) * recency * severity



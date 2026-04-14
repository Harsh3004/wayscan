import math
import time

def priority(cluster):
    reports = cluster.get("report_count", 1)
    severity = cluster.get("severity", 1)

    last_seen = cluster.get("last_seen")
    if last_seen is None:
        recency = 1
    else:
        time_diff = time.time() - last_seen
        recency = max(1, 1000 / (time_diff + 1))

    return math.log(reports + 1) * recency * severity
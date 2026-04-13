def create_cluster(lat, lon):
    return {
        "center": {
            "type": "Point",
            "coordinates": [lon, lat]
        },
        "report_count": 1,
        "status": "OPEN",
        "priority": 0,
        "no_detection_count": 0,
        "last_seen": None
    }
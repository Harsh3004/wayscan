def create_detection(data):
    return {
        "lat": data["lat"],
        "lon": data["lon"],
        "confidence": data.get("confidence", 0),
        "timestamp": data.get("timestamp"),
        "speed": data.get("speed", 0),
        "processed": False
    }
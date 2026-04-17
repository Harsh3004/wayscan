import time
from app.services.dbscan import process_detection
from app.utils.helpers import get_location_details

def process_detection_task(data, user_id="guest"):
    try:
        lat = data.get("lat")
        lon = data.get("lon")
        
        city, state, location_name = get_location_details(float(lat), float(lon))
        
        detection = {
            "lat": float(lat),
            "lon": float(lon),
            "confidence": float(data.get("confidence", 0)),
            "timestamp": data.get("timestamp", time.time()),
            "device_id": data.get("device_id", "unknown"),
            "image_url": data.get("image_url", None),
            "city": city,
            "state": state,
            "location_name": location_name,
            "reported_by": user_id
        }

        # 2. Process Detection (Duplicate guard and Incremental Clustering)
        result = process_detection(detection)
        return {"status": "completed", "result": result}
        
    except Exception as e:
        return {"status": "failed", "error": str(e)}

def process_sync_task(detections_list, user_id="guest"):
    results = []
    last_coords = None
    last_location = (None, None, None)

    for data in detections_list:
        lat = data.get("lat")
        lon = data.get("lon")
        
        if lat is None or lon is None:
            continue

        try:
            # Optimize geocoding: reuse location if close to previous
            if last_coords and abs(lat - last_coords[0]) < 0.001 and abs(lon - last_coords[1]) < 0.001:
                city, state, location_name = last_location
            else:
                city, state, location_name = get_location_details(float(lat), float(lon))
                last_coords = (lat, lon)
                last_location = (city, state, location_name)

            detection = {
                "lat": float(lat),
                "lon": float(lon),
                "confidence": float(data.get("confidence", 0)),
                "timestamp": data.get("timestamp", time.time()),
                "device_id": data.get("device_id", "unknown"),
                "image_url": data.get("image_url", data.get("image", None)),
                "city": city,
                "state": state,
                "location_name": location_name,
                "reported_by": user_id
            }

            result = process_detection(detection)
            results.append(result)
        except Exception as e:
            results.append({"status": "error", "error": str(e)})

    return {"status": "completed", "processed_count": len(results), "results": results}
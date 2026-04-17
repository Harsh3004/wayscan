from datetime import datetime
import time

def ts_to_iso(ts):
    """Converts a unix timestamp (int/float) to an ISO 8601 string."""
    if ts is None:
        return None
    if isinstance(ts, (int, float)):
        return datetime.fromtimestamp(ts).isoformat() + "Z"
    return ts

def generate_cluster_id():
    """Generates a unique ID for a pothole cluster."""
    return str(uuid.uuid4())

def get_location_details(lat, lon):
    try:
        url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
        res = requests.get(
            url,
            headers={"User-Agent": "wayscan-app"},
            timeout=5
        )
        data = res.json()
        address = data.get("address", {})
        city = (
            address.get("city")
            or address.get("town")
            or address.get("village")
            or address.get("county")
            or "Unknown"
        )
        state = address.get("state", "Unknown")
        location = data.get("display_name", "Unknown Location")
        return city, state, location
    except Exception as e:
        print("LOCATION ERROR:", e)
        return "Unknown", "Unknown", "Unknown Location"

def distance_in_meters(lat1, lon1, lat2, lon2):
    R = 6371000
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return R * c

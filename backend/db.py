from pymongo import MongoClient

client = MongoClient("mongodb+srv://admin:admin123@wayscan1.ywkfvfy.mongodb.net/?appName=Wayscan1")


civic_db = client["civic_db"]
detections = civic_db["detections"]
clusters = civic_db["clusters"]

def create_tables():
    # clusters table
    # detections table
    pass
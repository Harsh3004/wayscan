from pymongo import MongoClient
import os
from dotenv import load_dotenv
import time

load_dotenv()

mongo_url = os.getenv("MONGO_URL")
print(f"Connecting to: {mongo_url}")

try:
    client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
    print("Testing connection...")
    client.admin.command('ping')
    print("Ping successful!")
except Exception as e:
    print(f"Connection failed: {e}")

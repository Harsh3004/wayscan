from pymongo import MongoClient

MONGO_URL = "mongodb+srv://admin:admin123@wayscan1.ywkfvfy.mongodb.net/?appName=Wayscan1"

try:
    # Connect
    client = MongoClient(MONGO_URL)

    # Check connection
    print("Connected to MongoDB Atlas")

    # List databases
    print("Databases:", client.list_database_names())

    # Create/use database
    db = client["wayscan"]

    # Create/use collection
    collection = db["test_collection"]

    # Insert test data
    result = collection.insert_one({
        "test": "connection successful",
        "status": True
    })

    print("Data inserted with ID:", result.inserted_id)

    # Fetch data
    data = collection.find_one({"test": "connection successful"})
    print("Fetched Data:", data)

except Exception as e:
    print("Error:", e)
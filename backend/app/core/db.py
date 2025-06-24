import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("DATABASE_URL")

client = MongoClient(MONGO_URL, tlsAllowInvalidCertificates=True)
db = client.get_database("LawFirmOS")  # Or get_default_database() if you prefer


# You can add a function to check the connection
def check_db_connection():
    try:
        client.admin.command("ping")
        print("MongoDB connection successful.")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
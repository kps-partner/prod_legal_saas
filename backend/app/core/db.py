import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

# Support both MONGODB_URL (production) and MONGO_DETAILS (local development)
MONGO_URL = os.getenv("MONGODB_URL") or os.getenv("MONGO_DETAILS")

if not MONGO_URL:
    raise ValueError("No MongoDB connection string found. Set either MONGODB_URL or MONGO_DETAILS environment variable.")

client = MongoClient(MONGO_URL, tlsAllowInvalidCertificates=True)
db = client.get_database("LawFirmOS")  # Or get_default_database() if you prefer


# You can add a function to check the connection
def check_db_connection():
    try:
        client.admin.command("ping")
        print("MongoDB connection successful.")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")


def get_database():
    """Get the database instance."""
    return db
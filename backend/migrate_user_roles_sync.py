#!/usr/bin/env python3
"""
Migration script to update existing user roles from 'Admin' to 'Lawyer'
and add missing fields for the new user management system.
"""

from pymongo import MongoClient
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def migrate_user_roles():
    """Migrate existing users to new role system"""
    
    # Connect to MongoDB
    mongodb_url = os.getenv("MONGO_DETAILS", "mongodb://localhost:27017")
    client = MongoClient(mongodb_url)
    db = client.lawfirm_os
    users_collection = db.users
    
    try:
        # Find all users with 'Admin' role
        admin_users = list(users_collection.find({"role": "Admin"}))
        
        print(f"Found {len(admin_users)} users with 'Admin' role")
        
        # Update each admin user to 'Lawyer' role and add missing fields
        for user in admin_users:
            update_data = {
                "role": "Lawyer",
                "status": "active",  # Set default status
                "updated_at": datetime.utcnow()
            }
            
            # Add created_at if missing
            if "created_at" not in user:
                update_data["created_at"] = user.get("_id").generation_time if user.get("_id") else datetime.utcnow()
            
            result = users_collection.update_one(
                {"_id": user["_id"]},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                print(f"✓ Updated user {user.get('email', user['_id'])} from Admin to Lawyer")
            else:
                print(f"✗ Failed to update user {user.get('email', user['_id'])}")
        
        # Verify the migration
        remaining_admin_users = users_collection.count_documents({"role": "Admin"})
        lawyer_users = users_collection.count_documents({"role": "Lawyer"})
        
        print(f"\nMigration complete!")
        print(f"Remaining Admin users: {remaining_admin_users}")
        print(f"Lawyer users: {lawyer_users}")
        
        if remaining_admin_users == 0:
            print("✓ All Admin users successfully migrated to Lawyer role")
        else:
            print("⚠ Some Admin users were not migrated")
            
    except Exception as e:
        print(f"Error during migration: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    migrate_user_roles()
"""Migration script to update existing calendar connections with new token management fields."""

import logging
from datetime import datetime
from app.core.db import get_database

logger = logging.getLogger(__name__)

def migrate_calendar_connections():
    """Add new token management fields to existing calendar connections."""
    try:
        db = get_database()
        
        # Find all connections that don't have the new fields
        connections = db.connected_calendars.find({
            "$or": [
                {"token_status": {"$exists": False}},
                {"updated_at": {"$exists": False}}
            ]
        })
        
        updated_count = 0
        for connection in connections:
            firm_id = connection.get("firm_id")
            logger.info(f"Migrating connection for firm {firm_id}")
            
            # Add new fields with default values
            update_data = {
                "token_status": "active",  # Assume existing connections are active
                "token_expiry": None,
                "last_refresh_attempt": None,
                "refresh_error_count": 0,
                "last_refresh_error": None,
                "updated_at": datetime.utcnow()
            }
            
            # Only add fields that don't exist
            for field, value in update_data.items():
                if field not in connection:
                    db.connected_calendars.update_one(
                        {"_id": connection["_id"]},
                        {"$set": {field: value}}
                    )
            
            updated_count += 1
        
        logger.info(f"Successfully migrated {updated_count} calendar connections")
        return updated_count
        
    except Exception as e:
        logger.error(f"Failed to migrate calendar connections: {str(e)}")
        raise

if __name__ == "__main__":
    # Run migration
    logging.basicConfig(level=logging.INFO)
    migrate_calendar_connections()
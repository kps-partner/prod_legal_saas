#!/usr/bin/env python3
"""
Migration script to auto-select primary calendars for all existing connections
that are missing calendar_id field.

This fixes the "No Available Time Slots" issue for all firms.
"""

import sys
import os
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from app.core.db import get_database
from app.modules.scheduling.services import auto_select_primary_calendar
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def migrate_auto_select_calendars():
    """Apply auto-select calendar fix to all existing connections missing calendar_id."""
    
    db = get_database()
    
    # Find all connections that are missing calendar_id
    missing_calendar_connections = list(db.connected_calendars.find({
        "$or": [
            {"calendar_id": {"$exists": False}},
            {"calendar_id": None},
            {"calendar_id": ""}
        ]
    }))
    
    logger.info(f"Found {len(missing_calendar_connections)} connections missing calendar_id")
    
    if not missing_calendar_connections:
        logger.info("✅ All connections already have calendar_id set")
        return
    
    success_count = 0
    error_count = 0
    
    for connection in missing_calendar_connections:
        firm_id = connection['firm_id']
        connection_id = connection['_id']
        
        try:
            logger.info(f"Processing firm {firm_id} (connection {connection_id})")
            
            # Auto-select primary calendar using stored tokens
            calendar_id, calendar_name = auto_select_primary_calendar(
                connection['access_token'],
                connection['refresh_token'],
                connection.get('scopes')
            )
            
            # Update the connection with selected calendar
            result = db.connected_calendars.update_one(
                {"_id": connection_id},
                {"$set": {
                    "calendar_id": calendar_id,
                    "calendar_name": calendar_name,
                    "updated_at": datetime.utcnow()
                }}
            )
            
            if result.modified_count > 0:
                logger.info(f"✅ Firm {firm_id}: Auto-selected '{calendar_name}' ({calendar_id})")
                success_count += 1
            else:
                logger.warning(f"⚠️ Firm {firm_id}: Update matched but no modification occurred")
                
        except Exception as e:
            logger.error(f"❌ Firm {firm_id}: Failed to auto-select calendar: {str(e)}")
            error_count += 1
            
            # Set default calendar as fallback
            try:
                db.connected_calendars.update_one(
                    {"_id": connection_id},
                    {"$set": {
                        "calendar_id": "primary",
                        "calendar_name": "Primary Calendar",
                        "updated_at": datetime.utcnow()
                    }}
                )
                logger.info(f"🔄 Firm {firm_id}: Set default 'primary' calendar as fallback")
                success_count += 1
            except Exception as fallback_error:
                logger.error(f"💥 Firm {firm_id}: Even fallback failed: {str(fallback_error)}")
    
    logger.info(f"\n📊 Migration Summary:")
    logger.info(f"   Total connections processed: {len(missing_calendar_connections)}")
    logger.info(f"   ✅ Successfully updated: {success_count}")
    logger.info(f"   ❌ Errors encountered: {error_count}")
    
    if success_count > 0:
        logger.info(f"\n🎉 Migration completed! {success_count} firms now have calendar booking available.")
    
    return success_count, error_count

if __name__ == "__main__":
    logger.info("🚀 Starting auto-select calendar migration for all firms...")
    
    try:
        success_count, error_count = migrate_auto_select_calendars()
        
        if error_count == 0:
            logger.info("✅ Migration completed successfully with no errors!")
            sys.exit(0)
        else:
            logger.warning(f"⚠️ Migration completed with {error_count} errors")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"💥 Migration failed with critical error: {str(e)}")
        sys.exit(1)
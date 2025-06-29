from typing import List, Optional
from bson import ObjectId
from datetime import datetime
from app.core.db import db
from app.shared.models import TimelineEvent


def create_timeline_event(
    case_id: str,
    firm_id: str,
    event_type: str,
    content: str,
    user_id: Optional[str] = None
) -> Optional[str]:
    """
    Create a new timeline event for a case.
    
    Args:
        case_id: The ID of the case this event belongs to
        firm_id: The ID of the firm for security/filtering
        event_type: Type of event (e.g., 'note', 'status_change', 'meeting_scheduled', 'case_created')
        content: The content/description of the event
        user_id: Optional user ID for user-generated events
    
    Returns:
        The ID of the created timeline event, or None if creation failed
    """
    try:
        # Verify the case exists and belongs to the firm
        case = db.cases.find_one({
            "_id": ObjectId(case_id),
            "firm_id": firm_id
        })
        
        if not case:
            print(f"Case {case_id} not found or doesn't belong to firm {firm_id}")
            return None
        
        # Create the timeline event
        timeline_event_data = {
            "case_id": case_id,
            "firm_id": firm_id,
            "user_id": user_id,
            "type": event_type,
            "content": content,
            "created_at": datetime.utcnow()
        }
        
        result = db.timeline_events.insert_one(timeline_event_data)
        
        # Update the case's last_activity timestamp
        db.cases.update_one(
            {"_id": ObjectId(case_id)},
            {"$set": {"last_activity": datetime.utcnow()}}
        )
        
        return str(result.inserted_id)
        
    except Exception as e:
        print(f"Error creating timeline event for case {case_id}: {e}")
        return None


def get_timeline_for_case(case_id: str, firm_id: str) -> List[TimelineEvent]:
    """
    Retrieve all timeline events for a specific case, sorted chronologically.
    
    Args:
        case_id: The ID of the case to get timeline for
        firm_id: The ID of the firm for security/filtering
    
    Returns:
        List of TimelineEvent objects sorted by created_at (newest first)
    """
    try:
        # Verify the case exists and belongs to the firm
        case = db.cases.find_one({
            "_id": ObjectId(case_id),
            "firm_id": firm_id
        })
        
        if not case:
            print(f"Case {case_id} not found or doesn't belong to firm {firm_id}")
            return []
        
        # Get timeline events for the case, sorted by created_at (newest first)
        timeline_cursor = db.timeline_events.find({
            "case_id": case_id,
            "firm_id": firm_id
        }).sort("created_at", -1)
        
        timeline_events = []
        for event_data in timeline_cursor:
            # Convert ObjectId to string for Pydantic validation
            event_data["_id"] = str(event_data["_id"])
            timeline_event = TimelineEvent(**event_data)
            timeline_events.append(timeline_event)
        
        return timeline_events
        
    except Exception as e:
        print(f"Error getting timeline for case {case_id}: {e}")
        return []


def get_timeline_events_with_user_info(case_id: str, firm_id: str) -> List[dict]:
    """
    Retrieve timeline events with user information for display.
    
    Args:
        case_id: The ID of the case to get timeline for
        firm_id: The ID of the firm for security/filtering
    
    Returns:
        List of timeline event dictionaries with user information
    """
    try:
        # Verify the case exists and belongs to the firm
        case = db.cases.find_one({
            "_id": ObjectId(case_id),
            "firm_id": firm_id
        })
        
        if not case:
            print(f"Case {case_id} not found or doesn't belong to firm {firm_id}")
            return []
        
        # Get timeline events first, then lookup users separately
        timeline_cursor = db.timeline_events.find({
            "case_id": case_id,
            "firm_id": firm_id
        }).sort("created_at", -1)
        
        timeline_events = []
        for event_data in timeline_cursor:
            # Convert ObjectId to string
            event_data["_id"] = str(event_data["_id"])
            
            # Lookup user information if user_id exists
            user_name = None
            if event_data.get("user_id"):
                user_id = event_data["user_id"]
                user = None
                
                # Try to find user by ObjectId first (if it's a valid 24-char hex string)
                if len(user_id) == 24:
                    try:
                        user = db.users.find_one({"_id": ObjectId(user_id)})
                    except:
                        pass
                
                # If not found by ObjectId, try to find by email
                if not user:
                    user = db.users.find_one({"email": user_id})
                
                if user:
                    user_name = user.get("name")
            
            # Handle both 'type' and 'event_type' fields for backward compatibility
            event_type = event_data.get("type") or event_data.get("event_type", "unknown")
            
            timeline_event = {
                "id": event_data["_id"],
                "case_id": event_data["case_id"],
                "firm_id": event_data["firm_id"],
                "user_id": event_data.get("user_id"),
                "user_name": user_name,
                "type": event_type,
                "content": event_data.get("content", ""),
                "created_at": event_data["created_at"]
            }
            
            timeline_events.append(timeline_event)
        
        return timeline_events
        
    except Exception as e:
        print(f"Error getting timeline with user info for case {case_id}: {e}")
        return []
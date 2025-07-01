"""
Business logic services for availability management.
"""
import logging
from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from bson import ObjectId
from app.core.db import get_database
from app.shared.models import Appointment
from .models import FirmAvailability, BlockedDate, WeeklySchedule
from .schemas import ConflictWarning, TimezoneOption

logger = logging.getLogger(__name__)

# US Timezone options
US_TIMEZONES = [
    TimezoneOption(value="America/Los_Angeles", label="Pacific Time (PT)", offset="UTC-8/-7"),
    TimezoneOption(value="America/Denver", label="Mountain Time (MT)", offset="UTC-7/-6"),
    TimezoneOption(value="America/Chicago", label="Central Time (CT)", offset="UTC-6/-5"),
    TimezoneOption(value="America/New_York", label="Eastern Time (ET)", offset="UTC-5/-4"),
    TimezoneOption(value="America/Phoenix", label="Arizona Time (MST)", offset="UTC-7"),
    TimezoneOption(value="America/Anchorage", label="Alaska Time (AKST)", offset="UTC-9/-8"),
    TimezoneOption(value="Pacific/Honolulu", label="Hawaii Time (HST)", offset="UTC-10"),
]


def get_us_timezones() -> List[TimezoneOption]:
    """Get list of US timezone options."""
    return US_TIMEZONES


def get_firm_availability(firm_id: str) -> Optional[FirmAvailability]:
    """Get firm availability settings."""
    try:
        db = get_database()
        availability_data = db.firm_availability.find_one({"firm_id": firm_id})
        
        if availability_data:
            # Convert ObjectId to string for the id field
            if "_id" in availability_data:
                availability_data["_id"] = str(availability_data["_id"])
            return FirmAvailability(**availability_data)
        
        # Return default availability if none exists
        return create_default_availability(firm_id)
        
    except Exception as e:
        logger.error(f"Error getting firm availability for {firm_id}: {str(e)}")
        return None


def create_default_availability(firm_id: str) -> FirmAvailability:
    """Create default availability settings for a firm."""
    try:
        db = get_database()
        
        default_availability = FirmAvailability(
            firm_id=firm_id,
            timezone="America/Los_Angeles",
            weekly_schedule=WeeklySchedule()  # Uses default Monday-Friday 9-5
        )
        
        # Convert to dict for MongoDB insertion
        availability_dict = default_availability.dict(by_alias=True, exclude={"id"})
        
        result = db.firm_availability.insert_one(availability_dict)
        
        # Return the created availability with the new ID
        default_availability.id = str(result.inserted_id)
        
        logger.info(f"Created default availability for firm {firm_id}")
        return default_availability
        
    except Exception as e:
        logger.error(f"Error creating default availability for {firm_id}: {str(e)}")
        raise Exception(f"Failed to create default availability: {str(e)}")


def update_firm_availability(firm_id: str, timezone: str, weekly_schedule: WeeklySchedule) -> FirmAvailability:
    """Update firm availability settings."""
    try:
        db = get_database()
        
        update_data = {
            "timezone": timezone,
            "weekly_schedule": weekly_schedule.dict(),
            "updated_at": datetime.utcnow()
        }
        
        # Try to update existing record
        result = db.firm_availability.update_one(
            {"firm_id": firm_id},
            {"$set": update_data},
            upsert=True
        )
        
        if result.upserted_id:
            # New record was created
            availability_id = str(result.upserted_id)
            logger.info(f"Created new availability settings for firm {firm_id}")
        else:
            # Existing record was updated, get the ID
            existing = db.firm_availability.find_one({"firm_id": firm_id})
            availability_id = str(existing["_id"])
            logger.info(f"Updated availability settings for firm {firm_id}")
        
        # Return the updated availability
        return FirmAvailability(
            id=availability_id,
            firm_id=firm_id,
            timezone=timezone,
            weekly_schedule=weekly_schedule,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Error updating firm availability for {firm_id}: {str(e)}")
        raise Exception(f"Failed to update availability: {str(e)}")


def get_blocked_dates(firm_id: str) -> List[BlockedDate]:
    """Get all blocked dates for a firm."""
    try:
        db = get_database()
        blocked_dates_data = db.blocked_dates.find(
            {"firm_id": firm_id}
        ).sort("start_date", 1)
        
        blocked_dates = []
        for blocked_date_data in blocked_dates_data:
            if "_id" in blocked_date_data:
                blocked_date_data["_id"] = str(blocked_date_data["_id"])
            blocked_dates.append(BlockedDate(**blocked_date_data))
        
        return blocked_dates
        
    except Exception as e:
        logger.error(f"Error getting blocked dates for {firm_id}: {str(e)}")
        return []


def create_blocked_date(firm_id: str, start_date: date, end_date: date, reason: Optional[str] = None) -> tuple[BlockedDate, List[ConflictWarning]]:
    """Create a blocked date and return any conflicts with existing appointments."""
    try:
        db = get_database()
        
        # Check for conflicts with existing appointments
        conflicts = check_appointment_conflicts(firm_id, start_date, end_date)
        
        # Create the blocked date - convert dates to strings for MongoDB storage
        blocked_date_data = {
            "firm_id": firm_id,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "reason": reason,
            "created_at": datetime.utcnow()
        }
        
        result = db.blocked_dates.insert_one(blocked_date_data)
        
        blocked_date = BlockedDate(
            id=str(result.inserted_id),
            firm_id=firm_id,
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat(),
            reason=reason,
            created_at=datetime.utcnow()
        )
        
        logger.info(f"Created blocked date for firm {firm_id}: {start_date} to {end_date}")
        return blocked_date, conflicts
        
    except Exception as e:
        logger.error(f"Error creating blocked date for {firm_id}: {str(e)}")
        raise Exception(f"Failed to create blocked date: {str(e)}")


def delete_blocked_date(firm_id: str, blocked_date_id: str) -> bool:
    """Delete a blocked date."""
    try:
        db = get_database()
        
        result = db.blocked_dates.delete_one({
            "_id": ObjectId(blocked_date_id),
            "firm_id": firm_id
        })
        
        if result.deleted_count > 0:
            logger.info(f"Deleted blocked date {blocked_date_id} for firm {firm_id}")
            return True
        else:
            logger.warning(f"Blocked date {blocked_date_id} not found for firm {firm_id}")
            return False
            
    except Exception as e:
        logger.error(f"Error deleting blocked date {blocked_date_id} for {firm_id}: {str(e)}")
        raise Exception(f"Failed to delete blocked date: {str(e)}")


def check_appointment_conflicts(firm_id: str, start_date: date, end_date: date) -> List[ConflictWarning]:
    """Check for existing appointments that conflict with blocked dates."""
    try:
        db = get_database()
        conflicts = []
        
        # Query appointments that fall within the blocked date range
        # Convert dates to datetime for comparison
        start_datetime = datetime.combine(start_date, datetime.min.time())
        end_datetime = datetime.combine(end_date, datetime.max.time())
        
        appointments = db.appointments.find({
            "firm_id": firm_id,
            "start_time": {
                "$gte": start_datetime,
                "$lte": end_datetime
            }
        })
        
        for appointment in appointments:
            conflict = ConflictWarning(
                appointment_id=str(appointment["_id"]),
                title=appointment.get("title", f"Appointment with {appointment.get('client_name', 'Unknown')}"),
                client_name=appointment.get("client_name", "Unknown"),
                date=appointment["start_time"].strftime("%Y-%m-%d"),
                time=appointment["start_time"].strftime("%I:%M %p"),
                attendees=appointment.get("client_name", "Unknown")
            )
            conflicts.append(conflict)
        
        return conflicts
        
    except Exception as e:
        logger.error(f"Error checking appointment conflicts for {firm_id}: {str(e)}")
        return []


def is_time_available(firm_id: str, check_datetime: datetime) -> bool:
    """Check if a specific datetime is available based on availability settings and blocked dates."""
    try:
        # Get firm availability settings
        availability = get_firm_availability(firm_id)
        if not availability:
            return False
        
        # Check if the day is enabled in weekly schedule
        weekday = check_datetime.strftime("%A").lower()
        day_schedule = getattr(availability.weekly_schedule, weekday, None)
        
        if not day_schedule or not day_schedule.enabled:
            return False
        
        # Check if time is within business hours
        check_time = check_datetime.time()
        start_time = datetime.strptime(day_schedule.start_time, "%H:%M").time()
        end_time = datetime.strptime(day_schedule.end_time, "%H:%M").time()
        
        if not (start_time <= check_time <= end_time):
            return False
        
        # Check if date is blocked
        check_date = check_datetime.date()
        blocked_dates = get_blocked_dates(firm_id)
        
        for blocked_date in blocked_dates:
            try:
                # Convert string dates to date objects for comparison
                start_date = date.fromisoformat(blocked_date.start_date) if isinstance(blocked_date.start_date, str) else blocked_date.start_date
                end_date = date.fromisoformat(blocked_date.end_date) if isinstance(blocked_date.end_date, str) else blocked_date.end_date
                
                if start_date <= check_date <= end_date:
                    return False
            except (ValueError, TypeError) as e:
                logger.warning(f"Invalid date format in blocked date {blocked_date.id}: {e}")
                continue
        
        return True
        
    except Exception as e:
        logger.error(f"Error checking time availability for {firm_id}: {str(e)}")
        return False
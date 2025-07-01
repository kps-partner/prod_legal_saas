"""
API router for availability management endpoints.
"""
import logging
from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.modules.auth.services import get_current_user
from app.shared.models import User
from .schemas import (
    AvailabilityUpdateRequest,
    AvailabilityResponse,
    BlockedDateCreateRequest,
    BlockedDateResponse,
    BlockedDatesListResponse,
    BlockedDateConflictResponse,
    TimezonesResponse
)
from .services import (
    get_firm_availability,
    update_firm_availability,
    get_blocked_dates,
    create_blocked_date,
    delete_blocked_date,
    get_us_timezones
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/timezones", response_model=TimezonesResponse)
def get_timezones():
    """Get available US timezone options."""
    try:
        timezones = get_us_timezones()
        return TimezonesResponse(timezones=timezones)
    except Exception as e:
        logger.error(f"Error getting timezones: {e}")
        raise HTTPException(status_code=500, detail="Failed to get timezones")


@router.get("/availability", response_model=AvailabilityResponse)
def get_availability(current_user: User = Depends(get_current_user)):
    """Get firm availability settings."""
    try:
        availability = get_firm_availability(current_user.firm_id)
        if not availability:
            raise HTTPException(status_code=404, detail="Availability settings not found")
        
        return AvailabilityResponse(
            firm_id=availability.firm_id,
            timezone=availability.timezone,
            weekly_schedule=availability.weekly_schedule,
            created_at=availability.created_at.isoformat(),
            updated_at=availability.updated_at.isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting availability for firm {current_user.firm_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get availability settings")


@router.put("/availability", response_model=AvailabilityResponse)
def update_availability(
    request: AvailabilityUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """Update firm availability settings."""
    try:
        # Validate timezone
        valid_timezones = [tz.value for tz in get_us_timezones()]
        if request.timezone not in valid_timezones:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid timezone. Must be one of: {', '.join(valid_timezones)}"
            )
        
        # Validate time formats in weekly schedule
        for day_name in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']:
            day_schedule = getattr(request.weekly_schedule, day_name)
            if day_schedule.enabled:
                try:
                    # Validate time format (HH:MM)
                    start_parts = day_schedule.start_time.split(':')
                    end_parts = day_schedule.end_time.split(':')
                    
                    if len(start_parts) != 2 or len(end_parts) != 2:
                        raise ValueError("Invalid time format")
                    
                    start_hour, start_min = int(start_parts[0]), int(start_parts[1])
                    end_hour, end_min = int(end_parts[0]), int(end_parts[1])
                    
                    if not (0 <= start_hour <= 23 and 0 <= start_min <= 59):
                        raise ValueError("Invalid start time")
                    if not (0 <= end_hour <= 23 and 0 <= end_min <= 59):
                        raise ValueError("Invalid end time")
                    
                    # Check that end time is after start time
                    start_minutes = start_hour * 60 + start_min
                    end_minutes = end_hour * 60 + end_min
                    if end_minutes <= start_minutes:
                        raise ValueError(f"End time must be after start time for {day_name}")
                        
                except ValueError as ve:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid time format for {day_name}: {str(ve)}"
                    )
        
        availability = update_firm_availability(
            current_user.firm_id,
            request.timezone,
            request.weekly_schedule
        )
        
        return AvailabilityResponse(
            firm_id=availability.firm_id,
            timezone=availability.timezone,
            weekly_schedule=availability.weekly_schedule,
            created_at=availability.created_at.isoformat(),
            updated_at=availability.updated_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating availability for firm {current_user.firm_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update availability settings")


@router.get("/blocked-dates", response_model=BlockedDatesListResponse)
def get_blocked_dates_list(current_user: User = Depends(get_current_user)):
    """Get all blocked dates for the firm."""
    try:
        blocked_dates = get_blocked_dates(current_user.firm_id)
        
        blocked_dates_response = [
            BlockedDateResponse(
                id=bd.id,
                firm_id=bd.firm_id,
                start_date=bd.start_date,
                end_date=bd.end_date,
                reason=bd.reason,
                created_at=bd.created_at.isoformat()
            )
            for bd in blocked_dates
        ]
        
        return BlockedDatesListResponse(
            blocked_dates=blocked_dates_response,
            total=len(blocked_dates_response)
        )
        
    except Exception as e:
        logger.error(f"Error getting blocked dates for firm {current_user.firm_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get blocked dates")


@router.post("/blocked-dates", response_model=BlockedDateResponse)
def create_blocked_date_endpoint(
    request: BlockedDateCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a new blocked date."""
    try:
        # Validate date range
        if request.end_date < request.start_date:
            raise HTTPException(
                status_code=400,
                detail="End date must be on or after start date"
            )
        
        # Check if dates are in the future (optional - you might want to allow past dates)
        # today = date.today()
        # if request.start_date < today:
        #     raise HTTPException(
        #         status_code=400,
        #         detail="Cannot block dates in the past"
        #     )
        
        blocked_date, conflicts = create_blocked_date(
            current_user.firm_id,
            request.start_date,
            request.end_date,
            request.reason
        )
        
        # If there are conflicts, we could return them as a warning
        # For now, we'll just log them and proceed
        if conflicts:
            logger.warning(f"Created blocked date with {len(conflicts)} appointment conflicts")
        
        return BlockedDateResponse(
            id=blocked_date.id,
            firm_id=blocked_date.firm_id,
            start_date=blocked_date.start_date,
            end_date=blocked_date.end_date,
            reason=blocked_date.reason,
            created_at=blocked_date.created_at.isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating blocked date for firm {current_user.firm_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to create blocked date")


@router.post("/blocked-dates/check-conflicts", response_model=BlockedDateConflictResponse)
def check_blocked_date_conflicts(
    request: BlockedDateCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """Check for conflicts before creating a blocked date."""
    try:
        from .services import check_appointment_conflicts
        
        conflicts = check_appointment_conflicts(
            current_user.firm_id,
            request.start_date,
            request.end_date
        )
        
        message = f"Found {len(conflicts)} conflicting appointments" if conflicts else "No conflicts found"
        
        return BlockedDateConflictResponse(
            conflicts=conflicts,
            message=message
        )
        
    except Exception as e:
        logger.error(f"Error checking conflicts for firm {current_user.firm_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to check conflicts")


@router.delete("/blocked-dates/{blocked_date_id}")
def delete_blocked_date_endpoint(
    blocked_date_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a blocked date."""
    try:
        success = delete_blocked_date(current_user.firm_id, blocked_date_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Blocked date not found")
        
        return {"message": "Blocked date deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting blocked date {blocked_date_id} for firm {current_user.firm_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete blocked date")
"""
Request and response schemas for availability management API.
"""
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field
from .models import WeeklySchedule, TimeSlot


class AvailabilityUpdateRequest(BaseModel):
    """Request model for updating firm availability."""
    timezone: str = "America/Los_Angeles"
    weekly_schedule: WeeklySchedule


class AvailabilityResponse(BaseModel):
    """Response model for firm availability."""
    firm_id: str
    timezone: str
    weekly_schedule: WeeklySchedule
    created_at: str
    updated_at: str


class BlockedDateCreateRequest(BaseModel):
    """Request model for creating a blocked date."""
    start_date: date
    end_date: date
    reason: Optional[str] = None


class BlockedDateResponse(BaseModel):
    """Response model for blocked date."""
    id: str
    firm_id: str
    start_date: str  # ISO format string
    end_date: str    # ISO format string
    reason: Optional[str] = None
    created_at: str


class BlockedDatesListResponse(BaseModel):
    """Response model for list of blocked dates."""
    blocked_dates: List[BlockedDateResponse]
    total: int


class ConflictWarning(BaseModel):
    """Model for appointment conflicts when blocking dates."""
    appointment_id: str
    title: str
    client_name: str
    date: str
    time: str
    attendees: Optional[str] = None


class BlockedDateConflictResponse(BaseModel):
    """Response model when blocked date creation has conflicts."""
    conflicts: List[ConflictWarning]
    message: str


class TimezoneOption(BaseModel):
    """Model for timezone selection options."""
    value: str
    label: str
    offset: str


class TimezonesResponse(BaseModel):
    """Response model for available US timezones."""
    timezones: List[TimezoneOption]
"""
Pydantic models for availability management.
"""
from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, Field


class TimeSlot(BaseModel):
    """Time slot model for daily availability."""
    enabled: bool = False
    start_time: str = "09:00"  # Format: "HH:MM"
    end_time: str = "17:00"    # Format: "HH:MM"


class WeeklySchedule(BaseModel):
    """Weekly schedule model containing all days."""
    monday: TimeSlot = Field(default_factory=lambda: TimeSlot(enabled=True))
    tuesday: TimeSlot = Field(default_factory=lambda: TimeSlot(enabled=True))
    wednesday: TimeSlot = Field(default_factory=lambda: TimeSlot(enabled=True))
    thursday: TimeSlot = Field(default_factory=lambda: TimeSlot(enabled=True))
    friday: TimeSlot = Field(default_factory=lambda: TimeSlot(enabled=True))
    saturday: TimeSlot = Field(default_factory=lambda: TimeSlot(enabled=False))
    sunday: TimeSlot = Field(default_factory=lambda: TimeSlot(enabled=False))


class FirmAvailability(BaseModel):
    """Firm availability model for MongoDB storage."""
    id: Optional[str] = Field(default=None, alias="_id")
    firm_id: str
    timezone: str = "America/Los_Angeles"
    weekly_schedule: WeeklySchedule = Field(default_factory=WeeklySchedule)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class BlockedDate(BaseModel):
    """Blocked date model for MongoDB storage."""
    id: Optional[str] = Field(default=None, alias="_id")
    firm_id: str
    start_date: str  # Store as ISO format string
    end_date: str    # Store as ISO format string
    reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
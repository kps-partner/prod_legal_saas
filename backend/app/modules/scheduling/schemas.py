from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class GoogleAuthUrlResponse(BaseModel):
    """Response model for Google OAuth authorization URL."""
    auth_url: str


class GoogleCalendar(BaseModel):
    """Model for Google Calendar information."""
    id: str
    summary: str
    primary: Optional[bool] = False


class GoogleCalendarsResponse(BaseModel):
    """Response model for list of Google calendars."""
    calendars: List[GoogleCalendar]


class SelectCalendarRequest(BaseModel):
    """Request model for selecting a calendar."""
    calendar_id: str
    calendar_name: str


class CalendarConnectionStatus(BaseModel):
    """Response model for calendar connection status."""
    connected: bool
    calendar_id: Optional[str] = None
    calendar_name: Optional[str] = None
    connected_at: Optional[datetime] = None
    has_gmail_permissions: bool = False
    required_scopes: Optional[List[str]] = None
    needs_reauth: bool = False
    # Enhanced token status fields
    token_status: Optional[str] = None
    error_count: Optional[int] = None
    last_error: Optional[str] = None
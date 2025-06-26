from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class TimelineEventCreate(BaseModel):
    """Schema for creating a new timeline event (manual note)."""
    content: str


class TimelineEventResponse(BaseModel):
    """Schema for timeline event response."""
    id: str
    case_id: str
    firm_id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    type: str
    content: str
    created_at: datetime


class TimelineResponse(BaseModel):
    """Schema for timeline response containing all events for a case."""
    case_id: str
    events: List[TimelineEventResponse]
    total: int
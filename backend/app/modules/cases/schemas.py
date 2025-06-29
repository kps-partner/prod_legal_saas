from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.shared.models import CaseStatus


class CaseResponse(BaseModel):
    """Response model for case data."""
    id: str
    client_name: str
    client_email: EmailStr
    client_phone: str
    description: str
    case_type_id: Optional[str] = None
    case_type_name: Optional[str] = None
    status: CaseStatus
    priority: Optional[str] = None
    firm_id: str
    created_at: datetime
    updated_at: datetime
    last_activity: Optional[datetime] = None


class CaseUpdateRequest(BaseModel):
    """Request model for updating case status."""
    status: CaseStatus


class CasesListResponse(BaseModel):
    """Response model for cases list."""
    cases: List[CaseResponse]
    total: int
    by_status: dict
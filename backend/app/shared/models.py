from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """Enum for user role values."""
    ADMIN = "Admin"
    PARALEGAL = "Paralegal"


class UserStatus(str, Enum):
    """Enum for user status values."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING_PASSWORD_CHANGE = "pending_password_change"


class Firm(BaseModel):
    """Firm model for MongoDB storage."""
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    subscription_status: str = "inactive"
    stripe_customer_id: Optional[str] = None
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }


class User(BaseModel):
    """User model for MongoDB storage."""
    id: Optional[str] = Field(default=None, alias="_id")
    email: EmailStr
    hashed_password: str
    name: str
    role: str  # Keep as str for backward compatibility with existing "Admin" values
    firm_id: str  # This will store the ObjectId as a string
    status: UserStatus = UserStatus.ACTIVE
    password_expires_at: Optional[datetime] = None
    created_by: Optional[str] = None  # User ID of admin who created this user
    last_password_change: Optional[datetime] = None
    deleted_at: Optional[datetime] = None  # For soft delete functionality
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }


class CaseStatus(str, Enum):
    """Enum for case status values."""
    NEW_LEAD = "new_lead"
    MEETING_SCHEDULED = "meeting_scheduled"
    PENDING_REVIEW = "pending_review"
    ENGAGED = "engaged"
    CLOSED = "closed"
    ARCHIVED = "archived"


class CaseType(BaseModel):
    """Case type model for MongoDB storage."""
    id: Optional[str] = Field(default=None, alias="_id")
    name: str  # e.g., "Personal Injury", "Family Law", "Criminal Defense"
    firm_id: str  # Reference to the firm this case type belongs to
    description: Optional[str] = None
    is_active: bool = True  # Default to active when created
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }


class Case(BaseModel):
    """Case model for MongoDB storage."""
    id: Optional[str] = Field(default=None, alias="_id")
    # Client information
    client_name: str
    client_email: EmailStr
    client_phone: str
    # Case details
    description: str
    case_type_id: str  # Reference to CaseType
    status: CaseStatus = CaseStatus.NEW_LEAD
    # Firm association
    firm_id: str  # Reference to the firm handling this case
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }


class Appointment(BaseModel):
    """Appointment model for MongoDB storage."""
    id: Optional[str] = Field(default=None, alias="_id")
    case_id: str  # Reference to the Case this appointment is for
    scheduled_time: datetime
    duration_minutes: int = 60  # Default 1 hour appointment
    title: Optional[str] = None
    description: Optional[str] = None
    # Calendar integration
    calendar_event_id: Optional[str] = None  # Google Calendar event ID
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }


class IntakePageSetting(BaseModel):
    """Intake page settings model for MongoDB storage."""
    id: Optional[str] = Field(default=None, alias="_id")
    firm_id: str  # Reference to the firm these settings belong to
    welcome_message: str = "Welcome to our law firm. Please fill out the form below to get started."
    logo_url: Optional[str] = None
    # Additional customization options
    primary_color: Optional[str] = "#007bff"  # Default blue color
    show_phone_field: bool = True
    require_phone_field: bool = True
    custom_fields: Optional[list] = None  # For future extensibility
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }


class TimelineEvent(BaseModel):
    """Timeline event model for MongoDB storage."""
    id: Optional[str] = Field(default=None, alias="_id")
    case_id: str  # Reference to the Case this event belongs to
    firm_id: str  # Reference to the firm for security/filtering
    user_id: Optional[str] = None  # For user-generated notes, None for system events
    type: str  # e.g., 'note', 'status_change', 'meeting_scheduled', 'case_created'
    content: str  # The note content or description of the event
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }


class ConnectedCalendar(BaseModel):
    """Connected calendar model for MongoDB storage."""
    id: Optional[str] = Field(default=None, alias="_id")
    firm_id: str
    access_token: str
    refresh_token: Optional[str] = None  # Allow None for refresh_token
    scopes: Optional[list] = None  # Store the granted OAuth scopes
    calendar_id: Optional[str] = None
    calendar_name: Optional[str] = None
    connected_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }
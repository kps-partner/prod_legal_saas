"""Schemas for public intake form endpoints."""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class IntakeFormSubmission(BaseModel):
    """Schema for intake form submission from prospective clients."""
    client_name: str = Field(..., min_length=1, max_length=100, description="Full name of the prospective client")
    client_email: EmailStr = Field(..., description="Email address of the prospective client")
    client_phone: Optional[str] = Field(None, max_length=20, description="Phone number of the prospective client")
    case_type_id: str = Field(..., description="ID of the selected case type")
    description: str = Field(..., min_length=10, max_length=2000, description="Description of the legal matter")


class IntakeFormSubmissionResponse(BaseModel):
    """Response schema for successful intake form submission."""
    success: bool = True
    message: str = "Thank you for your submission. We will contact you soon."
    case_id: str = Field(..., description="ID of the created case")


class PublicIntakePageData(BaseModel):
    """Schema for public intake page data."""
    firm_name: str = Field(..., description="Name of the law firm")
    welcome_message: str = Field(..., description="Welcome message for prospective clients")
    logo_url: Optional[str] = Field(None, description="URL of the firm's logo")
    case_types: List[dict] = Field(..., description="Available case types for selection")
    show_phone_field: bool = Field(True, description="Whether to show the phone field")
    require_phone_field: bool = Field(True, description="Whether the phone field is required")
    primary_color: Optional[str] = Field("#007bff", description="Primary color for branding")


class CaseTypeOption(BaseModel):
    """Schema for case type options in the public form."""
    id: str = Field(..., description="Case type ID")
    name: str = Field(..., description="Case type name")
    description: Optional[str] = Field(None, description="Case type description")


class AvailableTimeSlot(BaseModel):
    """Schema for available time slots."""
    start_time: datetime = Field(..., description="Start time of the slot")
    end_time: datetime = Field(..., description="End time of the slot")
    formatted_time: str = Field(..., description="Human-readable time format")


class AvailabilityResponse(BaseModel):
    """Response schema for availability endpoint."""
    available_slots: List[AvailableTimeSlot] = Field(..., description="List of available time slots")
    firm_name: str = Field(..., description="Name of the law firm")


class BookingRequest(BaseModel):
    """Schema for booking request."""
    start_time: datetime = Field(..., description="Selected start time for the appointment")
    client_name: str = Field(..., description="Client name for the meeting")
    client_email: str = Field(..., description="Client email for the meeting")


class BookingResponse(BaseModel):
    """Response schema for successful booking."""
    success: bool = True
    message: str = Field(..., description="Success message")
    appointment_id: str = Field(..., description="ID of the created appointment")
    meeting_link: Optional[str] = Field(None, description="Google Meet link for the appointment")
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


# CaseType Schemas
class CaseTypeCreate(BaseModel):
    """Schema for creating a new case type."""
    name: str = Field(..., min_length=1, max_length=100, description="Name of the case type")
    description: Optional[str] = Field(None, max_length=500, description="Optional description of the case type")


class CaseTypeUpdate(BaseModel):
    """Schema for updating a case type."""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Name of the case type")
    description: Optional[str] = Field(None, max_length=500, description="Optional description of the case type")


class CaseTypeResponse(BaseModel):
    """Schema for returning case type data."""
    id: str = Field(..., alias="_id", description="Case type ID")
    name: str = Field(..., description="Name of the case type")
    firm_id: str = Field(..., description="ID of the firm this case type belongs to")
    description: Optional[str] = Field(None, description="Description of the case type")
    is_active: bool = Field(..., description="Whether the case type is active")
    created_at: datetime = Field(..., description="When the case type was created")
    updated_at: datetime = Field(..., description="When the case type was last updated")
    
    model_config = {
        "populate_by_name": True,
        "from_attributes": True
    }


# IntakePageSetting Schemas
class IntakePageSettingUpdate(BaseModel):
    """Schema for updating intake page settings."""
    welcome_message: Optional[str] = Field(None, max_length=1000, description="Welcome message for the intake page")
    logo_url: Optional[str] = Field(None, description="URL of the firm's logo")
    primary_color: Optional[str] = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$", description="Primary color in hex format")
    show_phone_field: Optional[bool] = Field(None, description="Whether to show the phone field")
    require_phone_field: Optional[bool] = Field(None, description="Whether the phone field is required")
    custom_fields: Optional[List[dict]] = Field(None, description="Custom fields for the intake form")


class IntakePageSettingResponse(BaseModel):
    """Schema for returning intake page settings."""
    id: str = Field(..., alias="_id", description="Settings ID")
    firm_id: str = Field(..., description="ID of the firm these settings belong to")
    welcome_message: str = Field(..., description="Welcome message for the intake page")
    logo_url: Optional[str] = Field(None, description="URL of the firm's logo")
    primary_color: str = Field(..., description="Primary color in hex format")
    show_phone_field: bool = Field(..., description="Whether to show the phone field")
    require_phone_field: bool = Field(..., description="Whether the phone field is required")
    custom_fields: Optional[List[dict]] = Field(None, description="Custom fields for the intake form")
    created_at: datetime = Field(..., description="When the settings were created")
    updated_at: datetime = Field(..., description="When the settings were last updated")
    
    model_config = {
        "populate_by_name": True,
        "from_attributes": True
    }
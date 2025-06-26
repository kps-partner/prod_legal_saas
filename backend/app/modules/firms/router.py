from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.modules.auth.services import get_current_user
from app.shared.models import User
from app.modules.firms.schemas import (
    CaseTypeCreate,
    CaseTypeUpdate,
    CaseTypeResponse,
    IntakePageSettingUpdate,
    IntakePageSettingResponse
)
from app.modules.firms.services import (
    create_case_type,
    get_case_types_by_firm,
    get_case_type_by_id,
    update_case_type,
    delete_case_type,
    get_intake_page_settings,
    update_intake_page_settings
)

router = APIRouter()


# Case Types Endpoints
@router.post("/case-types", response_model=CaseTypeResponse, status_code=status.HTTP_201_CREATED)
def create_case_type_endpoint(
    case_type_data: CaseTypeCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new case type for the authenticated user's firm."""
    case_type = create_case_type(current_user.firm_id, case_type_data)
    return CaseTypeResponse(
        id=case_type.id,
        name=case_type.name,
        firm_id=case_type.firm_id,
        description=case_type.description,
        is_active=case_type.is_active,
        created_at=case_type.created_at,
        updated_at=case_type.updated_at
    )


@router.get("/case-types", response_model=List[CaseTypeResponse])
def get_case_types_endpoint(current_user: User = Depends(get_current_user)):
    """Get all case types for the authenticated user's firm."""
    case_types = get_case_types_by_firm(current_user.firm_id)
    return [
        CaseTypeResponse(
            id=case_type.id,
            name=case_type.name,
            firm_id=case_type.firm_id,
            description=case_type.description,
            is_active=case_type.is_active,
            created_at=case_type.created_at,
            updated_at=case_type.updated_at
        )
        for case_type in case_types
    ]


@router.put("/case-types/{case_type_id}", response_model=CaseTypeResponse)
def update_case_type_endpoint(
    case_type_id: str,
    update_data: CaseTypeUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a specific case type."""
    case_type = update_case_type(current_user.firm_id, case_type_id, update_data)
    
    if not case_type:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case type not found"
        )
    
    return CaseTypeResponse(
        id=case_type.id,
        name=case_type.name,
        firm_id=case_type.firm_id,
        description=case_type.description,
        is_active=case_type.is_active,
        created_at=case_type.created_at,
        updated_at=case_type.updated_at
    )


@router.delete("/case-types/{case_type_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_case_type_endpoint(
    case_type_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a case type."""
    success = delete_case_type(current_user.firm_id, case_type_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Case type not found"
        )


# Intake Page Settings Endpoints
@router.get("/intake-page", response_model=IntakePageSettingResponse)
def get_intake_page_settings_endpoint(current_user: User = Depends(get_current_user)):
    """Get intake page settings for the authenticated user's firm."""
    settings = get_intake_page_settings(current_user.firm_id)
    return IntakePageSettingResponse(
        _id=settings.id,
        firm_id=settings.firm_id,
        welcome_message=settings.welcome_message,
        logo_url=settings.logo_url,
        primary_color=settings.primary_color,
        show_phone_field=settings.show_phone_field,
        require_phone_field=settings.require_phone_field,
        custom_fields=settings.custom_fields,
        created_at=settings.created_at,
        updated_at=settings.updated_at
    )


@router.put("/intake-page", response_model=IntakePageSettingResponse)
def update_intake_page_settings_endpoint(
    update_data: IntakePageSettingUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update intake page settings for the authenticated user's firm."""
    settings = update_intake_page_settings(current_user.firm_id, update_data)
    return IntakePageSettingResponse(
        _id=settings.id,
        firm_id=settings.firm_id,
        welcome_message=settings.welcome_message,
        logo_url=settings.logo_url,
        primary_color=settings.primary_color,
        show_phone_field=settings.show_phone_field,
        require_phone_field=settings.require_phone_field,
        custom_fields=settings.custom_fields,
        created_at=settings.created_at,
        updated_at=settings.updated_at
    )
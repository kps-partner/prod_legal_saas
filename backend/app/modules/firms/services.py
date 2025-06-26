from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.db import db
from app.shared.models import CaseType, IntakePageSetting
from app.modules.firms.schemas import (
    CaseTypeCreate, 
    CaseTypeUpdate, 
    IntakePageSettingUpdate
)


# CaseType Services
def create_case_type(firm_id: str, case_type_data: CaseTypeCreate) -> CaseType:
    """Create a new case type for a firm."""
    try:
        # Check if case type with same name already exists for this firm
        existing_case_type = db.case_types.find_one({
            "firm_id": firm_id,
            "name": case_type_data.name
        })
        
        if existing_case_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Case type '{case_type_data.name}' already exists for this firm"
            )
        
        # Create new case type
        now = datetime.utcnow()
        case_type_dict = {
            "name": case_type_data.name,
            "firm_id": firm_id,
            "description": case_type_data.description,
            "is_active": True,
            "created_at": now,
            "updated_at": now
        }
        
        result = db.case_types.insert_one(case_type_dict)
        case_type_dict["_id"] = str(result.inserted_id)
        
        return CaseType(**case_type_dict)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create case type: {str(e)}"
        )


def get_case_types_by_firm(firm_id: str) -> List[CaseType]:
    """Get all case types for a firm."""
    try:
        case_types = list(db.case_types.find({"firm_id": firm_id}))
        
        # Convert ObjectId to string for each case type
        for case_type in case_types:
            case_type["_id"] = str(case_type["_id"])
        
        return [CaseType(**case_type) for case_type in case_types]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve case types: {str(e)}"
        )


def get_case_type_by_id(firm_id: str, case_type_id: str) -> Optional[CaseType]:
    """Get a specific case type by ID, ensuring it belongs to the firm."""
    try:
        if not ObjectId.is_valid(case_type_id):
            return None
            
        case_type = db.case_types.find_one({
            "_id": ObjectId(case_type_id),
            "firm_id": firm_id
        })
        
        if case_type:
            case_type["_id"] = str(case_type["_id"])
            return CaseType(**case_type)
        
        return None
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve case type: {str(e)}"
        )


def update_case_type(firm_id: str, case_type_id: str, update_data: CaseTypeUpdate) -> Optional[CaseType]:
    """Update a case type."""
    try:
        if not ObjectId.is_valid(case_type_id):
            return None
        
        # Check if case type exists and belongs to the firm
        existing_case_type = db.case_types.find_one({
            "_id": ObjectId(case_type_id),
            "firm_id": firm_id
        })
        
        if not existing_case_type:
            return None
        
        # Check if new name conflicts with existing case types (if name is being updated)
        if update_data.name and update_data.name != existing_case_type["name"]:
            name_conflict = db.case_types.find_one({
                "firm_id": firm_id,
                "name": update_data.name,
                "_id": {"$ne": ObjectId(case_type_id)}
            })
            
            if name_conflict:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Case type '{update_data.name}' already exists for this firm"
                )
        
        # Build update dictionary with only provided fields
        update_dict = {"updated_at": datetime.utcnow()}
        if update_data.name is not None:
            update_dict["name"] = update_data.name
        if update_data.description is not None:
            update_dict["description"] = update_data.description
        
        if not update_dict:
            # No fields to update, return existing case type
            existing_case_type["_id"] = str(existing_case_type["_id"])
            return CaseType(**existing_case_type)
        
        # Perform update
        result = db.case_types.update_one(
            {"_id": ObjectId(case_type_id), "firm_id": firm_id},
            {"$set": update_dict}
        )
        
        if result.modified_count == 0:
            return None
        
        # Return updated case type
        updated_case_type = db.case_types.find_one({
            "_id": ObjectId(case_type_id),
            "firm_id": firm_id
        })
        
        if updated_case_type:
            updated_case_type["_id"] = str(updated_case_type["_id"])
            return CaseType(**updated_case_type)
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update case type: {str(e)}"
        )


def delete_case_type(firm_id: str, case_type_id: str) -> bool:
    """Delete a case type."""
    try:
        if not ObjectId.is_valid(case_type_id):
            return False
        
        # Check if there are any cases using this case type
        cases_using_type = db.cases.find_one({
            "case_type_id": case_type_id,
            "firm_id": firm_id
        })
        
        if cases_using_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete case type that is being used by existing cases"
            )
        
        # Delete the case type
        result = db.case_types.delete_one({
            "_id": ObjectId(case_type_id),
            "firm_id": firm_id
        })
        
        return result.deleted_count > 0
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete case type: {str(e)}"
        )


# IntakePageSetting Services
def get_intake_page_settings(firm_id: str) -> IntakePageSetting:
    """Get intake page settings for a firm. Create default settings if none exist."""
    try:
        settings = db.intake_page_settings.find_one({"firm_id": firm_id})
        
        if settings:
            settings["_id"] = str(settings["_id"])
            return IntakePageSetting(**settings)
        
        # Create default settings if none exist
        default_settings = {
            "firm_id": firm_id,
            "welcome_message": "Welcome to our law firm. Please fill out the form below to get started.",
            "logo_url": None,
            "primary_color": "#007bff",
            "show_phone_field": True,
            "require_phone_field": True,
            "custom_fields": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = db.intake_page_settings.insert_one(default_settings)
        default_settings["_id"] = str(result.inserted_id)
        
        return IntakePageSetting(**default_settings)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve intake page settings: {str(e)}"
        )


def update_intake_page_settings(firm_id: str, update_data: IntakePageSettingUpdate) -> IntakePageSetting:
    """Update intake page settings for a firm."""
    try:
        # Get existing settings or create default ones
        existing_settings = get_intake_page_settings(firm_id)
        
        # Build update dictionary with only provided fields
        update_dict = {"updated_at": datetime.utcnow()}
        
        if update_data.welcome_message is not None:
            update_dict["welcome_message"] = update_data.welcome_message
        if update_data.logo_url is not None:
            update_dict["logo_url"] = update_data.logo_url
        if update_data.primary_color is not None:
            update_dict["primary_color"] = update_data.primary_color
        if update_data.show_phone_field is not None:
            update_dict["show_phone_field"] = update_data.show_phone_field
        if update_data.require_phone_field is not None:
            update_dict["require_phone_field"] = update_data.require_phone_field
        if update_data.custom_fields is not None:
            update_dict["custom_fields"] = update_data.custom_fields
        
        # Perform update
        result = db.intake_page_settings.update_one(
            {"firm_id": firm_id},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Intake page settings not found"
            )
        
        # Return updated settings
        updated_settings = db.intake_page_settings.find_one({"firm_id": firm_id})
        if updated_settings:
            updated_settings["_id"] = str(updated_settings["_id"])
            return IntakePageSetting(**updated_settings)
        
        # Fallback - this shouldn't happen
        return existing_settings
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update intake page settings: {str(e)}"
        )
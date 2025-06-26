"""Services for public intake form functionality."""

import logging
import asyncio
from typing import Dict, List
from bson import ObjectId
from fastapi import HTTPException, status
from datetime import datetime

from app.core.db import get_database
from app.shared.models import Case, CaseStatus
from app.modules.public.schemas import IntakeFormSubmission, PublicIntakePageData, CaseTypeOption
from app.modules.email.services import send_intake_confirmation_email

logger = logging.getLogger(__name__)
db = get_database()


def get_public_intake_page_data(firm_id: str) -> PublicIntakePageData:
    """Get public intake page data for a specific firm."""
    try:
        # Validate ObjectId format first
        if not ObjectId.is_valid(firm_id):
            logger.error(f"Invalid ObjectId format for firm_id: {firm_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid firm ID format"
            )
        
        # Get firm information
        firm = db.firms.find_one({"_id": ObjectId(firm_id)})
        if not firm:
            logger.error(f"Firm not found with ID: {firm_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Firm not found"
            )
        
        # Get intake page settings
        settings = db.intake_page_settings.find_one({"firm_id": firm_id})
        if not settings:
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
            settings = db.intake_page_settings.find_one({"_id": result.inserted_id})
        
        # Get case types for this firm
        case_types_cursor = db.case_types.find({"firm_id": firm_id})
        case_types = []
        for case_type in case_types_cursor:
            case_types.append(CaseTypeOption(
                id=str(case_type["_id"]),
                name=case_type["name"],
                description=case_type.get("description")
            ).dict())
        
        return PublicIntakePageData(
            firm_name=firm.get("name", "Law Firm"),
            welcome_message=settings.get("welcome_message", "Welcome to our law firm. Please fill out the form below to get started."),
            logo_url=settings.get("logo_url"),
            case_types=case_types,
            show_phone_field=settings.get("show_phone_field", True),
            require_phone_field=settings.get("require_phone_field", True),
            primary_color=settings.get("primary_color", "#007bff")
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Failed to get public intake page data for firm {firm_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve intake page data"
        )


async def submit_intake_form(firm_id: str, submission: IntakeFormSubmission) -> str:
    """Submit an intake form and create a new case."""
    try:
        # Validate ObjectId format first
        if not ObjectId.is_valid(firm_id):
            logger.error(f"Invalid ObjectId format for firm_id: {firm_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid firm ID format"
            )
        
        # Validate that the firm exists
        firm = db.firms.find_one({"_id": ObjectId(firm_id)})
        if not firm:
            logger.error(f"Firm not found with ID: {firm_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Firm not found"
            )
        
        # Validate that the case type exists and belongs to this firm
        case_type = db.case_types.find_one({
            "_id": ObjectId(submission.case_type_id),
            "firm_id": firm_id
        })
        if not case_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid case type selected"
            )
        
        # Create new case from intake submission
        case_data = {
            "client_name": submission.client_name,
            "client_email": submission.client_email,
            "client_phone": submission.client_phone or "",
            "description": submission.description,
            "case_type_id": submission.case_type_id,
            "status": CaseStatus.NEW_LEAD.value,
            "firm_id": firm_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        # Insert the case into the database
        result = db.cases.insert_one(case_data)
        case_id = str(result.inserted_id)
        
        logger.info(f"New case created from intake form: {case_id} for firm {firm_id}")
        
        # Log timeline event for case creation
        try:
            from app.modules.timeline.services import create_timeline_event
            create_timeline_event(
                case_id=case_id,
                firm_id=firm_id,
                user_id=None,  # System-generated event, no specific user
                event_type="case_created",
                content=f"Case created from intake form submission by {submission.client_name}"
            )
            logger.info(f"Timeline event logged for case creation: {case_id}")
        except Exception as timeline_error:
            # Log error but don't fail the entire submission
            logger.error(f"Failed to log timeline event for case {case_id}: {str(timeline_error)}")
        
        # Send confirmation email to client (async, non-blocking)
        try:
            firm_name = firm.get("name", "Law Firm")
            submission_date = datetime.utcnow().strftime("%B %d, %Y")
            
            email_sent = await send_intake_confirmation_email(
                firm_id=firm_id,
                to_email=submission.client_email,
                client_name=submission.client_name,
                firm_name=firm_name,
                case_id=case_id,
                submission_date=submission_date
            )
            
            if email_sent:
                logger.info(f"Confirmation email sent successfully to {submission.client_email} for case {case_id}")
            else:
                logger.warning(f"Failed to send confirmation email to {submission.client_email} for case {case_id}")
                
        except Exception as email_error:
            # Log email error but don't fail the entire submission
            logger.error(f"Email sending error for case {case_id}: {str(email_error)}")
        
        return case_id
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Failed to submit intake form for firm {firm_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit intake form"
        )


def get_firm_by_subdomain(subdomain: str) -> Dict:
    """Get firm information by subdomain (for future use)."""
    try:
        firm = db.firms.find_one({"subdomain": subdomain})
        if not firm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Firm not found"
            )
        return firm
    except Exception as e:
        logger.error(f"Failed to get firm by subdomain {subdomain}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve firm information: {str(e)}"
        )


def get_firm_availability(firm_id: str) -> Dict:
    """Get available time slots for a firm."""
    try:
        # Validate ObjectId format first
        if not ObjectId.is_valid(firm_id):
            logger.error(f"Invalid ObjectId format for firm_id: {firm_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid firm ID format"
            )
        
        # Validate that the firm exists
        firm = db.firms.find_one({"_id": ObjectId(firm_id)})
        if not firm:
            logger.error(f"Firm not found with ID: {firm_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Firm not found"
            )
        
        # Get calendar availability using the scheduling service
        from app.modules.scheduling.services import get_calendar_availability
        
        try:
            available_slots = get_calendar_availability(firm_id)
            
            return {
                "available_slots": available_slots,
                "firm_name": firm.get("name", "Law Firm")
            }
            
        except Exception as calendar_error:
            logger.error(f"Calendar availability error for firm {firm_id}: {str(calendar_error)}")
            # Return empty availability if calendar is not connected
            return {
                "available_slots": [],
                "firm_name": firm.get("name", "Law Firm")
            }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Failed to get firm availability for firm {firm_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve availability"
        )


def create_appointment_booking(case_id: str, start_time: datetime, client_name: str, client_email: str) -> Dict:
    """Create an appointment booking for a case."""
    try:
        # Validate ObjectId format first
        if not ObjectId.is_valid(case_id):
            logger.error(f"Invalid ObjectId format for case_id: {case_id}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid case ID format"
            )
        
        # Get the case to find the firm_id
        case = db.cases.find_one({"_id": ObjectId(case_id)})
        if not case:
            logger.error(f"Case not found with ID: {case_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Case not found"
            )
        
        firm_id = case["firm_id"]
        
        # Create the calendar appointment using the scheduling service
        from app.modules.scheduling.services import create_calendar_appointment
        
        appointment_details = create_calendar_appointment(
            firm_id=firm_id,
            case_id=case_id,
            start_time=start_time,
            client_name=client_name,
            client_email=client_email
        )
        
        logger.info(f"Successfully created appointment {appointment_details['appointment_id']} for case {case_id}")
        
        return {
            "success": True,
            "message": "Your consultation has been scheduled successfully! You will receive a calendar invitation shortly.",
            "appointment_id": appointment_details["appointment_id"],
            "meeting_link": appointment_details.get("meeting_link")
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        logger.error(f"Failed to create appointment booking for case {case_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create appointment booking"
        )
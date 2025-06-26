"""Router for public intake form endpoints."""

from fastapi import APIRouter, HTTPException, status
from app.modules.public.schemas import (
    IntakeFormSubmission,
    IntakeFormSubmissionResponse,
    PublicIntakePageData,
    AvailabilityResponse,
    BookingRequest,
    BookingResponse
)
from app.modules.public.services import (
    get_public_intake_page_data,
    submit_intake_form,
    get_firm_availability,
    create_appointment_booking
)

router = APIRouter()


@router.get("/intake/{firm_id}", response_model=PublicIntakePageData)
def get_intake_page_data(firm_id: str):
    """Get public intake page data for a specific firm."""
    return get_public_intake_page_data(firm_id)


@router.post("/intake/{firm_id}/submit", response_model=IntakeFormSubmissionResponse)
async def submit_intake_form_endpoint(firm_id: str, submission: IntakeFormSubmission):
    """Submit an intake form for a specific firm."""
    case_id = await submit_intake_form(firm_id, submission)
    return IntakeFormSubmissionResponse(
        success=True,
        message="Thank you for your submission. We will contact you soon.",
        case_id=case_id
    )


@router.get("/availability/{firm_id}", response_model=AvailabilityResponse)
def get_firm_availability_endpoint(firm_id: str):
    """Get available time slots for a specific firm."""
    return get_firm_availability(firm_id)


@router.post("/booking/{case_id}", response_model=BookingResponse)
def create_booking_endpoint(case_id: str, booking: BookingRequest):
    """Create a booking for a specific case."""
    return create_appointment_booking(
        case_id=case_id,
        start_time=booking.start_time,
        client_name=booking.client_name,
        client_email=booking.client_email
    )
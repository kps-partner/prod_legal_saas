from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from app.modules.auth.services import get_current_user
from app.modules.scheduling.services import (
    generate_auth_url,
    exchange_code_for_tokens,
    store_calendar_connection,
    get_user_calendars,
    update_selected_calendar,
    get_calendar_connection_status
)
from app.modules.scheduling.schemas import (
    GoogleAuthUrlResponse,
    GoogleCalendarsResponse,
    GoogleCalendar,
    SelectCalendarRequest,
    CalendarConnectionStatus
)
from app.shared.models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/google/authorize", response_model=GoogleAuthUrlResponse)
def get_google_auth_url(current_user: User = Depends(get_current_user)):
    """Generate Google OAuth2 authorization URL."""
    try:
        # Use firm_id as state to identify the user after callback
        auth_url = generate_auth_url(state=current_user.firm_id)
        return GoogleAuthUrlResponse(auth_url=auth_url)
    except Exception as e:
        logger.error(f"Error generating auth URL: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate authorization URL")


@router.get("/google/callback")
def google_oauth_callback(
    code: str = Query(..., description="Authorization code from Google"),
    state: str = Query(..., description="State parameter (firm_id)")
):
    """Handle Google OAuth2 callback and store tokens."""
    try:
        # Exchange code for tokens
        token_data = exchange_code_for_tokens(code)
        
        # Store the connection in database
        connection_id = store_calendar_connection(
            firm_id=state,
            access_token=token_data['access_token'],
            refresh_token=token_data['refresh_token']
        )
        
        logger.info(f"Successfully stored calendar connection {connection_id} for firm {state}")
        
        # Redirect back to the integrations page
        return RedirectResponse(
            url="http://localhost:3000/settings/integrations?connected=true",
            status_code=302
        )
        
    except Exception as e:
        logger.error(f"Error in OAuth callback: {e}")
        return RedirectResponse(
            url="http://localhost:3000/settings/integrations?error=auth_failed",
            status_code=302
        )


@router.get("/google/calendars", response_model=GoogleCalendarsResponse)
def get_google_calendars(current_user: User = Depends(get_current_user)):
    """Get list of user's Google calendars."""
    try:
        from app.modules.scheduling.services import get_calendar_connection
        
        # Get the stored connection
        connection = get_calendar_connection(current_user.firm_id)
        if not connection:
            raise HTTPException(status_code=404, detail="Google Calendar not connected")
        
        # Fetch calendars from Google API
        calendar_data = get_user_calendars(connection.access_token, connection.refresh_token)
        
        calendars = [
            GoogleCalendar(
                id=cal['id'],
                summary=cal['summary'],
                primary=cal.get('primary', False)
            )
            for cal in calendar_data
        ]
        
        return GoogleCalendarsResponse(calendars=calendars)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching calendars: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch calendars")


@router.post("/google/calendars/select")
def select_google_calendar(
    request: SelectCalendarRequest,
    current_user: User = Depends(get_current_user)
):
    """Select a calendar for scheduling."""
    try:
        success = update_selected_calendar(
            firm_id=current_user.firm_id,
            calendar_id=request.calendar_id,
            calendar_name=request.calendar_name
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Calendar connection not found")
        
        return {"status": "success", "message": "Calendar selected successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error selecting calendar: {e}")
        raise HTTPException(status_code=500, detail="Failed to select calendar")


@router.get("/google/status", response_model=CalendarConnectionStatus)
def get_calendar_status(current_user: User = Depends(get_current_user)):
    """Get Google Calendar connection status."""
    try:
        status = get_calendar_connection_status(current_user.firm_id)
        return CalendarConnectionStatus(**status)
        
    except Exception as e:
        logger.error(f"Error getting calendar status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get calendar status")
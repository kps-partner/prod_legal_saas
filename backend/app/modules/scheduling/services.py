import os
from typing import Optional, List, Dict, Any
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from app.core.db import get_database
from app.core.config import settings
from app.shared.models import ConnectedCalendar
from app.modules.scheduling.token_refresh import token_refresh_service
from bson import ObjectId
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Google OAuth2 configuration - now includes Gmail API scope
SCOPES = settings.GMAIL_API_SCOPES
REDIRECT_URI = 'http://127.0.0.1:8000/api/v1/integrations/google/callback'


def get_google_oauth_flow() -> Flow:
    """Create and return Google OAuth2 flow."""
    client_config = {
        "web": {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [REDIRECT_URI]
        }
    }
    
    flow = Flow.from_client_config(
        client_config,
        scopes=SCOPES,
        redirect_uri=REDIRECT_URI
    )
    return flow


def generate_auth_url(state: str = None) -> str:
    """Generate Google OAuth2 authorization URL."""
    flow = get_google_oauth_flow()
    auth_url, _ = flow.authorization_url(
        access_type='offline',
        include_granted_scopes='true',
        prompt='consent',  # Force consent screen to ensure refresh token
        state=state
    )
    logger.info(f"OAUTH DEBUG: Generated auth URL with prompt=consent to force refresh token")
    return auth_url


def exchange_code_for_tokens(code: str) -> Dict[str, Any]:
    """Exchange authorization code for access and refresh tokens."""
    import requests
    
    # Use direct HTTP request to exchange code for tokens to bypass scope validation
    token_url = "https://oauth2.googleapis.com/token"
    
    data = {
        'code': code,
        'client_id': os.getenv("GOOGLE_CLIENT_ID"),
        'client_secret': os.getenv("GOOGLE_CLIENT_SECRET"),
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code'
    }
    
    try:
        logger.info(f"OAUTH DEBUG: Exchanging code for tokens")
        response = requests.post(token_url, data=data)
        response.raise_for_status()
        token_data = response.json()
        
        logger.info(f"OAUTH DEBUG: Token response keys: {list(token_data.keys())}")
        logger.info(f"OAUTH DEBUG: Has refresh_token: {'refresh_token' in token_data}")
        logger.info(f"OAUTH DEBUG: Refresh token value: {token_data.get('refresh_token', 'None')}")
        
        # Extract scopes from the response if available
        scopes = token_data.get('scope', '').split(' ') if token_data.get('scope') else SCOPES
        logger.info(f"OAUTH DEBUG: Extracted scopes: {scopes}")
        
        result = {
            'access_token': token_data['access_token'],
            'refresh_token': token_data.get('refresh_token'),
            'token_uri': token_url,
            'client_id': os.getenv("GOOGLE_CLIENT_ID"),
            'client_secret': os.getenv("GOOGLE_CLIENT_SECRET"),
            'scopes': scopes
        }
        
        logger.info(f"OAUTH DEBUG: Returning token data with refresh_token: {result['refresh_token'] is not None}")
        return result
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Error exchanging code for tokens: {str(e)}")
        raise Exception(f"Failed to exchange authorization code: {str(e)}")


def get_credentials_from_tokens(access_token: str, refresh_token: str = None, scopes: List[str] = None) -> Credentials:
    """Create Google credentials object from stored tokens."""
    # For existing tokens without stored scopes, try to use a minimal calendar scope
    # that should work with most existing tokens
    if scopes is None:
        scopes = ["https://www.googleapis.com/auth/calendar"]
        logger.info("Using minimal calendar scope for existing token")
    
    logger.info(f"Creating credentials with scopes: {scopes}")
    logger.info(f"Refresh token available: {'Yes' if refresh_token else 'No'}")
    
    return Credentials(
        token=access_token,
        refresh_token=refresh_token,  # Can be None
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=scopes
    )


def refresh_access_token(credentials: Credentials) -> Credentials:
    """
    Legacy function - now uses enhanced token refresh service.
    Kept for backward compatibility.
    """
    logger.warning("Using legacy refresh_access_token - consider using token_refresh_service directly")
    
    if credentials.expired and credentials.refresh_token:
        try:
            credentials.refresh(Request())
        except Exception as e:
            logger.error(f"Legacy token refresh failed: {str(e)}")
            raise
    return credentials


def auto_select_primary_calendar(access_token: str, refresh_token: str, scopes: List[str] = None) -> tuple[str, str]:
    """Auto-select user's primary calendar with fallback strategy."""
    try:
        logger.info("AUTO-SELECT: Attempting to auto-select primary calendar")
        calendars = get_user_calendars(access_token, refresh_token, scopes)
        
        # Strategy 1: Find calendar marked as primary
        for cal in calendars:
            if cal.get('primary', False):
                logger.info(f"AUTO-SELECT: Found primary calendar: {cal['summary']} ({cal['id']})")
                return cal['id'], cal['summary']
        
        # Strategy 2: Use first calendar in list
        if calendars:
            first_cal = calendars[0]
            logger.info(f"AUTO-SELECT: Using first calendar: {first_cal['summary']} ({first_cal['id']})")
            return first_cal['id'], first_cal['summary']
        
        # Strategy 3: Default to Google's primary calendar
        logger.info("AUTO-SELECT: Using default 'primary' calendar")
        return "primary", "Primary Calendar"
        
    except Exception as e:
        logger.warning(f"AUTO-SELECT: Failed to auto-select calendar: {e}, using default")
        return "primary", "Primary Calendar"


def get_user_calendars(access_token: str, refresh_token: str, scopes: List[str] = None) -> List[Dict[str, Any]]:
    """Fetch user's Google calendars."""
    try:
        logger.info(f"Attempting to fetch calendars with scopes: {scopes}")
        credentials = get_credentials_from_tokens(access_token, refresh_token, scopes)
        credentials = refresh_access_token(credentials)
        
        logger.info(f"Using credentials with scopes: {credentials.scopes}")
        service = build('calendar', 'v3', credentials=credentials)
        calendar_list = service.calendarList().list().execute()
        
        calendars = []
        for calendar_item in calendar_list.get('items', []):
            calendars.append({
                'id': calendar_item['id'],
                'summary': calendar_item['summary'],
                'primary': calendar_item.get('primary', False)
            })
        
        return calendars
    except HttpError as error:
        logger.error(f"An error occurred fetching calendars: {error}")
        raise Exception(f"Failed to fetch calendars: {error}")


def store_calendar_connection(firm_id: str, access_token: str, refresh_token: str, scopes: List[str] = None) -> str:
    """Store calendar connection in database with enhanced token management and auto-select primary calendar."""
    logger.info(f"STORE DEBUG: Storing connection for firm {firm_id}")
    logger.info(f"STORE DEBUG: Access token provided: {'Yes' if access_token else 'No'}")
    logger.info(f"STORE DEBUG: Refresh token provided: {'Yes' if refresh_token else 'No'}")
    logger.info(f"STORE DEBUG: Scopes provided: {scopes}")
    
    db = get_database()
    
    # Check if connection already exists for this firm
    existing = db.connected_calendars.find_one({"firm_id": firm_id})
    
    # Auto-select primary calendar
    try:
        calendar_id, calendar_name = auto_select_primary_calendar(access_token, refresh_token, scopes)
        logger.info(f"STORE DEBUG: Auto-selected calendar: {calendar_name} ({calendar_id})")
    except Exception as e:
        logger.warning(f"STORE DEBUG: Failed to auto-select calendar: {e}, using defaults")
        calendar_id, calendar_name = "primary", "Primary Calendar"
    
    calendar_data = {
        "firm_id": firm_id,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "scopes": scopes or SCOPES,
        "connected_at": datetime.utcnow(),
        # Auto-selected calendar fields
        "calendar_id": calendar_id,
        "calendar_name": calendar_name,
        # Initialize enhanced token management fields
        "token_status": "active",
        "token_expiry": None,  # Will be set when we get expiry info
        "last_refresh_attempt": None,
        "refresh_error_count": 0,
        "last_refresh_error": None,
        "updated_at": datetime.utcnow()
    }
    
    logger.info(f"STORE DEBUG: Calendar data to store: {dict(calendar_data, access_token='[REDACTED]', calendar_id=calendar_id, calendar_name=calendar_name)}")
    
    if existing:
        # Update existing connection, preserving some fields if they exist
        update_data = calendar_data.copy()
        # Don't reset error count if it's a reconnection after errors
        if existing.get("refresh_error_count", 0) > 0:
            logger.info(f"STORE DEBUG: Resetting error count from {existing.get('refresh_error_count')} to 0")
        
        logger.info(f"STORE DEBUG: Updating existing connection for firm {firm_id}")
        db.connected_calendars.update_one(
            {"firm_id": firm_id},
            {"$set": update_data}
        )
        return str(existing["_id"])
    else:
        # Create new connection
        logger.info(f"STORE DEBUG: Creating new connection for firm {firm_id}")
        result = db.connected_calendars.insert_one(calendar_data)
        return str(result.inserted_id)


def update_selected_calendar(firm_id: str, calendar_id: str, calendar_name: str) -> bool:
    """Update the selected calendar for a firm."""
    db = get_database()
    
    logger.info(f"Attempting to update calendar for firm_id: {firm_id}")
    logger.info(f"Calendar ID: {calendar_id}, Calendar Name: {calendar_name}")
    
    # First check if the connection exists
    existing = db.connected_calendars.find_one({"firm_id": firm_id})
    if not existing:
        logger.error(f"No calendar connection found for firm_id: {firm_id}")
        return False
    
    logger.info(f"Found existing connection: {existing['_id']}")
    
    result = db.connected_calendars.update_one(
        {"firm_id": firm_id},
        {"$set": {
            "calendar_id": calendar_id,
            "calendar_name": calendar_name
        }}
    )
    
    logger.info(f"Update result - matched: {result.matched_count}, modified: {result.modified_count}")
    
    return result.matched_count > 0  # Return true if we found the document, even if no modification was needed


def get_calendar_connection(firm_id: str) -> Optional[ConnectedCalendar]:
    """Get calendar connection for a firm."""
    db = get_database()
    
    connection_data = db.connected_calendars.find_one({"firm_id": firm_id})
    if connection_data:
        # Convert ObjectId to string for Pydantic validation
        connection_data["_id"] = str(connection_data["_id"])
        return ConnectedCalendar(**connection_data)
    
    return None


def get_calendar_connection_status(firm_id: str) -> Dict[str, Any]:
    """Get calendar connection status for a firm using enhanced token refresh service."""
    logger.info(f"Getting calendar connection status for firm: {firm_id}")
    
    # Get connection health from enhanced service
    health_info = token_refresh_service.get_connection_health(firm_id)
    
    if not health_info["connected"]:
        return {
            "connected": False,
            "calendar_id": None,
            "calendar_name": None,
            "connected_at": None,
            "has_gmail_permissions": False,
            "required_scopes": SCOPES,
            "needs_reauth": False
        }
    
    # Get connection details
    connection = get_calendar_connection(firm_id)
    if not connection:
        return {
            "connected": False,
            "calendar_id": None,
            "calendar_name": None,
            "connected_at": None,
            "has_gmail_permissions": False,
            "required_scopes": SCOPES,
            "needs_reauth": True
        }
    
    # Check Gmail scope availability
    has_gmail_scope = False
    gmail_scope = "https://www.googleapis.com/auth/gmail.send"
    
    try:
        # Get valid credentials using enhanced service
        token_result = token_refresh_service.get_valid_credentials(firm_id)
        
        if token_result.success and token_result.credentials:
            logger.info(f"Credentials scopes for firm {firm_id}: {token_result.credentials.scopes}")
            
            # Check if Gmail scope is present
            if token_result.credentials.scopes and gmail_scope in token_result.credentials.scopes:
                has_gmail_scope = True
                logger.info(f"Gmail scope found for firm {firm_id}")
            else:
                logger.info(f"Gmail scope NOT found for firm {firm_id}")
        else:
            logger.warning(f"Failed to get valid credentials for firm {firm_id}: {token_result.error}")
    
    except Exception as e:
        logger.warning(f"Failed to check Gmail scope for firm {firm_id}: {str(e)}")
    
    return {
        "connected": True,
        "calendar_id": connection.calendar_id,
        "calendar_name": connection.calendar_name,
        "connected_at": connection.connected_at,
        "has_gmail_permissions": has_gmail_scope,
        "required_scopes": SCOPES,
        "needs_reauth": health_info["needs_reauth"],
        "token_status": health_info.get("status", "unknown"),
        "error_count": health_info.get("error_count", 0),
        "last_error": health_info.get("last_error")
    }


def get_calendar_availability(firm_id: str, days: int = 60) -> List[Dict[str, Any]]:
    """Get available time slots for a firm's calendar, respecting availability settings and blocked dates."""
    try:
        logger.info(f"TIMEZONE DEBUG: Getting calendar availability for firm {firm_id}")
        connection = get_calendar_connection(firm_id)
        if not connection or not connection.calendar_id:
            raise Exception("No calendar connection found for this firm")
        
        # Get firm availability settings
        from app.modules.availability.services import get_firm_availability, get_blocked_dates
        availability = get_firm_availability(firm_id)
        blocked_dates = get_blocked_dates(firm_id)
        
        # Use enhanced token refresh service
        token_result = token_refresh_service.get_valid_credentials(firm_id)
        if not token_result.success:
            logger.error(f"Failed to get valid credentials for firm {firm_id}: {token_result.error}")
            if token_result.needs_reauth:
                raise Exception("Google Calendar authentication has expired. Please reconnect your calendar in the integrations settings.")
            else:
                raise Exception(f"Calendar authentication error: {token_result.error}")
        
        try:
            service = build('calendar', 'v3', credentials=token_result.credentials)
        except Exception as service_error:
            logger.error(f"Failed to build calendar service for firm {firm_id}: {str(service_error)}")
            raise Exception("Failed to connect to Google Calendar service")
        
        # Get current time and end time
        now = datetime.utcnow()
        end_time = now + timedelta(days=days)
        
        # Get free/busy information from Google Calendar
        freebusy_query = {
            'timeMin': now.isoformat() + 'Z',
            'timeMax': end_time.isoformat() + 'Z',
            'items': [{'id': connection.calendar_id}]
        }
        
        freebusy_result = service.freebusy().query(body=freebusy_query).execute()
        busy_times = freebusy_result['calendars'][connection.calendar_id].get('busy', [])
        
        # Generate available slots based on firm availability settings
        available_slots = []
        current_date = now.date()
        
        for day_offset in range(days):
            check_date = current_date + timedelta(days=day_offset)
            weekday_name = check_date.strftime("%A").lower()
            
            # Check if date is blocked
            date_is_blocked = False
            for blocked_date in blocked_dates:
                # Convert string dates to date objects for comparison
                try:
                    from datetime import date
                    start_date = date.fromisoformat(blocked_date.start_date) if isinstance(blocked_date.start_date, str) else blocked_date.start_date
                    end_date = date.fromisoformat(blocked_date.end_date) if isinstance(blocked_date.end_date, str) else blocked_date.end_date
                    
                    if start_date <= check_date <= end_date:
                        date_is_blocked = True
                        break
                except (ValueError, TypeError) as e:
                    logger.warning(f"Invalid date format in blocked date {blocked_date.id}: {e}")
                    continue
            
            if date_is_blocked:
                continue
            
            # Get availability settings for this day
            if availability and availability.weekly_schedule:
                day_schedule = getattr(availability.weekly_schedule, weekday_name, None)
                if not day_schedule or not day_schedule.enabled:
                    continue
                
                # Parse business hours
                try:
                    start_hour, start_min = map(int, day_schedule.start_time.split(':'))
                    end_hour, end_min = map(int, day_schedule.end_time.split(':'))
                except (ValueError, AttributeError):
                    # Fallback to default business hours if parsing fails
                    start_hour, start_min = 9, 0
                    end_hour, end_min = 17, 0
            else:
                # Fallback to default business hours (9 AM to 5 PM, weekdays only)
                if check_date.weekday() >= 5:  # Skip weekends
                    continue
                start_hour, start_min = 9, 0
                end_hour, end_min = 17, 0
            
            # Generate hourly slots within business hours
            current_hour = start_hour
            while current_hour < end_hour:
                slot_start = datetime.combine(check_date, datetime.min.time().replace(hour=current_hour, minute=start_min if current_hour == start_hour else 0))
                slot_end = slot_start + timedelta(hours=1)
                
                # Don't go past business hours
                business_end = datetime.combine(check_date, datetime.min.time().replace(hour=end_hour, minute=end_min))
                if slot_end > business_end:
                    break
                
                # Skip past times
                if slot_start <= now:
                    current_hour += 1
                    continue
                
                # Check if slot conflicts with Google Calendar busy times
                slot_is_free = True
                for busy_period in busy_times:
                    busy_start = datetime.fromisoformat(busy_period['start'].replace('Z', '+00:00')).replace(tzinfo=None)
                    busy_end = datetime.fromisoformat(busy_period['end'].replace('Z', '+00:00')).replace(tzinfo=None)
                    
                    if (slot_start < busy_end and slot_end > busy_start):
                        slot_is_free = False
                        break
                
                if slot_is_free:
                    logger.info(f"TIMEZONE DEBUG: Adding available slot - start_time: {slot_start} (type: {type(slot_start)})")
                    logger.info(f"TIMEZONE DEBUG: Slot timezone info: {slot_start.tzinfo}")
                    available_slots.append({
                        'start_time': slot_start,
                        'end_time': slot_end,
                        'formatted_time': slot_start.strftime('%A, %B %d at %I:%M %p')
                    })
                
                current_hour += 1
        
        return available_slots
        
    except Exception as e:
        logger.error(f"Failed to get calendar availability for firm {firm_id}: {str(e)}")
        raise Exception(f"Failed to get calendar availability: {str(e)}")


def create_calendar_appointment(firm_id: str, case_id: str, start_time: datetime, client_name: str, client_email: str, client_timezone: str = None) -> Dict[str, Any]:
    """Create a calendar appointment and return appointment details."""
    try:
        logger.info(f"TIMEZONE DEBUG: Creating calendar appointment for firm {firm_id}, case {case_id}")
        logger.info(f"TIMEZONE DEBUG: Received start_time: {start_time} (type: {type(start_time)})")
        logger.info(f"TIMEZONE DEBUG: start_time timezone info: {start_time.tzinfo}")
        logger.info(f"TIMEZONE DEBUG: Client timezone: {client_timezone}")
        
        # Get firm availability settings to determine firm timezone
        from app.modules.availability.services import get_firm_availability
        availability = get_firm_availability(firm_id)
        firm_timezone = availability.timezone if availability else "America/Los_Angeles"
        logger.info(f"TIMEZONE DEBUG: Firm timezone: {firm_timezone}")
        
        # Determine which timezone to use for the calendar event
        # Priority: client_timezone > firm_timezone > UTC
        event_timezone = client_timezone or firm_timezone
        logger.info(f"TIMEZONE DEBUG: Using event timezone: {event_timezone}")
        
        connection = get_calendar_connection(firm_id)
        if not connection or not connection.calendar_id:
            logger.error(f"No calendar connection found for firm {firm_id}")
            raise Exception("No calendar connection found for this firm")
        
        # Use enhanced token refresh service
        token_result = token_refresh_service.get_valid_credentials(firm_id)
        if not token_result.success:
            logger.error(f"Failed to get valid credentials for appointment creation for firm {firm_id}: {token_result.error}")
            if token_result.needs_reauth:
                raise Exception("Google Calendar authentication has expired. Please reconnect your calendar in the integrations settings.")
            else:
                raise Exception(f"Calendar authentication error: {token_result.error}")
        
        service = build('calendar', 'v3', credentials=token_result.credentials)
        
        # Calculate end time (1 hour appointment)
        end_time = start_time + timedelta(hours=1)
        
        # Create the event with proper timezone handling
        logger.info(f"TIMEZONE DEBUG: Creating event with start_time: {start_time.isoformat()}")
        logger.info(f"TIMEZONE DEBUG: Creating event with end_time: {end_time.isoformat()}")
        
        # Format datetime for Google Calendar API
        # If we have timezone info, use it; otherwise treat as naive datetime in the event timezone
        if start_time.tzinfo is not None:
            start_datetime_str = start_time.isoformat()
            end_datetime_str = end_time.isoformat()
        else:
            # Naive datetime - assume it's in the event timezone
            start_datetime_str = start_time.isoformat()
            end_datetime_str = end_time.isoformat()
        
        logger.info(f"TIMEZONE DEBUG: Final start_datetime_str: {start_datetime_str}")
        logger.info(f"TIMEZONE DEBUG: Final end_datetime_str: {end_datetime_str}")
        logger.info(f"TIMEZONE DEBUG: Final event_timezone: {event_timezone}")
        
        event = {
            'summary': f'Legal Consultation - {client_name}',
            'description': f'Legal consultation with {client_name} ({client_email})\nCase ID: {case_id}',
            'start': {
                'dateTime': start_datetime_str,
                'timeZone': event_timezone,
            },
            'end': {
                'dateTime': end_datetime_str,
                'timeZone': event_timezone,
            },
            'attendees': [
                {'email': client_email, 'displayName': client_name}
            ],
            'conferenceData': {
                'createRequest': {
                    'requestId': f'meet-{case_id}-{int(start_time.timestamp())}',
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                }
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},  # 1 day before
                    {'method': 'popup', 'minutes': 30},       # 30 minutes before
                ],
            },
        }
        
        # Create the event with conference data
        created_event = service.events().insert(
            calendarId=connection.calendar_id,
            body=event,
            conferenceDataVersion=1,
            sendUpdates='all'  # This ensures email invitations are sent to attendees
        ).execute()
        
        logger.info(f"Calendar event created successfully with email notifications, ID: {created_event.get('id')}")
        
        # Extract Google Meet link
        meet_link = None
        if 'conferenceData' in created_event and 'entryPoints' in created_event['conferenceData']:
            for entry_point in created_event['conferenceData']['entryPoints']:
                if entry_point['entryPointType'] == 'video':
                    meet_link = entry_point['uri']
                    break
        
        # Create appointment record in database
        from app.core.db import get_database
        from app.shared.models import Appointment
        
        db = get_database()
        appointment_data = {
            "case_id": case_id,
            "scheduled_time": start_time,
            "duration_minutes": 60,
            "title": f"Legal Consultation - {client_name}",
            "description": f"Legal consultation with {client_name}",
            "calendar_event_id": created_event['id'],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = db.appointments.insert_one(appointment_data)
        appointment_id = str(result.inserted_id)
        
        # Update case status to 'Meeting Scheduled'
        from app.shared.models import CaseStatus
        db.cases.update_one(
            {"_id": ObjectId(case_id)},
            {"$set": {
                "status": CaseStatus.MEETING_SCHEDULED.value,
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Log timeline event for meeting scheduling
        try:
            from app.modules.timeline.services import create_timeline_event
            create_timeline_event(
                case_id=case_id,
                firm_id=firm_id,
                user_id=None,  # System-generated event, no specific user
                event_type="meeting_scheduled",
                content=f"Meeting scheduled with {client_name} for {start_time.strftime('%B %d, %Y at %I:%M %p')}"
            )
            logger.info(f"Timeline event logged for meeting scheduling: {case_id}")
        except Exception as timeline_error:
            # Log error but don't fail the entire appointment creation
            logger.error(f"Failed to log timeline event for appointment {appointment_id}: {str(timeline_error)}")
        
        logger.info(f"Successfully created appointment {appointment_id} for case {case_id}")
        
        return {
            'appointment_id': appointment_id,
            'calendar_event_id': created_event['id'],
            'meeting_link': meet_link,
            'start_time': start_time,
            'end_time': end_time
        }
        
    except Exception as e:
        logger.error(f"Failed to create calendar appointment for case {case_id}: {str(e)}")
        raise Exception(f"Failed to create calendar appointment: {str(e)}")
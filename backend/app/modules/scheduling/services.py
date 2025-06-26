import os
from typing import Optional, List, Dict, Any
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from app.core.db import get_database
from app.shared.models import ConnectedCalendar
from bson import ObjectId
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

# Google OAuth2 configuration
SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
]
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
        state=state
    )
    return auth_url


def exchange_code_for_tokens(code: str) -> Dict[str, Any]:
    """Exchange authorization code for access and refresh tokens."""
    flow = get_google_oauth_flow()
    flow.fetch_token(code=code)
    
    credentials = flow.credentials
    return {
        'access_token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }


def get_credentials_from_tokens(access_token: str, refresh_token: str) -> Credentials:
    """Create Google credentials object from stored tokens."""
    return Credentials(
        token=access_token,
        refresh_token=refresh_token,
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.getenv("GOOGLE_CLIENT_ID"),
        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        scopes=SCOPES
    )


def refresh_access_token(credentials: Credentials) -> Credentials:
    """Refresh the access token if needed."""
    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())
    return credentials


def get_user_calendars(access_token: str, refresh_token: str) -> List[Dict[str, Any]]:
    """Fetch user's Google calendars."""
    try:
        credentials = get_credentials_from_tokens(access_token, refresh_token)
        credentials = refresh_access_token(credentials)
        
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


def store_calendar_connection(firm_id: str, access_token: str, refresh_token: str) -> str:
    """Store calendar connection in database."""
    db = get_database()
    
    # Check if connection already exists for this firm
    existing = db.connected_calendars.find_one({"firm_id": firm_id})
    
    calendar_data = {
        "firm_id": firm_id,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "connected_at": datetime.utcnow()
    }
    
    if existing:
        # Update existing connection
        db.connected_calendars.update_one(
            {"firm_id": firm_id},
            {"$set": calendar_data}
        )
        return str(existing["_id"])
    else:
        # Create new connection
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
    """Get calendar connection status for a firm."""
    connection = get_calendar_connection(firm_id)
    
    if connection:
        return {
            "connected": True,
            "calendar_id": connection.calendar_id,
            "calendar_name": connection.calendar_name,
            "connected_at": connection.connected_at
        }
    else:
        return {
            "connected": False,
            "calendar_id": None,
            "calendar_name": None,
            "connected_at": None
        }


def get_calendar_availability(firm_id: str, days: int = 14) -> List[Dict[str, Any]]:
    """Get available time slots for a firm's calendar."""
    try:
        connection = get_calendar_connection(firm_id)
        if not connection or not connection.calendar_id:
            raise Exception("No calendar connection found for this firm")
        
        credentials = get_credentials_from_tokens(connection.access_token, connection.refresh_token)
        credentials = refresh_access_token(credentials)
        
        service = build('calendar', 'v3', credentials=credentials)
        
        # Get current time and end time (14 days from now)
        import pytz
        
        now = datetime.utcnow()
        end_time = now + timedelta(days=days)
        
        # Get free/busy information
        freebusy_query = {
            'timeMin': now.isoformat() + 'Z',
            'timeMax': end_time.isoformat() + 'Z',
            'items': [{'id': connection.calendar_id}]
        }
        
        freebusy_result = service.freebusy().query(body=freebusy_query).execute()
        busy_times = freebusy_result['calendars'][connection.calendar_id].get('busy', [])
        
        # Generate available slots (9 AM to 5 PM, weekdays only)
        available_slots = []
        current_date = now.date()
        
        for day_offset in range(days):
            check_date = current_date + timedelta(days=day_offset)
            
            # Skip weekends
            if check_date.weekday() >= 5:  # Saturday = 5, Sunday = 6
                continue
            
            # Generate hourly slots from 9 AM to 5 PM
            for hour in range(9, 17):  # 9 AM to 4 PM (last slot starts at 4 PM)
                slot_start = datetime.combine(check_date, datetime.min.time().replace(hour=hour))
                slot_end = slot_start + timedelta(hours=1)
                
                # Skip past times
                if slot_start <= now:
                    continue
                
                # Check if slot conflicts with busy times
                slot_is_free = True
                for busy_period in busy_times:
                    busy_start = datetime.fromisoformat(busy_period['start'].replace('Z', '+00:00')).replace(tzinfo=None)
                    busy_end = datetime.fromisoformat(busy_period['end'].replace('Z', '+00:00')).replace(tzinfo=None)
                    
                    if (slot_start < busy_end and slot_end > busy_start):
                        slot_is_free = False
                        break
                
                if slot_is_free:
                    available_slots.append({
                        'start_time': slot_start,
                        'end_time': slot_end,
                        'formatted_time': slot_start.strftime('%A, %B %d at %I:%M %p')
                    })
        
        return available_slots
        
    except Exception as e:
        logger.error(f"Failed to get calendar availability for firm {firm_id}: {str(e)}")
        raise Exception(f"Failed to get calendar availability: {str(e)}")


def create_calendar_appointment(firm_id: str, case_id: str, start_time: datetime, client_name: str, client_email: str) -> Dict[str, Any]:
    """Create a calendar appointment and return appointment details."""
    try:
        connection = get_calendar_connection(firm_id)
        if not connection or not connection.calendar_id:
            raise Exception("No calendar connection found for this firm")
        
        credentials = get_credentials_from_tokens(connection.access_token, connection.refresh_token)
        credentials = refresh_access_token(credentials)
        
        service = build('calendar', 'v3', credentials=credentials)
        
        # Calculate end time (1 hour appointment)
        end_time = start_time + timedelta(hours=1)
        
        # Create the event
        event = {
            'summary': f'Legal Consultation - {client_name}',
            'description': f'Legal consultation with {client_name} ({client_email})\nCase ID: {case_id}',
            'start': {
                'dateTime': start_time.isoformat() + 'Z',
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_time.isoformat() + 'Z',
                'timeZone': 'UTC',
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
            conferenceDataVersion=1
        ).execute()
        
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
                "status": CaseStatus.IN_PROGRESS.value,
                "updated_at": datetime.utcnow()
            }}
        )
        
        logger.info(f"Created appointment {appointment_id} for case {case_id}")
        
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
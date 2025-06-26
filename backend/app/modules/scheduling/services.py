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
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Google OAuth2 configuration
SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
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
    
    result = db.connected_calendars.update_one(
        {"firm_id": firm_id},
        {"$set": {
            "calendar_id": calendar_id,
            "calendar_name": calendar_name
        }}
    )
    
    return result.modified_count > 0


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
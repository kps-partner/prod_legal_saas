"""Email service for sending notifications using Gmail API."""

import logging
from typing import Optional, Dict, Any
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

from app.core.config import settings
from app.core.db import get_database
from app.modules.scheduling.services import get_credentials_from_tokens, refresh_access_token

logger = logging.getLogger(__name__)

class GmailEmailService:
    """Service for sending emails using Gmail API."""
    
    def __init__(self):
        self._setup_jinja()
    
    def _setup_jinja(self):
        """Setup Jinja2 template environment."""
        # Get the templates directory path
        templates_dir = Path(__file__).parent / "templates"
        
        # Create Jinja2 environment
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(templates_dir)),
            autoescape=select_autoescape(['html', 'xml'])
        )
    
    async def get_firm_gmail_credentials(self, firm_id: str) -> Optional[Credentials]:
        """Get Gmail credentials for a firm from the connected calendar."""
        try:
            logger.info(f"EMAIL SERVICE DEBUG: Getting Gmail credentials for firm {firm_id}")
            db = get_database()
            connection = db.connected_calendars.find_one({"firm_id": firm_id})
            
            if not connection:
                logger.error(f"EMAIL SERVICE DEBUG: No Google connection found for firm {firm_id}")
                return None
            
            if not connection.get('access_token'):
                logger.error(f"EMAIL SERVICE DEBUG: Missing access token for firm {firm_id}")
                return None
            
            # Check if refresh token is missing
            refresh_token = connection.get('refresh_token')
            if not refresh_token:
                logger.warning(f"EMAIL SERVICE DEBUG: Missing refresh token for firm {firm_id} - connection may expire soon")
                logger.warning(f"EMAIL SERVICE DEBUG: Will attempt to use current access token, but user should re-authenticate")
            
            # Get stored scopes from the connection
            stored_scopes = connection.get('scopes', None)
            logger.info(f"EMAIL SERVICE DEBUG: stored scopes for firm {firm_id}: {stored_scopes}")
            
            # Create credentials with stored scopes (refresh_token can be None)
            credentials = get_credentials_from_tokens(
                connection['access_token'],
                refresh_token,  # This can be None
                stored_scopes
            )
            
            logger.info(f"EMAIL SERVICE DEBUG: Created credentials with scopes: {credentials.scopes}")
            
            # Check if Gmail scope is available
            gmail_scope = "https://www.googleapis.com/auth/gmail.send"
            if not credentials.scopes or gmail_scope not in credentials.scopes:
                logger.error(f"EMAIL SERVICE DEBUG: Gmail scope not available for firm {firm_id}. Available scopes: {credentials.scopes}")
                logger.error(f"EMAIL SERVICE DEBUG: Looking for scope: {gmail_scope}")
                return None
            
            # Only try to refresh if we have a refresh token and the token is expired
            if refresh_token and credentials.expired:
                logger.info(f"EMAIL SERVICE DEBUG: Token expired, attempting refresh")
                try:
                    credentials = refresh_access_token(credentials)
                    logger.info(f"EMAIL SERVICE DEBUG: After refresh, credentials valid: {not credentials.expired}")
                    
                    # Update tokens in database if they were refreshed
                    if credentials.token != connection['access_token']:
                        logger.info(f"EMAIL SERVICE DEBUG: Updating refreshed token in database")
                        db.connected_calendars.update_one(
                            {"firm_id": firm_id},
                            {"$set": {"access_token": credentials.token}}
                        )
                except Exception as refresh_error:
                    logger.error(f"EMAIL SERVICE DEBUG: Failed to refresh token: {refresh_error}")
                    return None
            elif not refresh_token and credentials.expired:
                logger.error(f"EMAIL SERVICE DEBUG: Token expired and no refresh token available for firm {firm_id}")
                return None
            else:
                logger.info(f"EMAIL SERVICE DEBUG: Using existing token (expired: {credentials.expired})")
            
            logger.info(f"EMAIL SERVICE DEBUG: Gmail credentials successfully obtained for firm {firm_id}")
            return credentials
            
        except Exception as e:
            logger.error(f"EMAIL SERVICE DEBUG: Failed to get Gmail credentials for firm {firm_id}: {str(e)}")
            import traceback
            logger.error(f"EMAIL SERVICE DEBUG: Traceback: {traceback.format_exc()}")
            return None
    
    def create_gmail_message(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> dict:
        """Create a Gmail API message."""
        try:
            # Create message
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["To"] = to_email
            
            # Set from address (will be the authenticated user's email)
            if from_name:
                message["From"] = f"{from_name} <{from_email or 'me'}>"
            else:
                message["From"] = from_email or "me"
            
            # Add text content if provided
            if text_content:
                text_part = MIMEText(text_content, "plain")
                message.attach(text_part)
            
            # Add HTML content
            html_part = MIMEText(html_content, "html")
            message.attach(html_part)
            
            # Encode message for Gmail API
            raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode('utf-8')
            
            return {'raw': raw_message}
            
        except Exception as e:
            logger.error(f"Failed to create Gmail message: {str(e)}")
            raise
    
    async def send_email_via_gmail_api(
        self,
        firm_id: str,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_name: Optional[str] = None
    ) -> bool:
        """
        Send an email using Gmail API.
        
        Args:
            firm_id: ID of the firm (to get Gmail credentials)
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text content (optional)
            from_name: Sender name (defaults to config)
            
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            logger.info(f"EMAIL SERVICE DEBUG: Attempting to send email to {to_email} for firm {firm_id}")
            logger.info(f"EMAIL SERVICE DEBUG: Subject: {subject}")
            
            # Get Gmail credentials for the firm
            credentials = await self.get_firm_gmail_credentials(firm_id)
            if not credentials:
                logger.error(f"EMAIL SERVICE DEBUG: No Gmail credentials available for firm {firm_id}")
                return False
            
            logger.info(f"EMAIL SERVICE DEBUG: Got credentials, building Gmail service")
            
            # Build Gmail service
            service = build('gmail', 'v1', credentials=credentials)
            
            # Use default sender name if not provided
            sender_name = from_name or settings.EMAIL_FROM_NAME
            logger.info(f"EMAIL SERVICE DEBUG: Using sender name: {sender_name}")
            
            # Create the message
            logger.info(f"EMAIL SERVICE DEBUG: Creating Gmail message")
            message = self.create_gmail_message(
                to_email=to_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content,
                from_name=sender_name
            )
            
            logger.info(f"EMAIL SERVICE DEBUG: Sending message via Gmail API")
            # Send the message
            result = service.users().messages().send(
                userId='me',
                body=message
            ).execute()
            
            logger.info(f"EMAIL SERVICE DEBUG: Email sent successfully to {to_email} via Gmail API. Message ID: {result.get('id')}")
            return True
            
        except HttpError as error:
            logger.error(f"EMAIL SERVICE DEBUG: Gmail API error sending email to {to_email}: {error}")
            logger.error(f"EMAIL SERVICE DEBUG: Error details: {error.content if hasattr(error, 'content') else 'No details'}")
            return False
        except Exception as e:
            logger.error(f"EMAIL SERVICE DEBUG: Failed to send email to {to_email} via Gmail API: {str(e)}")
            import traceback
            logger.error(f"EMAIL SERVICE DEBUG: Traceback: {traceback.format_exc()}")
            return False
    
    def render_template(self, template_name: str, context: Dict[str, Any]) -> str:
        """
        Render a Jinja2 template with the given context.
        
        Args:
            template_name: Name of the template file
            context: Variables to pass to the template
            
        Returns:
            str: Rendered template content
        """
        try:
            template = self.jinja_env.get_template(template_name)
            return template.render(**context)
        except Exception as e:
            logger.error(f"Failed to render template {template_name}: {str(e)}")
            raise
    
    async def send_intake_confirmation_email(
        self,
        firm_id: str,
        to_email: str,
        client_name: str,
        firm_name: str,
        case_id: str,
        submission_date: str
    ) -> bool:
        """
        Send intake form confirmation email to prospective client.
        
        Args:
            firm_id: ID of the firm (to get Gmail credentials)
            to_email: Client's email address
            client_name: Client's full name
            firm_name: Law firm name
            case_id: Generated case ID
            submission_date: Date of form submission
            
        Returns:
            bool: True if email was sent successfully
        """
        try:
            # Prepare template context
            context = {
                "client_name": client_name,
                "firm_name": firm_name,
                "case_id": case_id,
                "submission_date": submission_date,
                "support_email": "support@vibecamp.com"  # Generic support email
            }
            
            # Render HTML template
            html_content = self.render_template("intake_confirmation.html", context)
            
            # Render text template (fallback)
            text_content = self.render_template("intake_confirmation.txt", context)
            
            # Send email
            subject = f"Intake Form Received - {firm_name}"
            
            return await self.send_email_via_gmail_api(
                firm_id=firm_id,
                to_email=to_email,
                subject=subject,
                html_content=html_content,
                text_content=text_content
            )
            
        except Exception as e:
            logger.error(f"Failed to send intake confirmation email: {str(e)}")
            return False

# Global email service instance
email_service = GmailEmailService()

async def send_intake_confirmation_email(
    firm_id: str,
    to_email: str,
    client_name: str,
    firm_name: str,
    case_id: str,
    submission_date: str
) -> bool:
    """
    Convenience function to send intake confirmation email.
    
    Args:
        firm_id: ID of the firm (to get Gmail credentials)
        to_email: Client's email address
        client_name: Client's full name
        firm_name: Law firm name
        case_id: Generated case ID
        submission_date: Date of form submission
        
    Returns:
        bool: True if email was sent successfully
    """
    return await email_service.send_intake_confirmation_email(
        firm_id=firm_id,
        to_email=to_email,
        client_name=client_name,
        firm_name=firm_name,
        case_id=case_id,
        submission_date=submission_date
    )
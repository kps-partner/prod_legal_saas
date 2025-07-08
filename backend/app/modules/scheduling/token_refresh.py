"""Enhanced Google OAuth token refresh service with comprehensive error handling."""

import os
import logging
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google.auth.exceptions import RefreshError
from app.core.db import get_database

logger = logging.getLogger(__name__)

class TokenRefreshResult:
    """Result of a token refresh operation."""
    
    def __init__(self, success: bool, credentials: Optional[Credentials] = None, 
                 error: Optional[str] = None, needs_reauth: bool = False):
        self.success = success
        self.credentials = credentials
        self.error = error
        self.needs_reauth = needs_reauth

class GoogleTokenRefreshService:
    """Service for managing Google OAuth token refresh with comprehensive error handling."""
    
    def __init__(self):
        self.db = get_database()
    
    def create_credentials(self, access_token: str, refresh_token: str = None, 
                          scopes: list = None) -> Credentials:
        """Create Google credentials object from stored tokens."""
        if scopes is None:
            scopes = ["https://www.googleapis.com/auth/calendar"]
        
        return Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
            scopes=scopes
        )
    
    def should_refresh_token(self, credentials: Credentials, 
                           buffer_minutes: int = 5) -> bool:
        """
        Check if token should be refreshed.
        
        Args:
            credentials: Google credentials object
            buffer_minutes: Refresh token this many minutes before expiration
            
        Returns:
            bool: True if token should be refreshed
        """
        if not credentials.refresh_token:
            logger.warning("No refresh token available - cannot refresh")
            return False
        
        if not credentials.expiry:
            # If no expiry info, assume we should try to refresh
            logger.info("No expiry information available - attempting refresh")
            return True
        
        # Check if token expires within buffer time
        buffer_time = datetime.utcnow() + timedelta(minutes=buffer_minutes)
        should_refresh = credentials.expiry <= buffer_time
        
        logger.info(f"Token expiry: {credentials.expiry}, Buffer time: {buffer_time}, Should refresh: {should_refresh}")
        return should_refresh
    
    def refresh_credentials(self, credentials: Credentials) -> TokenRefreshResult:
        """
        Refresh Google credentials with comprehensive error handling.
        
        Args:
            credentials: Google credentials object to refresh
            
        Returns:
            TokenRefreshResult: Result of the refresh operation
        """
        if not credentials.refresh_token:
            logger.error("Cannot refresh credentials: No refresh token available")
            return TokenRefreshResult(
                success=False,
                error="No refresh token available",
                needs_reauth=True
            )
        
        try:
            logger.info("Attempting to refresh Google OAuth token")
            
            # Store original token for comparison
            original_token = credentials.token
            
            # Attempt refresh
            credentials.refresh(Request())
            
            # Check if refresh was successful
            if credentials.token and credentials.token != original_token:
                logger.info("Token refresh successful - new token obtained")
                return TokenRefreshResult(
                    success=True,
                    credentials=credentials
                )
            elif credentials.token == original_token:
                logger.warning("Token refresh returned same token - may not have been needed")
                return TokenRefreshResult(
                    success=True,
                    credentials=credentials
                )
            else:
                logger.error("Token refresh failed - no new token received")
                return TokenRefreshResult(
                    success=False,
                    error="No new token received after refresh",
                    needs_reauth=True
                )
        
        except RefreshError as e:
            error_str = str(e)
            logger.error(f"Google OAuth refresh error: {error_str}")
            
            # Check for specific error types
            if "invalid_grant" in error_str.lower():
                logger.error("Refresh token has expired or been revoked - user needs to re-authenticate")
                return TokenRefreshResult(
                    success=False,
                    error="Refresh token expired or revoked",
                    needs_reauth=True
                )
            elif "invalid_client" in error_str.lower():
                logger.error("OAuth client configuration error")
                return TokenRefreshResult(
                    success=False,
                    error="OAuth client configuration error",
                    needs_reauth=True
                )
            else:
                logger.error(f"Unknown refresh error: {error_str}")
                return TokenRefreshResult(
                    success=False,
                    error=f"Token refresh failed: {error_str}",
                    needs_reauth=True
                )
        
        except Exception as e:
            logger.error(f"Unexpected error during token refresh: {str(e)}")
            return TokenRefreshResult(
                success=False,
                error=f"Unexpected refresh error: {str(e)}",
                needs_reauth=True
            )
    
    def get_valid_credentials(self, firm_id: str) -> TokenRefreshResult:
        """
        Get valid credentials for a firm, refreshing if necessary.
        
        Args:
            firm_id: ID of the firm
            
        Returns:
            TokenRefreshResult: Result containing valid credentials or error info
        """
        try:
            logger.info(f"Getting valid credentials for firm {firm_id}")
            
            # Get connection from database
            connection = self.db.connected_calendars.find_one({"firm_id": firm_id})
            if not connection:
                logger.error(f"No Google connection found for firm {firm_id}")
                return TokenRefreshResult(
                    success=False,
                    error="No Google connection found",
                    needs_reauth=True
                )
            
            # Check connection status
            connection_status = connection.get('token_status', 'active')
            if connection_status == 'needs_reauth':
                logger.warning(f"Connection for firm {firm_id} is marked as needing re-authentication")
                return TokenRefreshResult(
                    success=False,
                    error="Connection needs re-authentication",
                    needs_reauth=True
                )
            
            # Create credentials
            access_token = connection.get('access_token')
            refresh_token = connection.get('refresh_token')
            scopes = connection.get('scopes', ["https://www.googleapis.com/auth/calendar"])
            
            if not access_token:
                logger.error(f"No access token found for firm {firm_id}")
                return TokenRefreshResult(
                    success=False,
                    error="No access token found",
                    needs_reauth=True
                )
            
            credentials = self.create_credentials(access_token, refresh_token, scopes)
            
            # Check if refresh is needed
            if self.should_refresh_token(credentials):
                logger.info(f"Token refresh needed for firm {firm_id}")
                refresh_result = self.refresh_credentials(credentials)
                
                if refresh_result.success:
                    # Update database with new token
                    self.update_connection_tokens(firm_id, refresh_result.credentials)
                    logger.info(f"Successfully refreshed and updated tokens for firm {firm_id}")
                    return refresh_result
                else:
                    # Mark connection as needing re-auth
                    self.mark_connection_needs_reauth(firm_id, refresh_result.error)
                    logger.error(f"Token refresh failed for firm {firm_id}: {refresh_result.error}")
                    return refresh_result
            else:
                logger.info(f"Token is still valid for firm {firm_id}")
                return TokenRefreshResult(
                    success=True,
                    credentials=credentials
                )
        
        except Exception as e:
            logger.error(f"Error getting valid credentials for firm {firm_id}: {str(e)}")
            return TokenRefreshResult(
                success=False,
                error=f"Failed to get credentials: {str(e)}",
                needs_reauth=True
            )
    
    def update_connection_tokens(self, firm_id: str, credentials: Credentials) -> bool:
        """
        Update stored tokens in database after successful refresh.
        
        Args:
            firm_id: ID of the firm
            credentials: Updated credentials object
            
        Returns:
            bool: True if update was successful
        """
        try:
            update_data = {
                "access_token": credentials.token,
                "token_status": "active",
                "last_refresh_attempt": datetime.utcnow(),
                "refresh_error_count": 0,
                "updated_at": datetime.utcnow()
            }
            
            # Add expiry if available
            if credentials.expiry:
                update_data["token_expiry"] = credentials.expiry
            
            result = self.db.connected_calendars.update_one(
                {"firm_id": firm_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                logger.info(f"Successfully updated tokens for firm {firm_id}")
                return True
            else:
                logger.warning(f"No documents updated for firm {firm_id}")
                return False
        
        except Exception as e:
            logger.error(f"Failed to update tokens for firm {firm_id}: {str(e)}")
            return False
    
    def mark_connection_needs_reauth(self, firm_id: str, error_message: str = None) -> bool:
        """
        Mark a connection as needing re-authentication.
        
        Args:
            firm_id: ID of the firm
            error_message: Optional error message to store
            
        Returns:
            bool: True if update was successful
        """
        try:
            update_data = {
                "token_status": "needs_reauth",
                "last_refresh_attempt": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            if error_message:
                update_data["last_refresh_error"] = error_message
                # Increment error count
                connection = self.db.connected_calendars.find_one({"firm_id": firm_id})
                if connection:
                    error_count = connection.get("refresh_error_count", 0) + 1
                    update_data["refresh_error_count"] = error_count
            
            result = self.db.connected_calendars.update_one(
                {"firm_id": firm_id},
                {"$set": update_data}
            )
            
            if result.modified_count > 0:
                logger.info(f"Marked connection as needing re-auth for firm {firm_id}")
                return True
            else:
                logger.warning(f"No documents updated when marking needs_reauth for firm {firm_id}")
                return False
        
        except Exception as e:
            logger.error(f"Failed to mark connection needs_reauth for firm {firm_id}: {str(e)}")
            return False
    
    def get_connection_health(self, firm_id: str) -> Dict[str, Any]:
        """
        Get health information about a Google connection.
        
        Args:
            firm_id: ID of the firm
            
        Returns:
            Dict containing connection health information
        """
        try:
            connection = self.db.connected_calendars.find_one({"firm_id": firm_id})
            if not connection:
                return {
                    "connected": False,
                    "status": "not_connected",
                    "needs_reauth": True
                }
            
            status = connection.get('token_status', 'active')
            error_count = connection.get('refresh_error_count', 0)
            last_error = connection.get('last_refresh_error')
            last_attempt = connection.get('last_refresh_attempt')
            
            return {
                "connected": True,
                "status": status,
                "needs_reauth": status == 'needs_reauth',
                "error_count": error_count,
                "last_error": last_error,
                "last_refresh_attempt": last_attempt,
                "has_refresh_token": bool(connection.get('refresh_token'))
            }
        
        except Exception as e:
            logger.error(f"Failed to get connection health for firm {firm_id}: {str(e)}")
            return {
                "connected": False,
                "status": "error",
                "needs_reauth": True,
                "error": str(e)
            }

# Global instance
token_refresh_service = GoogleTokenRefreshService()
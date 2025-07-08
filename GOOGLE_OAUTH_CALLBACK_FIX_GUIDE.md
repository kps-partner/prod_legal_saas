# Google OAuth Callback URL Fix Guide

## Problem Description

The Google OAuth callback URL is currently pointing to the frontend (`legalintakefrontend.vercel.app`) but should point to the backend where the actual callback handler exists. This causes a 404 error when Google tries to redirect after OAuth authorization.

## Root Cause

- **Current (Incorrect)**: `https://legalintakefrontend.vercel.app/api/v1/integrations/google/callback`
- **Should Be (Correct)**: `https://legal-intake.onrender.com/api/v1/integrations/google/callback`

The OAuth callback handler is implemented in the backend at `/api/v1/integrations/google/callback`, not on the frontend.

## Solution Overview

The system has been updated to automatically configure the correct callback URL based on the `BACKEND_URL` environment variable. Here's what was fixed:

### 1. Enhanced Configuration System

**File**: `backend/app/core/config.py`

```python
class Settings(BaseSettings):
    # ... other settings ...
    GOOGLE_REDIRECT_URI: str = None
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Set GOOGLE_REDIRECT_URI based on BACKEND_URL if not explicitly provided
        if not self.GOOGLE_REDIRECT_URI:
            self.GOOGLE_REDIRECT_URI = f"{self.BACKEND_URL}/api/v1/integrations/google/callback"
```

### 2. Updated Environment Configuration

**File**: `backend/.env.example`

```bash
# URL Configuration for production deployment
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
# GOOGLE_REDIRECT_URI is automatically set to {BACKEND_URL}/api/v1/integrations/google/callback
# Override only if you need a different callback URL:
# GOOGLE_REDIRECT_URI=https://your-backend-domain.com/api/v1/integrations/google/callback
```

## Deployment Configuration

### For Production Deployment

Set these environment variables in your deployment platform:

```bash
# Backend URL (where your FastAPI app is deployed)
BACKEND_URL=https://legal-intake.onrender.com

# Frontend URL (where your Next.js app is deployed)
FRONTEND_URL=https://legalintakefrontend.vercel.app

# Google OAuth credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

The system will automatically set:
```
GOOGLE_REDIRECT_URI=https://legal-intake.onrender.com/api/v1/integrations/google/callback
```

### For Local Development

```bash
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

The system will automatically set:
```
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/integrations/google/callback
```

## Google Cloud Console Configuration

You need to update your Google Cloud Console OAuth configuration:

### 1. Go to Google Cloud Console
- Navigate to: https://console.cloud.google.com/
- Select your project

### 2. Configure OAuth Consent Screen
- Go to "APIs & Services" > "OAuth consent screen"
- Ensure your app is properly configured

### 3. Update Authorized Redirect URIs
- Go to "APIs & Services" > "Credentials"
- Find your OAuth 2.0 Client ID
- Click "Edit"
- In "Authorized redirect URIs", add:

**For Production:**
```
https://legal-intake.onrender.com/api/v1/integrations/google/callback
```

**For Development:**
```
http://localhost:8000/api/v1/integrations/google/callback
```

### 4. Save Changes
- Click "Save" to update the configuration
- Changes may take a few minutes to propagate

## OAuth Flow Explanation

Here's how the corrected OAuth flow works:

1. **User clicks "Connect Google Calendar"** in frontend
2. **Frontend requests auth URL** from backend: `GET /api/v1/integrations/google/authorize`
3. **Backend generates auth URL** with correct redirect URI pointing to backend
4. **User is redirected to Google** for authorization
5. **Google redirects back to backend** with authorization code: `GET /api/v1/integrations/google/callback?code=...&state=...`
6. **Backend processes callback**:
   - Exchanges code for tokens
   - Stores tokens in database
   - Auto-selects primary calendar
   - Redirects user back to frontend: `{FRONTEND_URL}/settings/integrations?connected=true`

## Testing the Fix

### 1. Verify Configuration
```bash
# Check that the redirect URI is correctly set
curl -X GET "http://localhost:8000/api/v1/integrations/google/authorize" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 2. Test OAuth Flow
1. Log into your application
2. Go to Settings > Integrations
3. Click "Connect Google Calendar"
4. Complete Google authorization
5. Verify you're redirected back to the integrations page with success message

### 3. Check Database
Verify that the calendar connection was stored:
```python
from app.core.db import get_database
db = get_database()
connection = db.connected_calendars.find_one({"firm_id": "YOUR_FIRM_ID"})
print(f"Calendar connected: {connection is not None}")
if connection:
    print(f"Calendar ID: {connection.get('calendar_id')}")
    print(f"Calendar Name: {connection.get('calendar_name')}")
```

## Troubleshooting

### Issue: Still getting 404 on callback
**Solution**: 
1. Verify `BACKEND_URL` is set correctly in environment variables
2. Check Google Cloud Console has the correct redirect URI
3. Ensure backend is deployed and accessible at the configured URL

### Issue: "redirect_uri_mismatch" error
**Solution**:
1. The redirect URI in Google Cloud Console must exactly match the one being used
2. Check for trailing slashes, http vs https, etc.
3. Wait a few minutes after updating Google Cloud Console settings

### Issue: OAuth works but user isn't redirected back to frontend
**Solution**:
1. Verify `FRONTEND_URL` is set correctly
2. Check that the frontend is accessible at the configured URL
3. Ensure CORS is properly configured to allow the redirect

## Environment Variables Summary

| Variable | Development | Production | Description |
|----------|-------------|------------|-------------|
| `BACKEND_URL` | `http://localhost:8000` | `https://legal-intake.onrender.com` | Backend API base URL |
| `FRONTEND_URL` | `http://localhost:3000` | `https://legalintakefrontend.vercel.app` | Frontend app base URL |
| `GOOGLE_REDIRECT_URI` | Auto-set | Auto-set | OAuth callback URL (auto-configured) |
| `GOOGLE_CLIENT_ID` | Your dev client ID | Your prod client ID | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Your dev client secret | Your prod client secret | Google OAuth client secret |

## Deployment Platform Specific Instructions

### Render.com (Backend)
1. Go to your service dashboard
2. Navigate to "Environment" tab
3. Add/update environment variables:
   ```
   BACKEND_URL=https://your-service-name.onrender.com
   FRONTEND_URL=https://legalintakefrontend.vercel.app
   ```

### Vercel.com (Frontend)
1. Go to your project dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add:
   ```
   NEXT_PUBLIC_API_URL=https://legal-intake.onrender.com
   ```

## Security Considerations

1. **HTTPS in Production**: Always use HTTPS URLs in production
2. **Environment Variables**: Never commit OAuth secrets to version control
3. **CORS Configuration**: Ensure CORS is properly configured for your domains
4. **Domain Validation**: Google validates that redirect URIs match registered domains

## Support

If you continue to experience issues:

1. Check the backend logs for OAuth-related errors
2. Verify all environment variables are set correctly
3. Ensure Google Cloud Console configuration matches your environment
4. Test the OAuth flow in a private/incognito browser window
5. Check that both frontend and backend are accessible from the internet

The system is now configured to automatically handle OAuth callback URLs correctly across all deployment environments.
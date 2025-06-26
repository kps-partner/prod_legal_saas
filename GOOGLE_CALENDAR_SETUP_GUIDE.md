# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar integration for the LawFirm OS application.

## Prerequisites

- Google Cloud Console account
- LawFirm OS application running locally or deployed
- Admin access to your Google Workspace (if using Workspace)

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "LawFirm OS Calendar Integration")
5. Click "Create"

## Step 2: Enable Google Calendar API

1. In your Google Cloud project, go to the [API Library](https://console.cloud.google.com/apis/library)
2. Search for "Google Calendar API"
3. Click on "Google Calendar API"
4. Click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to [OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent)
2. Choose "External" user type (unless you have Google Workspace)
3. Click "Create"
4. Fill in the required information:
   - **App name**: LawFirm OS
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click "Save and Continue"
6. On the "Scopes" page, click "Add or Remove Scopes"
7. Add these scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
8. Click "Save and Continue"
9. Add test users (your email addresses) if in testing mode
10. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to [Credentials](https://console.cloud.google.com/apis/credentials)
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Enter a name (e.g., "LawFirm OS Web Client")
5. Add authorized redirect URIs:
   - For local development: `http://127.0.0.1:8000/api/v1/integrations/google/callback`
   - For production: `https://yourdomain.com/api/v1/integrations/google/callback`
6. Click "Create"
7. Copy the **Client ID** and **Client Secret**

## Step 5: Configure Environment Variables

Add the following environment variables to your backend `.env` file:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/api/v1/integrations/google/callback
```

For production, update the `GOOGLE_REDIRECT_URI` to match your production domain.

## Step 6: Test the Integration

1. Start your backend server:
   ```bash
   cd backend
   source venv/bin/activate
   python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

2. Start your frontend server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to `http://localhost:3000/settings/integrations`
4. Click "Connect Google Calendar"
5. Complete the OAuth flow
6. Select a calendar to integrate

## Step 7: Production Deployment

For production deployment:

1. Update the OAuth consent screen to "In production" status
2. Update authorized redirect URIs to use your production domain
3. Update environment variables with production values
4. Ensure HTTPS is enabled for your production domain

## Troubleshooting

### Common Issues

**Error: "redirect_uri_mismatch"**
- Ensure the redirect URI in Google Cloud Console exactly matches the one in your environment variables
- Check for trailing slashes and protocol (http vs https)

**Error: "access_denied"**
- User declined authorization
- Check OAuth consent screen configuration
- Ensure required scopes are properly configured

**Error: "invalid_client"**
- Check that Client ID and Client Secret are correctly set in environment variables
- Verify the OAuth 2.0 client is properly configured

**Error: "insufficient_scope"**
- Ensure the required Calendar API scopes are added to the OAuth consent screen
- Re-authorize the application after adding new scopes

### API Quotas

Google Calendar API has the following default quotas:
- 1,000,000 requests per day
- 100 requests per 100 seconds per user

For production applications with high usage, you may need to request quota increases.

## Security Best Practices

1. **Environment Variables**: Never commit Google credentials to version control
2. **HTTPS**: Always use HTTPS in production for OAuth callbacks
3. **Scope Limitation**: Only request the minimum required scopes
4. **Token Storage**: Securely store refresh tokens in your database
5. **Token Rotation**: Implement proper token refresh logic

## Next Steps

After successful setup:
1. Test calendar listing and selection
2. Implement appointment scheduling features
3. Add calendar event creation and management
4. Set up webhook notifications for calendar changes

## Support

For additional help:
- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Cloud Console Support](https://cloud.google.com/support)
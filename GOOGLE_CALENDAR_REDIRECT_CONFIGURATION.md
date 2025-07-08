# Google Calendar Redirect Configuration Guide

This guide explains how to configure Google Calendar OAuth redirect URLs for production deployment, ensuring users are redirected to your frontend URL instead of localhost after calendar integration.

## Overview

The Google Calendar integration uses OAuth2 flow which requires proper redirect URL configuration for both:
1. **Google OAuth redirect URI** - Where Google sends users after authorization
2. **Frontend redirect URL** - Where users are sent after successful/failed integration

## Configuration Variables

### Environment Variables

Add these variables to your production environment:

```bash
# Frontend URL (where users should be redirected after OAuth)
FRONTEND_URL=https://your-frontend-domain.com

# Backend URL (where your API is hosted)
BACKEND_URL=https://your-backend-domain.com

# Google OAuth redirect URI (must match Google Console configuration)
GOOGLE_REDIRECT_URI=https://your-backend-domain.com/api/v1/integrations/google/callback
```

### Development vs Production

**Development (localhost):**
```bash
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/integrations/google/callback
```

**Production Example:**
```bash
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://your-api.onrender.com
GOOGLE_REDIRECT_URI=https://your-api.onrender.com/api/v1/integrations/google/callback
```

## Google Cloud Console Configuration

### 1. Update Authorized Redirect URIs

In your Google Cloud Console project:

1. Go to **APIs & Services** → **Credentials**
2. Select your OAuth 2.0 Client ID
3. Add your production redirect URI to **Authorized redirect URIs**:
   ```
   https://your-backend-domain.com/api/v1/integrations/google/callback
   ```

### 2. Authorized JavaScript Origins (if needed)

Add your frontend domain to **Authorized JavaScript origins**:
```
https://your-frontend-domain.com
```

## Deployment Platform Examples

### Render.com + Vercel

```bash
# Render.com backend environment variables
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://your-app.onrender.com
GOOGLE_REDIRECT_URI=https://your-app.onrender.com/api/v1/integrations/google/callback

# Other required variables
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### AWS + Netlify

```bash
# AWS backend environment variables
FRONTEND_URL=https://your-app.netlify.app
BACKEND_URL=https://your-api.amazonaws.com
GOOGLE_REDIRECT_URI=https://your-api.amazonaws.com/api/v1/integrations/google/callback
```

### Heroku + Vercel

```bash
# Heroku backend environment variables
FRONTEND_URL=https://your-app.vercel.app
BACKEND_URL=https://your-app.herokuapp.com
GOOGLE_REDIRECT_URI=https://your-app.herokuapp.com/api/v1/integrations/google/callback
```

## Implementation Details

### Files Modified

1. **`backend/app/core/config.py`**
   - Added `BACKEND_URL` configuration
   - Enhanced URL configuration section

2. **`backend/app/modules/scheduling/services.py`**
   - Changed hardcoded `REDIRECT_URI` to use `settings.GOOGLE_REDIRECT_URI`

3. **`backend/app/modules/scheduling/router.py`**
   - Updated callback redirects to use `settings.FRONTEND_URL`
   - Added settings import

4. **`backend/.env.example`**
   - Added documentation for all URL configuration variables

### OAuth Flow

1. User clicks "Connect Google Calendar" in frontend
2. Frontend calls `/api/v1/integrations/google/authorize`
3. Backend generates Google OAuth URL with configured redirect URI
4. User authorizes on Google's servers
5. Google redirects to: `{GOOGLE_REDIRECT_URI}?code=...&state=...`
6. Backend processes the callback and redirects to: `{FRONTEND_URL}/settings/integrations?connected=true`

## Testing

### Local Testing

1. Ensure your `.env` file has localhost URLs:
   ```bash
   FRONTEND_URL=http://localhost:3000
   GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/integrations/google/callback
   ```

2. Test the OAuth flow:
   - Start both frontend and backend locally
   - Navigate to Settings → Integrations
   - Click "Connect Google Calendar"
   - Complete OAuth flow
   - Verify redirect back to integrations page

### Production Testing

1. Deploy with production environment variables
2. Update Google Cloud Console with production redirect URI
3. Test complete OAuth flow in production environment
4. Verify users are redirected to your frontend domain

## Troubleshooting

### Common Issues

**Issue: "redirect_uri_mismatch" error**
- **Cause**: Google redirect URI doesn't match Google Console configuration
- **Solution**: Ensure `GOOGLE_REDIRECT_URI` exactly matches the URI in Google Console

**Issue: Users redirected to localhost after OAuth**
- **Cause**: `FRONTEND_URL` not set or still using localhost
- **Solution**: Set `FRONTEND_URL` to your production frontend domain

**Issue: OAuth callback returns 404**
- **Cause**: Backend URL incorrect or not accessible
- **Solution**: Verify `BACKEND_URL` and ensure API is deployed and accessible

### Debug Steps

1. **Check environment variables**:
   ```bash
   echo $FRONTEND_URL
   echo $GOOGLE_REDIRECT_URI
   ```

2. **Verify Google Console configuration**:
   - Confirm redirect URI matches exactly
   - Check for trailing slashes or protocol mismatches

3. **Test API endpoint**:
   ```bash
   curl https://your-backend-domain.com/api/v1/integrations/google/authorize
   ```

4. **Check application logs** for OAuth-related errors

## Security Considerations

- Always use HTTPS in production for OAuth redirect URIs
- Keep Google Client Secret secure and never expose in frontend
- Validate redirect URIs to prevent open redirect vulnerabilities
- Use environment variables for all sensitive configuration

## Migration from Hardcoded URLs

If upgrading from hardcoded localhost URLs:

1. Set environment variables in your deployment platform
2. Update Google Cloud Console with production redirect URIs
3. Deploy the updated code
4. Test OAuth flow thoroughly
5. Remove any hardcoded localhost references

This configuration ensures a seamless Google Calendar integration experience for users in production environments.
# Stripe Redirect URL Configuration

This document explains how to configure Stripe redirect URLs for different environments using the new `FRONTEND_URL` environment variable.

## Overview

The Stripe integration now uses a configurable `FRONTEND_URL` environment variable instead of hardcoded localhost URLs. This allows for seamless deployment across different environments.

## Environment Variable

### `FRONTEND_URL`
- **Purpose**: Defines the base URL for your frontend application
- **Default**: `http://localhost:3000` (for local development)
- **Required**: Yes (but has a sensible default)

## Affected Stripe URLs

The following Stripe redirect URLs now use the `FRONTEND_URL` environment variable:

1. **Checkout Success URL**: `{FRONTEND_URL}/dashboard?success=true`
2. **Checkout Cancel URL**: `{FRONTEND_URL}/dashboard?canceled=true`
3. **Customer Portal Return URL**: `{FRONTEND_URL}/settings/billing`

## Configuration for Different Environments

### Local Development
```bash
# .env file (or use default)
FRONTEND_URL=http://localhost:3000
```

### Production (Example with custom domain)
```bash
# .env file
FRONTEND_URL=https://yourdomain.com
```

### Staging Environment
```bash
# .env file
FRONTEND_URL=https://staging.yourdomain.com
```

### Vercel Deployment
```bash
# .env file
FRONTEND_URL=https://your-app.vercel.app
```

## Implementation Details

### Files Modified

1. **`backend/app/core/config.py`**
   - Added `FRONTEND_URL: str = "http://localhost:3000"` to Settings class

2. **`backend/app/modules/billing/services.py`**
   - Updated `create_checkout_session()` function to use `f"{settings.FRONTEND_URL}/dashboard?success=true"`
   - Updated `create_checkout_session()` function to use `f"{settings.FRONTEND_URL}/dashboard?canceled=true"`
   - Updated `create_customer_portal_session()` function to use `f"{settings.FRONTEND_URL}/settings/billing"`

3. **`backend/.env.example`**
   - Added `FRONTEND_URL=http://localhost:3000` with documentation

## Usage Examples

### Setting Environment Variable

#### Option 1: Environment File
```bash
# In your .env file
FRONTEND_URL=https://your-production-domain.com
```

#### Option 2: System Environment Variable
```bash
export FRONTEND_URL=https://your-production-domain.com
```

#### Option 3: Docker Environment
```yaml
# docker-compose.yml
environment:
  - FRONTEND_URL=https://your-production-domain.com
```

### Deployment Platforms

#### Render.com
Set the environment variable in your Render dashboard:
- Key: `FRONTEND_URL`
- Value: `https://your-frontend-app.onrender.com`

#### Railway
```bash
railway variables set FRONTEND_URL=https://your-app.railway.app
```

#### Heroku
```bash
heroku config:set FRONTEND_URL=https://your-app.herokuapp.com
```

## Testing

To verify the configuration is working:

```bash
# Test that the environment variable is loaded correctly
cd backend
python3 -c "from app.core.config import settings; print(f'FRONTEND_URL: {settings.FRONTEND_URL}')"
```

## Migration from Hardcoded URLs

If you're upgrading from the previous hardcoded implementation:

1. **No code changes required** - the system will use the default `http://localhost:3000` for local development
2. **For production**: Simply set the `FRONTEND_URL` environment variable to your production frontend URL
3. **Existing Stripe configurations**: No changes needed in your Stripe dashboard

## Troubleshooting

### Common Issues

1. **Redirects still going to localhost in production**
   - Ensure `FRONTEND_URL` environment variable is set correctly
   - Restart your backend application after setting the environment variable

2. **Environment variable not being read**
   - Check that your `.env` file is in the correct location (`backend/.env`)
   - Verify the variable name is exactly `FRONTEND_URL` (case-sensitive)

3. **CORS issues after changing URL**
   - Ensure your CORS configuration allows requests from the new frontend URL
   - Current CORS is set to allow all origins (`*`), so this shouldn't be an issue

### Verification Steps

1. Check environment variable loading:
   ```bash
   python3 -c "from app.core.config import settings; print(settings.FRONTEND_URL)"
   ```

2. Test Stripe checkout session creation and verify the URLs in the response

3. Complete a test subscription flow to ensure redirects work correctly

## Security Considerations

- Always use HTTPS URLs for production environments
- Ensure the frontend URL matches your actual deployed frontend application
- The redirect URLs should point to pages that can handle the success/cancel/return scenarios appropriately

## Support

If you encounter issues with Stripe redirect configuration:

1. Verify the `FRONTEND_URL` environment variable is set correctly
2. Check that your frontend application is accessible at the configured URL
3. Ensure the redirect endpoints (`/dashboard`, `/settings/billing`) exist in your frontend application
4. Test the complete Stripe flow in your target environment
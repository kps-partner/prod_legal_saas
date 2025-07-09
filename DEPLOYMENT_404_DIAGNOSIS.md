# 404 Deployment Issue Diagnosis

## Problem Summary
- Backend API is working fine (all 200 OK responses)
- Frontend showing "404 this page could not be found" on Render.com and Vercel
- Works locally but fails in production

## Diagnostic Analysis

### Most Likely Sources:
1. **Frontend Environment Configuration** - NEXT_PUBLIC_API_BASE_URL not set correctly
2. **Frontend Build/Deployment Issue** - Next.js not properly deployed

### Current Configuration Issues Found:

#### Backend Config (backend/app/core/config.py):
```python
FRONTEND_URL: str = "http://localhost:3000"  # ❌ Hardcoded localhost
BACKEND_URL: str = "http://localhost:8000"   # ❌ Hardcoded localhost
```

#### Frontend Config (frontend/.env.example):
```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000  # ❌ Localhost only
```

#### Frontend API Config (frontend/src/lib/api.ts):
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
```

## Required Fixes

### 1. Environment Variables for Production

#### Render.com (Backend):
```bash
BACKEND_URL=https://legal-intake.onrender.com
FRONTEND_URL=https://legalintakefrontend.vercel.app
```

#### Vercel (Frontend):
```bash
NEXT_PUBLIC_API_BASE_URL=https://legal-intake.onrender.com
```

### 2. Google OAuth Redirect URIs

Based on GOOGLE_OAUTH_CALLBACK_FIX_GUIDE.md, update Google Cloud Console:

**Production:**
```
https://legal-intake.onrender.com/api/v1/integrations/google/callback
```

**Development:**
```
http://localhost:8000/api/v1/integrations/google/callback
```

## Validation Steps

### Step 1: Check Frontend Environment
Add this to frontend for debugging:
```typescript
console.log('🔧 Frontend Environment Check:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  API_BASE_URL: API_BASE_URL
});
```

### Step 2: Check Backend Environment
```python
print(f'Backend URL: {settings.BACKEND_URL}')
print(f'Frontend URL: {settings.FRONTEND_URL}')
print(f'Google Redirect URI: {settings.GOOGLE_REDIRECT_URI}')
```

### Step 3: Test API Connectivity
```bash
curl -X GET "https://legal-intake.onrender.com/api/v1/users/me" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Deployment Platform Instructions

### Vercel (Frontend)
1. Go to project dashboard
2. Settings > Environment Variables
3. Add:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://legal-intake.onrender.com`

### Render.com (Backend)
1. Go to service dashboard
2. Environment tab
3. Add/Update:
   - `BACKEND_URL` = `https://your-service-name.onrender.com`
   - `FRONTEND_URL` = `https://legalintakefrontend.vercel.app`

## Next Steps
1. Update environment variables on both platforms
2. Redeploy both frontend and backend
3. Update Google OAuth redirect URIs
4. Test the complete flow
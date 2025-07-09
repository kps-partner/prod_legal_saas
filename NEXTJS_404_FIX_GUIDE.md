# Next.js 404 Deployment Fix Guide

## Problem Diagnosis ✅ CONFIRMED

**Root Cause:** Next.js App Router structure inconsistency causing routing conflicts in production.

### Issues Found:

1. **Mixed App Router Patterns:**
   - Files exist in both `/frontend/app/` AND `/frontend/src/app/`
   - Next.js is confused about which structure to use
   - Production builds fail to resolve routes correctly

2. **File Structure Conflicts:**
   ```
   ❌ CONFLICTING STRUCTURE:
   frontend/app/(auth)/login/page.tsx          # Old location
   frontend/src/app/(auth)/login/page.tsx      # New location
   
   frontend/app/(app)/dashboard/page.tsx       # Old location  
   frontend/src/app/(app)/dashboard/page.tsx   # New location
   ```

3. **Import Path Mismatches:**
   - Components importing from `@/context/AuthContext` 
   - But AuthContext may be in wrong location for build

## Solution: Standardize on `/src/app/` Structure

### Step 1: Remove Duplicate Files in `/frontend/app/`

**Delete these conflicting files:**
```bash
rm -rf frontend/app/
```

### Step 2: Ensure All Files Are in `/frontend/src/app/`

**Required structure:**
```
frontend/src/app/
├── layout.tsx                    # Root layout
├── page.tsx                      # Home page
├── globals.css                   # Global styles
├── (auth)/
│   ├── layout.tsx               # Auth layout
│   ├── login/page.tsx           # Login page
│   ├── register/page.tsx        # Register page
│   └── change-password/page.tsx # Password change
├── (app)/
│   ├── layout.tsx               # App layout
│   ├── dashboard/page.tsx       # Dashboard
│   ├── cases/
│   │   ├── page.tsx            # Cases list
│   │   └── [caseId]/page.tsx   # Case detail
│   └── settings/
│       ├── page.tsx            # Settings
│       ├── billing/page.tsx    # Billing
│       ├── integrations/page.tsx # Integrations
│       └── users/page.tsx      # User management
└── intake/
    └── [firmId]/page.tsx       # Public intake
```

### Step 3: Update Next.js Configuration

**File: `frontend/next.config.mjs`**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper App Router configuration
  experimental: {
    appDir: true,
  },
  // Add output configuration for deployment
  output: 'standalone',
  // Ensure proper static file handling
  trailingSlash: false,
  // Add environment variable validation
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
};

export default nextConfig;
```

### Step 4: Update TypeScript Configuration

**File: `frontend/tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 5: Verify Import Paths

**Ensure all imports use correct paths:**
```typescript
// ✅ CORRECT:
import { AuthProvider } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

// ❌ INCORRECT:
import { AuthProvider } from "../context/AuthContext";
import { apiClient } from "../../lib/api";
```

### Step 6: Add Deployment Diagnostics

**File: `frontend/src/app/layout.tsx`**
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IntakeIntel",
  description: "AI-powered client intake and case management system for law firms",
};

// 🚨 DEPLOYMENT DIAGNOSIS
console.log('🔍 Next.js App Router Diagnosis:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  timestamp: new Date().toISOString()
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

## Deployment Steps

### For Vercel:

1. **Clean Build Cache:**
   ```bash
   rm -rf .next
   rm -rf node_modules
   npm install
   ```

2. **Test Local Build:**
   ```bash
   npm run build
   npm run start
   ```

3. **Deploy to Vercel:**
   - Ensure environment variables are set:
     - `NEXT_PUBLIC_API_BASE_URL=https://legal-intake.onrender.com`
   - Redeploy the application

### For Manual Deployment:

1. **Build Production:**
   ```bash
   cd frontend
   npm run build
   ```

2. **Check Build Output:**
   ```bash
   ls -la .next/
   # Should see proper static files and server files
   ```

## Validation Steps

### 1. Check Browser Console
After deployment, check browser console for:
```
🔍 Next.js App Router Diagnosis: {
  NODE_ENV: "production",
  NEXT_PUBLIC_API_BASE_URL: "https://legal-intake.onrender.com",
  timestamp: "..."
}

🔧 API Configuration Debug: {
  NEXT_PUBLIC_API_BASE_URL: "https://legal-intake.onrender.com",
  Final API_BASE_URL: "https://legal-intake.onrender.com",
  Environment: "production"
}

🚨 DEPLOYMENT DIAGNOSIS - Testing API connectivity...
🔍 API Test Response: {
  status: 200,
  statusText: "OK",
  url: "https://legal-intake.onrender.com/api/v1/users/me",
  ok: true
}
```

### 2. Test Routes
- `/` - Home page should load
- `/login` - Login page should load
- `/register` - Register page should load
- `/dashboard` - Should redirect to login if not authenticated

### 3. Check Network Tab
- API calls should go to `https://legal-intake.onrender.com`
- No 404 errors on static assets
- Proper CORS headers

## Troubleshooting

### Issue: Still getting 404
**Solution:**
1. Clear Vercel build cache
2. Ensure no duplicate files in `/app/` and `/src/app/`
3. Check `next.config.mjs` configuration
4. Verify all imports use `@/` paths

### Issue: API calls failing
**Solution:**
1. Check `NEXT_PUBLIC_API_BASE_URL` environment variable
2. Verify backend is accessible at the URL
3. Check CORS configuration on backend

### Issue: Build fails
**Solution:**
1. Check TypeScript errors: `npm run lint`
2. Verify all imports are correct
3. Ensure no circular dependencies

## Google OAuth Redirect URIs

**Current (Correct) Configuration:**
```
http://127.0.0.1:8000/api/v1/integrations/google/callback     # Development
https://legal-intake.onrender.com/api/v1/integrations/google/callback  # Production
```

**Note:** The duplicate production URI can be removed - only one is needed.

## Environment Variables Summary

### Vercel (Frontend):
```
NEXT_PUBLIC_API_BASE_URL=https://legal-intake.onrender.com
```

### Render.com (Backend):
```
BACKEND_URL=https://legal-intake.onrender.com
FRONTEND_URL=https://legalintakefrontend.vercel.app
```

This fix should resolve the 404 errors by ensuring Next.js App Router has a consistent file structure and proper configuration for production deployment.
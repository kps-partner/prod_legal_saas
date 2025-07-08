# Render.com Deployment Guide

## 🚨 Problem Solved
**Issue**: `ERROR: Error loading ASGI app. Could not import module "main".`
**Root Cause**: Render was trying to run `uvicorn main:app` from root directory, but FastAPI app is at `backend/app/main.py`

## 🛠️ Solution Files Created

### 1. render.yaml (Primary Solution)
```yaml
services:
  - type: web
    name: lawfirm-api
    env: python
    buildCommand: cd backend && pip install -r requirements.txt
    startCommand: cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: PYTHONPATH
        value: /opt/render/project/src/backend
```

### 2. start.sh (Backup Solution)
```bash
#!/bin/bash
cd backend
export PYTHONPATH=/opt/render/project/src/backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
```

## 📋 Deployment Instructions

### Option A: Using render.yaml (Recommended)
1. **Push the files to GitHub** (render.yaml is already created)
2. **In Render Dashboard**:
   - Connect your GitHub repository
   - Render will automatically detect the `render.yaml` file
   - Deploy will use the configuration automatically

### Option B: Manual Configuration
If render.yaml doesn't work, configure manually in Render:

**Build Command:**
```bash
cd backend && pip install -r requirements.txt
```

**Start Command:**
```bash
cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

**Environment Variables:**
- `PYTHON_VERSION`: `3.11.0`
- `PYTHONPATH`: `/opt/render/project/src/backend`

### Option C: Using start.sh Script
If both above fail, use the startup script:

**Build Command:**
```bash
chmod +x start.sh
```

**Start Command:**
```bash
./start.sh
```

## 🔧 Key Configuration Details

### Python Path Setup
- **PYTHONPATH**: `/opt/render/project/src/backend`
- This ensures Python can find the `app` module

### Working Directory
- All commands run from `backend/` directory
- This is where `requirements.txt` and the app code are located

### Import Path
- **Correct**: `app.main:app` (refers to `backend/app/main.py`)
- **Incorrect**: `main:app` (looks for `main.py` in root)

## 🌍 Environment Variables Needed

Add these in Render Dashboard:

### Required for Application
- `MONGODB_URL`: Your MongoDB connection string
- `SECRET_KEY`: JWT secret key
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Your Stripe webhook secret

### Optional for Enhanced Features
- `GOOGLE_CLIENT_ID`: For Google Calendar integration
- `GOOGLE_CLIENT_SECRET`: For Google Calendar integration
- `OPENAI_API_KEY`: For AI features
- `REDIS_URL`: For Celery background tasks

## 🚀 Deployment Steps

1. **Commit and push the deployment files**:
   ```bash
   git add render.yaml start.sh RENDER_DEPLOYMENT_GUIDE.md
   git commit -m "fix: Add Render.com deployment configuration"
   git push origin main
   ```

2. **In Render Dashboard**:
   - Create new Web Service
   - Connect GitHub repository
   - Select branch (main)
   - Render should auto-detect render.yaml

3. **Add Environment Variables** in Render settings

4. **Deploy** and monitor logs

## 🔍 Troubleshooting

### If deployment still fails:
1. Check Render logs for specific error messages
2. Verify all environment variables are set
3. Ensure MongoDB connection string is accessible from Render
4. Try the manual configuration (Option B)
5. As last resort, use the start.sh script (Option C)

### Common Issues:
- **Module not found**: Check PYTHONPATH is set correctly
- **Port binding**: Ensure using `$PORT` environment variable
- **Dependencies**: Verify requirements.txt is in backend/ directory

## ✅ Success Indicators
- Application starts without import errors
- Health endpoint accessible: `https://your-app.onrender.com/api/v1/health`
- No "No open ports detected" messages
- FastAPI docs available: `https://your-app.onrender.com/docs`
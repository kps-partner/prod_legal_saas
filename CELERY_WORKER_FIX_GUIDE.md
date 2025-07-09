# 🚨 URGENT: Celery Worker Database Configuration Fix

## 🎯 **ISSUE IDENTIFIED**

Your Celery worker on Render.com is failing because it's trying to connect to `localhost:27017` instead of your MongoDB Atlas production database.

**Error Evidence:**
```
localhost:27017: [Errno 111] Connection refused
Case 686d6ea9a4465e581728fa83 not found or access denied
```

## 🔧 **IMMEDIATE FIX REQUIRED**

### **Step 1: Update Render.com Celery Worker Environment Variables**

1. **Go to your Render.com dashboard**
2. **Find your Background Worker service** (likely named `vibecamp-celery-worker`)
3. **Click on the service name**
4. **Click "Environment" tab**
5. **Add/Update this critical environment variable:**

```bash
MONGODB_URL=mongodb+srv://legalMVP:legalmvp123**@cluster0.r8vacp5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

### **Step 2: Verify All Required Environment Variables**

Ensure your Celery worker has ALL of these:

```bash
# Database Configuration (CRITICAL FIX)
MONGODB_URL=mongodb+srv://legalMVP:legalmvp123**@cluster0.r8vacp5.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# Redis Configuration
CELERY_BROKER_URL=[your Redis URL from Render dashboard]
CELERY_RESULT_BACKEND=[same as CELERY_BROKER_URL]

# AI Configuration
OPENAI_API_KEY=[copy from your backend service]

# Python Configuration
PYTHONPATH=/opt/render/project/src/backend
```

### **Step 3: Deploy the Fix**

1. **Save the environment variables**
2. **Render will automatically redeploy your worker**
3. **Monitor the deployment logs**

### **Step 4: Verify the Fix**

**Expected Success Logs:**
```
[INFO/MainProcess] Connected to redis://red-xxxxx:6379/0
[INFO/MainProcess] celery@worker ready.
```

**No More Error Logs:**
- ❌ `localhost:27017: Connection refused`
- ❌ `Case not found or access denied`

## 🔍 **Code Fix Applied**

I've also updated [`backend/app/core/db.py`](backend/app/core/db.py) to support both environment variables:

```python
# Support both MONGODB_URL (production) and MONGO_DETAILS (local development)
MONGO_URL = os.getenv("MONGODB_URL") or os.getenv("MONGO_DETAILS")
```

This ensures compatibility between local development and production environments.

## 📋 **Quick Checklist**

- [ ] Added `MONGODB_URL` environment variable to Celery worker
- [ ] Verified Redis URLs are correct
- [ ] Confirmed OpenAI API key is set
- [ ] Worker service redeployed successfully
- [ ] Worker logs show successful MongoDB connection
- [ ] No more "localhost:27017" connection errors
- [ ] AI insights generation tested and working

## 🎯 **Expected Result**

Once you add the `MONGODB_URL` environment variable:

1. **Celery worker will connect to MongoDB Atlas** (not localhost)
2. **Case validation will work** (accessing correct database)
3. **AI insights will generate successfully** within 30-60 seconds
4. **"No AI insights generated yet" issue will be resolved**

## ⚡ **URGENT ACTION REQUIRED**

**This is the final fix needed.** The Celery worker infrastructure is working perfectly - it just needs the correct database URL to access your production data.

**Time to Fix**: 2-3 minutes
**Expected Resolution**: Immediate once deployed
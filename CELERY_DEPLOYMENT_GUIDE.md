# Celery Workers Deployment Guide for AI Insights

## 🚨 **CRITICAL ISSUE IDENTIFIED**

**Problem**: AI insights generation fails because **no Celery workers are running in production** to process background tasks.

**Root Cause**: The application submits AI insight tasks to Redis queue, but without active Celery workers, these tasks remain unprocessed indefinitely.

## 🔧 **Production Deployment Solution**

### 1. **Render.com Background Worker Service**

Create a new **Background Worker** service on Render.com:

#### Service Configuration:
```yaml
# render.yaml (add this service)
services:
  - type: worker
    name: vibecamp-celery-worker
    env: python
    buildCommand: "pip install -r requirements.txt"
    startCommand: "celery -A app.celery_app worker --loglevel=info --concurrency=2"
    envVars:
      - key: PYTHONPATH
        value: /opt/render/project/src
      - key: OPENAI_API_KEY
        fromService: vibecamp-backend  # Inherit from main backend service
      - key: MONGODB_URL
        fromService: vibecamp-backend
      - key: CELERY_BROKER_URL
        value: redis://red-xxxxx:6379/0  # Your Redis URL
      - key: CELERY_RESULT_BACKEND
        value: redis://red-xxxxx:6379/0
```

#### Manual Setup (Alternative):
1. Go to Render.com Dashboard
2. Click "New" → "Background Worker"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `vibecamp-celery-worker`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `celery -A app.celery_app worker --loglevel=info --concurrency=2`
   - **Working Directory**: `backend`

### 2. **Environment Variables for Worker**

Ensure these environment variables are set for the worker service:

```bash
# Required for Celery Worker
PYTHONPATH=/opt/render/project/src/backend
OPENAI_API_KEY=sk-xxxxx  # Your OpenAI API key
MONGODB_URL=mongodb+srv://xxxxx  # Your MongoDB connection string
CELERY_BROKER_URL=redis://red-xxxxx:6379/0  # Your Redis URL
CELERY_RESULT_BACKEND=redis://red-xxxxx:6379/0  # Same as broker
```

### 3. **Redis Service Configuration**

Ensure your Redis service is properly configured:

```bash
# Redis should be accessible by both backend and worker
REDIS_URL=redis://red-xxxxx:6379/0
```

### 4. **Worker Scaling Configuration**

For production workloads, configure appropriate concurrency:

```bash
# For light workload (1-10 users)
celery -A app.celery_app worker --loglevel=info --concurrency=2

# For medium workload (10-100 users)
celery -A app.celery_app worker --loglevel=info --concurrency=4

# For heavy workload (100+ users)
celery -A app.celery_app worker --loglevel=info --concurrency=8
```

## 🔍 **Verification Steps**

### 1. **Check Worker Status**
```bash
# In your backend service terminal
celery -A app.celery_app inspect active
celery -A app.celery_app inspect stats
```

### 2. **Monitor Task Processing**
```bash
# Check Redis queue status
redis-cli -h your-redis-host -p 6379
> LLEN celery
> KEYS celery*
```

### 3. **Test AI Insights Generation**
1. Navigate to a case in the frontend
2. Click "Generate AI Insights"
3. Check that insights appear within 30-60 seconds
4. Verify timeline events are created in the database

## 🚀 **Deployment Checklist**

- [ ] Redis service is running and accessible
- [ ] Backend service has correct Redis connection URLs
- [ ] Celery worker service is created and deployed
- [ ] All environment variables are properly configured
- [ ] OpenAI API key is set in worker environment
- [ ] Worker service is actively running (check logs)
- [ ] Test AI insights generation end-to-end

## 🐛 **Troubleshooting**

### Worker Not Starting:
```bash
# Check worker logs in Render dashboard
# Common issues:
# 1. Missing PYTHONPATH
# 2. Incorrect Redis URL
# 3. Missing OpenAI API key
```

### Tasks Not Processing:
```bash
# Verify Redis connection
# Check worker is registered with correct queues
# Ensure task routing is correct
```

### AI Generation Failing:
```bash
# Check OpenAI API key is valid
# Verify MongoDB connection from worker
# Check case/firm ID validation logic
```

## 📊 **Monitoring**

### Key Metrics to Monitor:
- Worker process health
- Task processing rate
- Task failure rate
- Redis queue length
- OpenAI API usage

### Recommended Monitoring:
- Set up Render service health checks
- Monitor Redis memory usage
- Track OpenAI API costs
- Monitor task completion times

## 🔄 **Auto-scaling (Future Enhancement)**

For high-traffic scenarios, consider:
- Multiple worker instances
- Queue-based auto-scaling
- Task priority queues
- Dead letter queues for failed tasks

---

**Next Steps**: Deploy the Celery worker service on Render.com and verify AI insights generation works end-to-end.
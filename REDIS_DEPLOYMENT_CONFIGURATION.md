# Redis Deployment Configuration for AI Insights

## 🚨 Problem Analysis

The AI insights generation fails with "Error 111 connecting to localhost:6379. Connection refused." because:

1. **Configuration Mismatch**: Celery configuration was using `REDIS_URL` but settings expected `CELERY_BROKER_URL`/`CELERY_RESULT_BACKEND`
2. **Missing Redis Service**: Production deployment lacks Redis service configuration
3. **Localhost Hardcoding**: Default fallback to `localhost:6379` fails in production environments

## 🔧 Solution Implemented

### 1. Fixed Configuration Inconsistency
- Updated `backend/app/celery_app.py` to use consistent environment variables:
  ```python
  # Before (inconsistent)
  broker=os.getenv("REDIS_URL", "redis://localhost:6379/0")
  
  # After (consistent with settings)
  broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
  ```

### 2. Environment Variables Required
Add these to your production environment:
```bash
CELERY_BROKER_URL=redis://your-redis-host:6379/0
CELERY_RESULT_BACKEND=redis://your-redis-host:6379/0
```

## 🚀 Production Deployment Options

### Option A: Render.com Redis Add-on (Recommended)
1. **Add Redis Service**:
   - Go to Render.com dashboard
   - Click "New" → "Redis"
   - Choose plan (free tier available)
   - Note the internal Redis URL provided

2. **Configure Environment Variables**:
   ```bash
   CELERY_BROKER_URL=redis://red-xxxxx:6379/0
   CELERY_RESULT_BACKEND=redis://red-xxxxx:6379/0
   ```

3. **Update Backend Service**:
   - Add Redis service as dependency in Render dashboard
   - Restart backend service after Redis is running

### Option B: External Redis Service
1. **Redis Cloud** (RedisLabs):
   ```bash
   CELERY_BROKER_URL=redis://username:password@redis-host:port/0
   CELERY_RESULT_BACKEND=redis://username:password@redis-host:port/0
   ```

2. **AWS ElastiCache**:
   ```bash
   CELERY_BROKER_URL=redis://your-cluster.cache.amazonaws.com:6379/0
   CELERY_RESULT_BACKEND=redis://your-cluster.cache.amazonaws.com:6379/0
   ```

3. **DigitalOcean Managed Redis**:
   ```bash
   CELERY_BROKER_URL=redis://username:password@db-redis-host:25061/0
   CELERY_RESULT_BACKEND=redis://username:password@db-redis-host:25061/0
   ```

### Option C: Docker Compose (Self-hosted)
```yaml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  backend:
    build: ./backend
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    depends_on:
      - redis

volumes:
  redis_data:
```

## 🛠️ Development Setup

### Local Development
1. **Install Redis locally**:
   ```bash
   # macOS
   brew install redis
   brew services start redis
   
   # Ubuntu/Debian
   sudo apt-get install redis-server
   sudo systemctl start redis-server
   
   # Windows
   # Download from https://redis.io/download
   ```

2. **Verify Redis is running**:
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

3. **Environment variables** (optional for development):
   ```bash
   # .env file (defaults to localhost:6379 if not set)
   CELERY_BROKER_URL=redis://localhost:6379/0
   CELERY_RESULT_BACKEND=redis://localhost:6379/0
   ```

## 🧪 Testing AI Insights

### 1. Verify Redis Connection
```bash
# Test Redis connectivity
redis-cli -h your-redis-host -p 6379 ping
```

### 2. Test Celery Worker
```bash
# Start Celery worker (development)
cd backend
celery -A app.celery_app worker --loglevel=info

# Check for successful Redis connection in logs
```

### 3. Test AI Insights Generation
1. Navigate to case details page
2. Click "Generate AI Insights" button
3. Check for successful task execution in Celery logs
4. Verify insights appear in the UI

## 🔍 Troubleshooting

### Common Issues

1. **"Connection refused" Error**:
   - Verify Redis service is running
   - Check Redis host/port configuration
   - Ensure firewall allows Redis port (6379)

2. **"Authentication failed" Error**:
   - Verify Redis password in connection string
   - Check Redis AUTH configuration

3. **"Task timeout" Error**:
   - Increase task timeout in Celery configuration
   - Check OpenAI API key configuration
   - Verify network connectivity to OpenAI

4. **Celery worker not starting**:
   - Restart Celery worker after configuration changes
   - Check for import errors in task modules
   - Verify PYTHONPATH is set correctly

### Debug Commands

```bash
# Check Redis connectivity
redis-cli -h host -p port ping

# Monitor Redis commands
redis-cli -h host -p port monitor

# Check Celery task status
celery -A app.celery_app inspect active

# Test task execution
celery -A app.celery_app call app.modules.ai.tasks.generate_ai_insights
```

## 📋 Deployment Checklist

- [ ] Redis service configured and running
- [ ] Environment variables set correctly
- [ ] Celery worker started with new configuration
- [ ] Backend service restarted
- [ ] AI insights functionality tested
- [ ] Error monitoring configured
- [ ] Redis persistence enabled (for production)
- [ ] Redis security configured (password, firewall)

## 🚀 Next Steps

1. **Configure Redis service** in your deployment platform
2. **Set environment variables** with Redis connection details
3. **Restart backend and Celery services**
4. **Test AI insights generation** functionality
5. **Monitor Redis performance** and adjust as needed

## 📊 Performance Considerations

- **Redis Memory**: Monitor memory usage, configure eviction policies
- **Connection Pooling**: Celery handles connection pooling automatically
- **Persistence**: Enable Redis persistence for production workloads
- **Monitoring**: Set up Redis monitoring and alerting
- **Scaling**: Consider Redis Cluster for high-availability setups
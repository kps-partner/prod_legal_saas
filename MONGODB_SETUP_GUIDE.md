# MongoDB Setup Guide for LawFirm OS

## Overview
This guide covers MongoDB installation and setup for the LawFirm OS project.

## Installation Status
MongoDB is currently being installed via Homebrew. The installation includes:
- MongoDB Community Server
- Required dependencies (cmake, etc.)

## Installation Commands
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Add Homebrew to PATH
eval "$(/usr/local/bin/brew shellenv)"

# Add MongoDB tap and install
brew tap mongodb/brew
brew install mongodb-community
```

## Post-Installation Setup

### 1. Start MongoDB Service
```bash
# Start MongoDB as a service
brew services start mongodb/brew/mongodb-community

# Or start manually
mongod --config /usr/local/etc/mongod.conf
```

### 2. Verify Installation
```bash
# Check if MongoDB is running
brew services list | grep mongodb

# Connect to MongoDB shell
mongosh
```

### 3. Create Database and Collections
```javascript
// In mongosh
use lawfirm_os

// Create collections
db.createCollection("users")
db.createCollection("firms")

// Verify collections
show collections
```

## Configuration

### Database Connection
The application connects to MongoDB using:
- **Host**: localhost
- **Port**: 27017
- **Database**: lawfirm_os

### Environment Variables
Ensure these are set in `backend/.env`:
```
DATABASE_URL=mongodb://localhost:27017/lawfirm_os
```

## Troubleshooting

### Common Issues

1. **Connection Refused Error**
   ```
   MongoDB connection failed: localhost:27017: [Errno 61] Connection refused
   ```
   **Solution**: Start MongoDB service
   ```bash
   brew services start mongodb/brew/mongodb-community
   ```

2. **Permission Issues**
   **Solution**: Check MongoDB data directory permissions
   ```bash
   sudo chown -R $(whoami) /usr/local/var/mongodb
   sudo chown -R $(whoami) /usr/local/var/log/mongodb
   ```

3. **Port Already in Use**
   **Solution**: Check what's using port 27017
   ```bash
   lsof -i :27017
   ```

### Logs
MongoDB logs are located at:
```
/usr/local/var/log/mongodb/mongo.log
```

## Testing Database Connection

### 1. Test with Python
```python
from pymongo import MongoClient

try:
    client = MongoClient('mongodb://localhost:27017/')
    db = client.lawfirm_os
    print("Connected to MongoDB successfully!")
    print(f"Collections: {db.list_collection_names()}")
except Exception as e:
    print(f"Connection failed: {e}")
```

### 2. Test with Application
```bash
# From backend directory
cd backend
source venv/bin/activate
python -c "from app.core.db import db; print('Database connection successful!')"
```

## Current Status
- ✅ Homebrew installed
- 🔄 MongoDB installation in progress
- ⏳ Service startup pending
- ⏳ Database initialization pending

## Next Steps
1. Wait for MongoDB installation to complete
2. Start MongoDB service
3. Test database connection
4. Run application with full database functionality

## Fallback Testing
While MongoDB is installing, the application has fallback mechanisms that allow testing of:
- Stripe checkout session creation
- JWT token validation
- API endpoints

The fallback creates temporary Stripe customers and mock users for testing purposes.
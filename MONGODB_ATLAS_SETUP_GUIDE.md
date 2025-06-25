# MongoDB Atlas Setup Guide for Law Firm OS

This guide will help you set up MongoDB Atlas for your Law Firm OS application.

## Prerequisites

- MongoDB Atlas account (free tier available)
- Your application's backend environment configured

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account or log in
3. Create a new project (e.g., "LawFirmOS")

## Step 2: Create a Cluster

1. Click "Build a Database"
2. Choose "M0 Sandbox" (Free tier)
3. Select your preferred cloud provider and region
4. Name your cluster (e.g., "LawFirmOS-Cluster")
5. Click "Create Cluster"

## Step 3: Configure Database Access

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and secure password
5. Set database user privileges to "Read and write to any database"
6. Click "Add User"

## Step 4: Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development, you can click "Allow Access from Anywhere" (0.0.0.0/0)
   - **Note**: For production, restrict to specific IP addresses
4. Click "Confirm"

## Step 5: Get Connection String

1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Python" and version "3.6 or later"
5. Copy the connection string

## Step 6: Configure Your Application

1. Create a `.env` file in your `backend/` directory (copy from `.env.example`)
2. Replace the `DATABASE_URL` with your Atlas connection string:

```env
# MongoDB Atlas Configuration
DATABASE_URL=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/LawFirmOS?retryWrites=true&w=majority

# JWT Configuration
SECRET_KEY=your_generated_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

3. Replace the placeholders:
   - `username`: Your database username
   - `password`: Your database password
   - `cluster0.xxxxx.mongodb.net`: Your actual cluster URL
   - `LawFirmOS`: Your database name

## Step 7: Test Connection

1. Start your backend server:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

2. Check the logs for "MongoDB connection successful" message

## Database Collections

Your application will automatically create these collections:

- **users**: User accounts and authentication data
- **firms**: Law firm information and subscription status
- **billing**: Billing and subscription records (if applicable)

## Security Best Practices

1. **Use strong passwords** for database users
2. **Restrict IP access** in production environments
3. **Enable MongoDB Atlas encryption** (enabled by default)
4. **Regularly rotate database passwords**
5. **Monitor database access logs**

## Troubleshooting

### Connection Issues

1. **Check IP whitelist**: Ensure your IP is allowed in Network Access
2. **Verify credentials**: Double-check username and password
3. **Check connection string**: Ensure it's properly formatted
4. **Firewall issues**: Some networks block MongoDB ports

### Common Error Messages

- `Authentication failed`: Check username/password
- `Connection refused`: Check IP whitelist and network connectivity
- `SSL/TLS errors`: Ensure your connection string includes SSL parameters

## Environment Variables Reference

```env
# Required for MongoDB Atlas
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Required for JWT authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Required for Stripe integration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Next Steps

After setting up MongoDB Atlas:

1. Configure your Stripe account for billing
2. Set up your frontend environment variables
3. Test user registration and authentication
4. Test billing functionality

## Support

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Connection Troubleshooting](https://docs.atlas.mongodb.com/troubleshoot-connection/)
- [Law Firm OS GitHub Issues](your-repo-url)
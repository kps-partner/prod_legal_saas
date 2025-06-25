# Step-by-Step Stripe Webhook Setup Guide

## Overview
This guide will walk you through creating a webhook endpoint in your Stripe dashboard to receive events from Stripe when payments and subscriptions change.

## Prerequisites
✅ You have a Stripe account  
✅ You're logged into https://dashboard.stripe.com  
✅ You're in **Test Mode** (toggle in top-left corner)  
✅ Your backend server is running on http://127.0.0.1:8000  

## Step-by-Step Instructions

### Step 1: Navigate to Webhooks
1. **Open your Stripe Dashboard**: Go to https://dashboard.stripe.com
2. **Ensure Test Mode**: Look at the top-left corner - it should say "Test" (not "Live")
3. **Find Developers Section**: In the left sidebar, look for "Developers"
4. **Click on Webhooks**: Under "Developers", click on "Webhooks"

### Step 2: Create New Webhook
1. **Click "Add endpoint"**: You'll see a blue button that says "Add endpoint"
2. **You'll see a form with several fields**

### Step 3: Configure the Webhook Endpoint

#### Endpoint URL
**For Local Development - Use Stripe CLI (Recommended):**

Since Stripe requires publicly accessible URLs, you cannot use `http://127.0.0.1:8000` directly. Instead, use the Stripe CLI to forward webhooks to your local server.

**Skip creating a webhook in the dashboard for now** and follow the Stripe CLI setup below.

**For Production Only:**
```
https://yourdomain.com/api/v1/billing/webhook
```

## Option 2: Using Stripe CLI for Local Development (Recommended)

The Stripe CLI is the best way to test webhooks during local development. It creates a secure tunnel to forward Stripe webhook events to your local server.

### Step 1: Install Stripe CLI

**On macOS (using Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**On Windows:**
Download from: https://github.com/stripe/stripe-cli/releases

**On Linux:**
```bash
# Download the latest release
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz
tar -xvf stripe_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### Step 2: Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate with your Stripe account.

### Step 3: Forward Webhooks to Local Server

Make sure your backend server is running on `http://127.0.0.1:8000`, then run:

```bash
stripe listen --forward-to localhost:8000/api/v1/billing/webhook
```

### Step 4: Get the Webhook Signing Secret

When you run the `stripe listen` command, it will output a webhook signing secret that looks like:
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

Copy this secret and update your `backend/.env` file:
```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### Step 5: Test the Webhook

In a new terminal, trigger a test event:
```bash
stripe trigger payment_intent.succeeded
```

You should see the webhook event in your backend logs and the Stripe CLI output.

### Important Notes for Stripe CLI:
- Keep the `stripe listen` command running while developing
- The webhook secret changes each time you restart `stripe listen`
- This method automatically handles all webhook events, not just the ones you select
- Perfect for development and testing

#### Description (Optional)
Add a description like:
```
LawFirm OS Billing Webhook - Local Development
```

### Step 4: Select Events to Listen For

Click on "Select events" and choose these important events:

#### Customer Events
- ✅ `customer.created`
- ✅ `customer.updated`
- ✅ `customer.deleted`

#### Subscription Events
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `customer.subscription.trial_will_end`

#### Payment Events
- ✅ `invoice.created`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`
- ✅ `invoice.finalized`

#### Checkout Events
- ✅ `checkout.session.completed`
- ✅ `checkout.session.expired`

#### Payment Intent Events
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`

### Step 5: Save the Webhook
1. **Click "Add endpoint"** at the bottom of the form
2. **You'll be redirected** to the webhook details page

### Step 6: Get Your Webhook Secret
1. **On the webhook details page**, scroll down to find "Signing secret"
2. **Click "Reveal"** next to the signing secret
3. **Copy the webhook secret** - it starts with `whsec_`
4. **This is important** - you'll need this for your environment file

### Step 7: Update Your Environment File

Update your `backend/.env` file with the webhook secret:

```env
DATABASE_URL=mongodb://localhost:27017
MONGO_DETAILS=mongodb://localhost:27017
SECRET_KEY=your_generated_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
STRIPE_SECRET_KEY=sk_test_51RdvLlCvk8IU6PphFaVeUe8TkwXeb7eOwfLkiLFV0q5kYgwbCoPZBcjKxbP6Lx1njKNuh5T1zGZwTE0vcqJX2iEy00OUDIGrBN
STRIPE_PUBLISHABLE_KEY=pk_test_51RdvLlCvk8IU6PphQoE7X8dVto6PDVunqVpPdm1y6a2RGsg2llOfGn4Y9kCxz0YWnD04DdzxCDl69gfsSMw13hn800wEZyeSTQ
STRIPE_WEBHOOK_SECRET=whsec_YOUR_ACTUAL_WEBHOOK_SECRET_HERE
```

## Testing Your Webhook

### Step 1: Test the Endpoint
1. **In the webhook details page**, click "Send test webhook"
2. **Select an event** (try `customer.created`)
3. **Click "Send test webhook"**
4. **Check your terminal** where your backend is running - you should see the webhook received

### Step 2: Verify in Logs
Look for output like:
```
INFO:     127.0.0.1:xxxxx - "POST /api/v1/billing/webhook HTTP/1.1" 200 OK
```

## Troubleshooting

### Common Issues

#### 1. "Endpoint URL is not reachable"
**Problem**: Stripe can't reach your local server  
**Solutions**:
- Make sure your backend server is running on port 8000
- Check that the URL is exactly: `http://127.0.0.1:8000/api/v1/billing/webhook`
- For local development, this is expected - webhooks will work in production

#### 2. "Webhook signature verification failed"
**Problem**: Wrong webhook secret  
**Solutions**:
- Double-check you copied the webhook secret correctly
- Make sure it starts with `whsec_`
- Restart your backend server after updating the environment file

#### 3. "404 Not Found"
**Problem**: Webhook endpoint doesn't exist  
**Solutions**:
- Verify your backend server is running
- Check that the billing router is properly included in your FastAPI app

### For Local Development

Since Stripe can't reach your local machine directly, you have two options:

#### Option 1: Use Stripe CLI (Recommended)
1. **Install Stripe CLI**: https://stripe.com/docs/stripe-cli
2. **Login**: `stripe login`
3. **Forward webhooks**: 
   ```bash
   stripe listen --forward-to localhost:8000/api/v1/billing/webhook
   ```
4. **Use the webhook secret** provided by the CLI

#### Option 2: Use ngrok
1. **Install ngrok**: https://ngrok.com/
2. **Expose your local server**:
   ```bash
   ngrok http 8000
   ```
3. **Use the ngrok URL** in your webhook endpoint:
   ```
   https://your-ngrok-url.ngrok.io/api/v1/billing/webhook
   ```

## What Happens Next

Once your webhook is set up:

1. **Stripe will send events** to your endpoint when things happen
2. **Your backend will receive** and process these events
3. **Your application can respond** to subscription changes, payment failures, etc.
4. **You can see webhook logs** in your Stripe dashboard

## Production Setup

For production:
1. **Replace the localhost URL** with your actual domain
2. **Use HTTPS** (required for production webhooks)
3. **Update the webhook secret** in your production environment
4. **Test thoroughly** before going live

## Summary

Your webhook endpoint should now be:
- ✅ Created in Stripe dashboard
- ✅ Configured with the correct URL
- ✅ Listening for important events
- ✅ Ready to receive test events

The webhook secret is the final piece needed to complete your Stripe integration!
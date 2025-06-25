# Stripe Test Keys & Webhook Setup Guide

## Overview
This guide will help you set up Stripe test keys and webhook endpoints for your LawFirm OS application.

## Part 1: Getting Test API Keys

### Step 1: Access Your Stripe Dashboard
1. Go to https://dashboard.stripe.com
2. Log in with your Stripe account credentials
3. Make sure you're in **Test Mode** (toggle in the top-left should show "Test")

### Step 2: Get Your Test API Keys
1. In the left sidebar, click on **"Developers"**
2. Click on **"API keys"**
3. You'll see two types of keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`)

### Step 3: Copy Your Test Keys
- **Test Publishable Key**: Copy the key that starts with `pk_test_`
- **Test Secret Key**: Click "Reveal test key token" and copy the key that starts with `sk_test_`

## Part 2: Setting Up Webhooks

### Step 1: Create a Webhook Endpoint
1. In your Stripe Dashboard, go to **"Developers"** → **"Webhooks"**
2. Click **"Add endpoint"**
3. Enter your endpoint URL: `http://127.0.0.1:8000/api/v1/billing/webhook`
   - For production, this would be your actual domain
4. Click **"Select events"**

### Step 2: Select Events to Listen For
Select these important events for subscription management:
- `customer.subscription.created`
- `customer.subscription.updated` 
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `checkout.session.completed`

### Step 3: Get Your Webhook Secret
1. After creating the webhook, click on it to view details
2. In the **"Signing secret"** section, click **"Reveal"**
3. Copy the webhook secret (starts with `whsec_`)

## Part 3: Update Your Environment Files

### Backend Environment (.env)
Replace the current keys in `backend/.env` with your test keys:

```env
DATABASE_URL=mongodb://localhost:27017
MONGO_DETAILS=mongodb://localhost:27017
SECRET_KEY=your_generated_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### Frontend Environment (.env)
Update `frontend/.env` with your test publishable key:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_PUBLISHABLE_KEY_HERE
```

## Part 4: Create Test Products and Prices

### Step 1: Create a Product
1. In Stripe Dashboard, go to **"Products"**
2. Click **"Add product"**
3. Fill in:
   - **Name**: "LawFirm OS Professional Plan"
   - **Description**: "Full access to all LawFirm OS features"

### Step 2: Add Pricing
1. In the pricing section:
   - **Price**: $99.00
   - **Billing period**: Monthly
   - **Currency**: USD
2. Click **"Save product"**
3. Copy the **Price ID** (starts with `price_`) - you'll need this for testing

## Part 5: Update Your Code with Real Price ID

Update the price_id in your SubscriptionManager component:

```typescript
// In frontend/src/components/SubscriptionManager.tsx
body: JSON.stringify({
  price_id: 'price_YOUR_ACTUAL_PRICE_ID_HERE' // Replace with your real price ID
})
```

## Part 6: Testing Your Setup

### Test 1: Verify API Keys Work
Run this command to test your Stripe connection:

```bash
curl -X GET "https://api.stripe.com/v1/customers" \
  -H "Authorization: Bearer sk_test_YOUR_SECRET_KEY"
```

### Test 2: Test Webhook Endpoint
1. In Stripe Dashboard, go to your webhook
2. Click **"Send test webhook"**
3. Select an event type and send it
4. Check your application logs to see if the webhook was received

### Test 3: Create a Test Checkout Session
Use your application's subscription button to create a checkout session and verify it works.

## Part 7: Test Credit Cards

Stripe provides test credit card numbers for testing:

- **Successful payment**: 4242 4242 4242 4242
- **Declined payment**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0025 0000 3155

Use any future expiry date and any 3-digit CVC.

## Important Notes

### Security
- **Never** commit real API keys to version control
- Use test keys for development
- Switch to live keys only in production

### Webhook Security
- Your webhook endpoint validates Stripe signatures for security
- The webhook secret is used to verify that webhooks come from Stripe

### Testing vs Production
- Test mode data is completely separate from live mode
- You can safely test without affecting real customers or payments
- Switch to live mode only when ready for production

## Troubleshooting

### Common Issues
1. **Webhook not receiving events**: Check that your local server is running and accessible
2. **Invalid API key**: Make sure you're using the correct test/live mode keys
3. **Webhook signature verification fails**: Ensure your webhook secret is correct

### For Local Development
If testing webhooks locally, consider using:
- **ngrok**: To expose your local server to the internet
- **Stripe CLI**: For forwarding webhooks to your local development server

```bash
# Install Stripe CLI and forward webhooks
stripe listen --forward-to localhost:8000/api/v1/billing/webhook
```

## Next Steps

1. Replace the placeholder keys with your actual test keys
2. Create a test product and get the price ID
3. Update your code with the real price ID
4. Test the complete flow from subscription creation to webhook handling
5. When ready for production, switch to live keys and update webhook URLs

Your Stripe integration is now ready for testing!
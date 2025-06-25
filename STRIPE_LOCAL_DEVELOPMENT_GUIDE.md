# Stripe Local Development Setup Guide

## The Webhook Challenge

When developing locally, Stripe webhooks cannot reach `http://127.0.0.1:8000` because:
- Stripe requires publicly accessible URLs
- Localhost URLs are not accessible from the internet
- This is a common challenge in local development

## Solution: Stripe CLI (Recommended)

The Stripe CLI creates a secure tunnel to forward webhook events to your local server.

### Step 1: Install Stripe CLI

**Option A: Using Homebrew (if available)**
```bash
brew install stripe/stripe-cli/stripe
```

**Option B: Direct Download**
1. Go to: https://github.com/stripe/stripe-cli/releases
2. Download the appropriate version for your system:
   - macOS: `stripe_darwin_x86_64.tar.gz` (Intel) or `stripe_darwin_arm64.tar.gz` (Apple Silicon)
   - Windows: `stripe_windows_x86_64.zip`
   - Linux: `stripe_linux_x86_64.tar.gz`
3. Extract and move to your PATH:
   ```bash
   # For macOS/Linux
   tar -xzf stripe_*.tar.gz
   sudo mv stripe /usr/local/bin/
   ```

### Step 2: Authenticate with Stripe

```bash
stripe login
```

This opens your browser to authenticate with your Stripe account.

### Step 3: Start Webhook Forwarding

Make sure your backend server is running on port 8000, then:

```bash
stripe listen --forward-to localhost:8000/api/v1/billing/webhook
```

**Expected Output:**
```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
> 2024-01-15 10:30:00   --> charge.succeeded [evt_1234567890]
> 2024-01-15 10:30:00  <--  [200] POST http://localhost:8000/api/v1/billing/webhook [evt_1234567890]
```

### Step 4: Update Environment Variables

Copy the webhook signing secret from the CLI output and update your `backend/.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

**Important:** The webhook secret changes each time you restart `stripe listen`.

### Step 5: Test the Setup

In a new terminal, trigger a test event:

```bash
stripe trigger payment_intent.succeeded
```

You should see:
1. Event logged in the Stripe CLI
2. Webhook received in your backend logs
3. HTTP 200 response confirming successful processing

## Alternative: Manual Testing (Without Stripe CLI)

If you can't install Stripe CLI immediately, you can still test the billing integration:

### 1. Test Checkout Session Creation

```bash
# Get auth token
TOKEN=$(curl -s -X POST "http://127.0.0.1:8000/api/v1/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testauth@testfirm.com&password=testpassword123" | \
  python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Test checkout session creation
curl -X POST "http://127.0.0.1:8000/api/v1/billing/create-checkout-session" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"price_id": "price_test_example"}'
```

### 2. Test Webhook Endpoint (Manual)

```bash
# Test webhook endpoint with dummy data
curl -X POST "http://127.0.0.1:8000/api/v1/billing/webhook" \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=dummy_signature" \
  -d '{"type": "test.event", "data": {"object": {"id": "test_123"}}}'
```

**Note:** This will fail signature verification, but confirms the endpoint is reachable.

## Production Deployment

For production, you'll create a real webhook endpoint in the Stripe Dashboard:

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter your production URL: `https://yourdomain.com/api/v1/billing/webhook`
4. Select events: `checkout.session.completed`, `invoice.payment_succeeded`, `invoice.payment_failed`
5. Copy the webhook secret to your production environment variables

## Troubleshooting

### Common Issues

**1. "stripe: command not found"**
- Stripe CLI is not installed or not in PATH
- Follow installation steps above

**2. "Failed to authenticate"**
- Run `stripe login` to authenticate
- Ensure you have access to the Stripe account

**3. "Connection refused"**
- Backend server is not running
- Check that server is on `http://127.0.0.1:8000`

**4. "Invalid signature"**
- Webhook secret doesn't match
- Copy the exact secret from `stripe listen` output
- Restart backend after updating `.env`

### Verification Steps

1. **Backend Running:** `curl http://127.0.0.1:8000/docs`
2. **Auth Working:** Test login endpoint
3. **Billing Endpoint:** Test checkout session creation
4. **Stripe CLI:** `stripe listen` shows "Ready!"
5. **Webhook Secret:** Updated in `backend/.env`

## Next Steps

Once webhooks are working:

1. **Create Test Products** in Stripe Dashboard
2. **Update Price IDs** in frontend components
3. **Test Full Flow** from frontend to Stripe and back
4. **Monitor Webhook Events** in Stripe Dashboard

## Resources

- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Webhook Testing Guide](https://stripe.com/docs/webhooks/test)
- [Local Development Best Practices](https://stripe.com/docs/webhooks/best-practices)
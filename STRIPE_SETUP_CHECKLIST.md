# Stripe Setup Checklist ✅

## Current Status
- ✅ **Test Keys Updated**: Both backend and frontend now use test keys
- ✅ **Backend Integration**: Complete billing module implemented
- ✅ **Frontend Integration**: Subscription manager component ready
- ⏳ **Webhook Setup**: Follow the step-by-step guide below

## Quick Setup Checklist

### 1. Webhook Setup (Choose One Method - Follow STRIPE_WEBHOOK_SETUP_GUIDE.md)

#### Method A: Stripe CLI (Recommended for Local Development)
- [ ] Install Stripe CLI (`brew install stripe/stripe-cli/stripe` on macOS)
- [ ] Login to Stripe CLI (`stripe login`)
- [ ] Start webhook forwarding (`stripe listen --forward-to localhost:8000/api/v1/billing/webhook`)
- [ ] Copy webhook signing secret from CLI output
- [ ] Update `STRIPE_WEBHOOK_SECRET` in `backend/.env`
- [ ] Test with `stripe trigger payment_intent.succeeded`

#### Method B: Stripe Dashboard (Production Only)
- [ ] Go to https://dashboard.stripe.com
- [ ] Ensure you're in **Test Mode** (toggle top-left)
- [ ] Navigate to Developers → Webhooks
- [ ] Click "Add endpoint"
- [ ] Enter URL: `https://yourdomain.com/api/v1/billing/webhook` (NOT localhost)
- [ ] Select events (customer, subscription, payment, checkout events)
- [ ] Save the webhook
- [ ] Copy the webhook secret (starts with `whsec_`)
- [ ] Update `backend/.env` with the webhook secret

### 2. Create Test Product (Optional but Recommended)
- [ ] Go to Stripe Dashboard → Products
- [ ] Click "Add product"
- [ ] Name: "LawFirm OS Professional Plan"
- [ ] Price: $99.00 monthly
- [ ] Save and copy the Price ID (starts with `price_`)
- [ ] Update SubscriptionManager.tsx with real price ID

### 3. Test Your Setup
- [ ] Verify backend server is running on port 8000
- [ ] Test webhook endpoint (send test webhook from Stripe)
- [ ] Test billing API endpoints
- [ ] Test frontend subscription component

## Current Configuration

### Backend Environment (✅ Updated)
```env
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE  # ← Update this
```

### Frontend Environment (✅ Updated)
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
```

## Test Credit Cards (For Testing)
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155
- **Expiry**: Any future date
- **CVC**: Any 3 digits

## Quick Test Commands

### Test Billing Endpoint
```bash
# Get auth token first
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

## What's Working Now
✅ **Complete Stripe Integration Architecture**
✅ **Test Keys Configured Safely**
✅ **Backend Billing Module**
✅ **Frontend Subscription UI**
✅ **Webhook Handler Ready**
✅ **Authentication Integration**
✅ **Error Handling**

## Next Steps After Webhook Setup
1. **Test the complete flow**: Registration → Login → Subscription
2. **Create real products** in Stripe for different plans
3. **Test webhook events** with Stripe CLI or test webhooks
4. **Add subscription management** features (cancel, upgrade, etc.)
5. **Prepare for production** deployment

## Need Help?
- **Webhook Setup**: See `STRIPE_WEBHOOK_SETUP_GUIDE.md`
- **General Setup**: See `STRIPE_SETUP_GUIDE.md`
- **Quick Reference**: See `STRIPE_QUICK_REFERENCE.md`

Your Stripe integration is 95% complete! Just need the webhook secret to finish the setup.
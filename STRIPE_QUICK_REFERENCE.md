# Stripe Quick Reference - Test vs Live Keys

## Current Status
✅ **Sprint S2 Complete**: Full Stripe billing integration implemented
⚠️ **Current Setup**: Using live keys (should switch to test keys for development)

## Key Differences

### Test Keys (Recommended for Development)
```
Secret Key:      sk_test_...
Publishable Key: pk_test_...
Webhook Secret:  whsec_...
```

### Live Keys (Production Only)
```
Secret Key:      sk_live_...  ← Currently using these
Publishable Key: pk_live_...  ← Currently using these
Webhook Secret:  whsec_...
```

## Immediate Action Required

### 1. Switch to Test Keys
- Go to https://dashboard.stripe.com
- Make sure you're in **Test Mode** (toggle top-left)
- Get your test keys from Developers → API keys
- Replace current live keys with test keys

### 2. Current Files to Update
```bash
# Backend
backend/.env
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY

# Frontend  
frontend/.env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
```

### 3. Create Test Product
- In Stripe Dashboard → Products
- Create "LawFirm OS Professional Plan" 
- Set price to $99/month
- Copy the Price ID (price_...)

### 4. Update Code with Real Price ID
```typescript
// frontend/src/components/SubscriptionManager.tsx line 30
price_id: 'price_YOUR_REAL_PRICE_ID' // Replace price_test_example
```

## Test Credit Cards
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

## Quick Test Commands

### Test Stripe Connection
```bash
curl -X GET "https://api.stripe.com/v1/customers" \
  -H "Authorization: Bearer sk_test_YOUR_SECRET_KEY"
```

### Test Your Billing Endpoint
```bash
# First get a token
TOKEN=$(curl -s -X POST "http://127.0.0.1:8000/api/v1/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=testauth@testfirm.com&password=testpassword123" | \
  python -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Then test checkout session
curl -X POST "http://127.0.0.1:8000/api/v1/billing/create-checkout-session" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"price_id": "price_YOUR_REAL_PRICE_ID"}'
```

## Why Use Test Keys?

### Safety
- No real money transactions
- Safe to experiment and test
- Separate from production data

### Features
- All Stripe features available
- Test webhooks and events
- Simulate different scenarios

### Best Practice
- Always develop with test keys
- Switch to live keys only in production
- Never commit live keys to code

## Next Steps After Setup

1. **Replace live keys with test keys**
2. **Create test product and get price ID**
3. **Set up webhook endpoint**
4. **Test complete billing flow**
5. **Verify webhook handling**

Your billing system is ready - just needs proper test configuration!
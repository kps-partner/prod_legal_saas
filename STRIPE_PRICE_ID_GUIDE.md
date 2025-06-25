# How to Get Stripe Price IDs for Products

This guide explains how to create products and get their Price IDs in Stripe for use in your billing system.

## Method 1: Using Stripe Dashboard (Recommended for Testing)

### Step 1: Access Stripe Dashboard
1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** (toggle in top-left should show "Test")
3. Navigate to **Products** in the left sidebar

### Step 2: Create a Product
1. Click **"+ Add product"** button
2. Fill in product details:
   - **Name**: e.g., "LawFirm OS Pro Plan"
   - **Description**: e.g., "Professional subscription for law firms"
   - **Image**: Optional product image

### Step 3: Create a Price
1. In the **Pricing** section:
   - **Pricing model**: Choose "Standard pricing"
   - **Price**: Enter amount (e.g., $99.00)
   - **Billing period**: Choose "Monthly" or "Yearly"
   - **Currency**: USD (or your preferred currency)
2. Click **"Save product"**

### Step 4: Get the Price ID
1. After saving, you'll see your product in the Products list
2. Click on the product name to view details
3. In the **Pricing** section, you'll see the Price ID
4. **Price ID format**: `price_1234567890abcdef` (starts with `price_`)
5. **Copy this Price ID** - you'll need it for your application

## Method 2: Using Stripe CLI

### Create Product and Price via CLI
```bash
# Create a product
stripe products create \
  --name "LawFirm OS Pro Plan" \
  --description "Professional subscription for law firms"

# Create a price for the product (replace prod_xxx with your product ID)
stripe prices create \
  --product prod_1234567890 \
  --unit-amount 9900 \
  --currency usd \
  --recurring[interval]=month
```

### List existing prices
```bash
# List all prices
stripe prices list

# List prices for a specific product
stripe prices list --product prod_1234567890
```

## Method 3: Using Stripe API

### Create Product and Price via API
```python
import stripe
stripe.api_key = "sk_test_..."

# Create product
product = stripe.Product.create(
    name="LawFirm OS Pro Plan",
    description="Professional subscription for law firms"
)

# Create price
price = stripe.Price.create(
    product=product.id,
    unit_amount=9900,  # $99.00 in cents
    currency='usd',
    recurring={'interval': 'month'}
)

print(f"Price ID: {price.id}")
```

## Updating Your Application

### Step 1: Update Frontend Component
Edit `frontend/src/components/SubscriptionManager.tsx`:

```typescript
// Replace the placeholder price ID with your real Price ID
const handleSubscribe = async () => {
  try {
    const response = await fetch('/api/v1/billing/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        price_id: 'price_1RdwH9Cvk8IU6PphY4Kn53nV' // Replace with your actual Price ID
      }),
    });
    // ... rest of the code
  } catch (error) {
    console.error('Subscription error:', error);
  }
};
```

### Step 2: Test with Real Price ID
Once you have a real Price ID, you can test the checkout session creation:

```bash
curl -X POST "http://127.0.0.1:8000/api/v1/billing/create-checkout-session" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "price_id": "price_1RdwH9Cvk8IU6PphY4Kn53nV"
  }'
```

## Common Price ID Patterns

### Test Environment Price IDs
- Format: `price_1234567890abcdef`
- Example: `price_1RdwH9Cvk8IU6PphY4Kn53nV`

### Live Environment Price IDs
- Same format as test, but created in live mode
- **Important**: Test and live Price IDs are different!

## Best Practices

### 1. Environment-Specific Price IDs
Create separate Price IDs for test and production:

```bash
# Test environment
STRIPE_PRICE_ID_MONTHLY_TEST=price_1234567890test
STRIPE_PRICE_ID_YEARLY_TEST=price_1234567890test

# Production environment  
STRIPE_PRICE_ID_MONTHLY_LIVE=price_1234567890live
STRIPE_PRICE_ID_YEARLY_LIVE=price_1234567890live
```

### 2. Multiple Pricing Tiers
Create different products for different plans:

```bash
# Basic Plan
STRIPE_PRICE_ID_BASIC=price_1234567890basic

# Pro Plan  
STRIPE_PRICE_ID_PRO=price_1234567890pro

# Enterprise Plan
STRIPE_PRICE_ID_ENTERPRISE=price_1234567890enterprise
```

### 3. Configuration Management
Store Price IDs in your environment configuration:

```python
# backend/app/core/config.py
class Settings(BaseSettings):
    # ... existing settings
    STRIPE_PRICE_ID_MONTHLY: str
    STRIPE_PRICE_ID_YEARLY: str
```

## Troubleshooting

### Invalid Price ID Error
- **Error**: "No such price: price_1234567890"
- **Solution**: Verify the Price ID exists in your Stripe account
- **Check**: Make sure you're using the correct test/live mode

### Price ID Not Found
- **Error**: "This price does not exist"
- **Solution**: Ensure the Price ID is copied correctly (no extra spaces)
- **Check**: Verify the price is active (not archived)

### Wrong Environment
- **Error**: Price ID works in dashboard but not in app
- **Solution**: Ensure your API keys and Price IDs match the same environment (test/live)

## Next Steps

1. **Create your test product and price** in Stripe Dashboard
2. **Copy the Price ID** from the product details page
3. **Update your frontend component** with the real Price ID
4. **Test the checkout flow** with the real Price ID
5. **Create production prices** when ready to go live

Your webhook system is already working perfectly - once you have real Price IDs, you can test the complete billing flow!
# Stripe Customer Portal Setup

The "Manage Billing" button requires the Stripe Customer Portal to be configured in your Stripe Dashboard.

## Quick Setup Steps:

1. **Go to Stripe Dashboard**: https://dashboard.stripe.com/test/settings/billing/portal

2. **Or use the direct Customer Portal link**: https://billing.stripe.com/p/login/test_6oUaEWdJ00dF1Xj4ZYcs800

3. **Enable Customer Portal**: Click "Activate test link" or "Turn on customer portal"

3. **Configure Settings** (recommended defaults):
   - **Business information**: Add your business name and support details
   - **Functionality**: Enable the features you want customers to access:
     - ✅ Update payment method
     - ✅ View billing history
     - ✅ Download invoices
     - ✅ Cancel subscription (if you want customers to self-cancel)
   - **Appearance**: Customize colors and branding to match your app

4. **Save Configuration**: Click "Save" to activate the customer portal

## Testing the Integration:

Once configured, the "Manage Billing" button will redirect users to the Stripe Customer Portal where they can:
- Update their payment methods
- View and download invoices
- See their subscription details
- Cancel their subscription (if enabled)
- Update billing address

## Current Implementation:

- ✅ Backend API endpoint: `/api/v1/billing/create-customer-portal-session`
- ✅ Frontend integration: "Manage Billing" button in billing settings
- ✅ Error handling: Shows helpful message when portal is not configured
- ✅ Return URL: Redirects back to `/settings/billing` after portal session

## Error Handling:

The system now provides clear error messages when the customer portal is not configured, guiding users to set it up in the Stripe Dashboard.
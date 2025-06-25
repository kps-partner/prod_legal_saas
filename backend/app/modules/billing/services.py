import stripe
from fastapi import HTTPException
from app.core.config import settings
from app.shared.models import Firm, User
from app.core.db import db
from bson import ObjectId

stripe.api_key = settings.STRIPE_SECRET_KEY

async def create_checkout_session(price_id: str, current_user: User):
    try:
        # Get the firm and its stripe_customer_id
        try:
            firm = db.firms.find_one({"_id": ObjectId(current_user.firm_id)})
            customer_id = firm.get("stripe_customer_id") if firm else None
            
            # Check if the customer exists in Stripe (handle fallback customer IDs)
            if customer_id and not customer_id.startswith("cus_"):
                # This is a fallback customer ID, treat as if no customer exists
                customer_id = None
                
            if customer_id:
                try:
                    # Verify the customer exists in Stripe
                    stripe.Customer.retrieve(customer_id)
                    print(f"Using existing Stripe customer: {customer_id}")
                except stripe.error.InvalidRequestError:
                    # Customer doesn't exist in Stripe, create a new one
                    customer_id = None
                    
        except Exception as db_error:
            print(f"Database connection failed: {db_error}")
            customer_id = None

        # Create a new Stripe customer if needed
        if not customer_id:
            print("Creating new Stripe customer...")
            customer = stripe.Customer.create(
                email=current_user.email,
                name=f"{current_user.name} - {current_user.email}",
                metadata={"user_email": current_user.email, "firm_id": current_user.firm_id}
            )
            customer_id = customer.id
            print(f"Created new Stripe customer: {customer_id}")
            
            # Update the firm with the new customer ID
            try:
                db.firms.update_one(
                    {"_id": ObjectId(current_user.firm_id)},
                    {"$set": {"stripe_customer_id": customer_id}}
                )
                print(f"Updated firm {current_user.firm_id} with Stripe customer ID: {customer_id}")
            except Exception as update_error:
                print(f"Failed to update firm with customer ID: {update_error}")

        checkout_session = stripe.checkout.Session.create(
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                },
            ],
            mode="subscription",
            success_url="http://localhost:3000/dashboard?success=true",
            cancel_url="http://localhost:3000/dashboard?canceled=true",
            customer=customer_id,
        )
        return checkout_session
    except Exception as e:
        print(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def create_customer_portal_session(current_user: User):
    """Create a Stripe customer portal session for the current user's firm."""
    try:
        # Retrieve the firm from the database
        firm = db.firms.find_one({"_id": ObjectId(current_user.firm_id)})
        if not firm:
            raise HTTPException(status_code=404, detail="Firm not found")
        
        # Check if the firm has a stripe_customer_id
        stripe_customer_id = firm.get("stripe_customer_id")
        if not stripe_customer_id:
            raise HTTPException(
                status_code=400,
                detail="No Stripe customer ID found for this firm. Please create a subscription first."
            )
        
        # Create the customer portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=stripe_customer_id,
            return_url="http://localhost:3000/dashboard",
        )
        
        return portal_session
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def handle_stripe_webhook(payload: bytes, sig_header: str):
    print(f"Webhook received - Signature header: {sig_header}")
    print(f"Webhook secret configured: {settings.STRIPE_WEBHOOK_SECRET[:10]}...")
    
    if not sig_header:
        print("ERROR: No stripe-signature header found")
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        print(f"Successfully verified webhook event: {event['type']}")
    except ValueError as e:
        # Invalid payload
        print(f"ERROR: Invalid payload - {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid payload: {str(e)}")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        print(f"ERROR: Invalid signature - {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid signature: {str(e)}")

    # Handle the event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        customer_id = session.get("customer")
        if customer_id:
            db.firms.update_one(
                {"stripe_customer_id": customer_id},
                {"$set": {"subscription_status": "active"}},
            )
            print(f"Updated firm subscription status to active for customer: {customer_id}")
    elif event["type"] == "customer.subscription.updated":
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        subscription_status = subscription.get("status")
        if customer_id and subscription_status:
            # Map Stripe subscription statuses to our internal statuses
            status_mapping = {
                "active": "active",
                "past_due": "past_due",
                "canceled": "inactive",
                "unpaid": "inactive",
                "incomplete": "incomplete",
                "incomplete_expired": "inactive",
                "trialing": "active",
                "paused": "paused"
            }
            internal_status = status_mapping.get(subscription_status, "inactive")
            
            db.firms.update_one(
                {"stripe_customer_id": customer_id},
                {"$set": {"subscription_status": internal_status}},
            )
            print(f"Updated firm subscription status to {internal_status} for customer: {customer_id} (Stripe status: {subscription_status})")
    elif event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        if customer_id:
            db.firms.update_one(
                {"stripe_customer_id": customer_id},
                {"$set": {"subscription_status": "inactive"}},
            )
            print(f"Updated firm subscription status to inactive for customer: {customer_id}")
    else:
        print(f"Received unhandled event type: {event['type']}")

    return {"status": "success"}
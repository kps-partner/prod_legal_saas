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
        print(f"Creating customer portal session for user: {current_user.email}, firm_id: {current_user.firm_id}")
        
        # Retrieve the firm from the database
        firm = db.firms.find_one({"_id": ObjectId(current_user.firm_id)})
        if not firm:
            print(f"ERROR: Firm not found for ID: {current_user.firm_id}")
            raise HTTPException(status_code=404, detail="Firm not found")
        
        print(f"Found firm: {firm.get('name', 'Unknown')}")
        
        # Check if the firm has a stripe_customer_id
        stripe_customer_id = firm.get("stripe_customer_id")
        if not stripe_customer_id:
            print(f"ERROR: No Stripe customer ID found for firm: {current_user.firm_id}")
            raise HTTPException(
                status_code=400,
                detail="No Stripe customer ID found for this firm. Please create a subscription first."
            )
        
        print(f"Using Stripe customer ID: {stripe_customer_id}")
        
        # Create the customer portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=stripe_customer_id,
            return_url="http://localhost:3000/settings/billing",
        )
        
        print(f"Successfully created customer portal session: {portal_session.id}")
        return portal_session
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except stripe.error.InvalidRequestError as e:
        error_msg = str(e)
        print(f"Stripe InvalidRequestError: {error_msg}")
        
        # Check if this is the customer portal configuration error
        if "No configuration provided" in error_msg and "customer portal settings" in error_msg:
            raise HTTPException(
                status_code=400,
                detail="Customer portal is not configured. Please set up your customer portal settings in the Stripe Dashboard at https://dashboard.stripe.com/test/settings/billing/portal"
            )
        else:
            raise HTTPException(status_code=400, detail=f"Stripe error: {error_msg}")
    except Exception as e:
        print(f"ERROR creating customer portal session: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def cancel_subscription(current_user: User):
    """Cancel the current user's subscription at the end of the billing period."""
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
                detail="No Stripe customer ID found for this firm. No active subscription to cancel."
            )
        
        # Get the customer's active subscriptions
        subscriptions = stripe.Subscription.list(
            customer=stripe_customer_id,
            status="active",
            limit=1
        )
        
        if not subscriptions.data:
            raise HTTPException(
                status_code=400,
                detail="No active subscription found to cancel."
            )
        
        subscription = subscriptions.data[0]
        
        # Cancel the subscription at the end of the billing period
        updated_subscription = stripe.Subscription.modify(
            subscription.id,
            cancel_at_period_end=True
        )
        
        print(f"Subscription {subscription.id} set to cancel at period end for customer: {stripe_customer_id}")
        
        return {
            "message": "Subscription will be canceled at the end of the current billing period",
            "subscription_id": subscription.id,
            "current_period_end": getattr(updated_subscription, 'current_period_end', None),
            "cancel_at_period_end": getattr(updated_subscription, 'cancel_at_period_end', None)
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"Error canceling subscription: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def handle_stripe_webhook(payload: bytes, sig_header: str):
    print(f"=== WEBHOOK DEBUG START ===")
    print(f"Webhook received - Signature header: {sig_header}")
    print(f"Webhook secret configured: {settings.STRIPE_WEBHOOK_SECRET[:10]}...")
    print(f"Payload length: {len(payload)} bytes")
    
    if not sig_header:
        print("ERROR: No stripe-signature header found")
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        print(f"✅ Successfully verified webhook event: {event['type']}")
        print(f"Event ID: {event.get('id', 'Unknown')}")
    except ValueError as e:
        # Invalid payload
        print(f"❌ ERROR: Invalid payload - {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid payload: {str(e)}")
    except stripe.error.SignatureVerificationError as e:
        # Invalid signature
        print(f"❌ ERROR: Invalid signature - {str(e)}")
        raise HTTPException(status_code=400, detail=f"Invalid signature: {str(e)}")

    # Handle the event
    if event["type"] == "checkout.session.completed":
        print(f"🔄 Processing checkout.session.completed event")
        session = event["data"]["object"]
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")
        
        print(f"Session data - Customer ID: {customer_id}, Subscription ID: {subscription_id}")
        print(f"Session mode: {session.get('mode')}")
        print(f"Payment status: {session.get('payment_status')}")
        
        if customer_id:
            # Check if firm exists before updating
            existing_firm = db.firms.find_one({"stripe_customer_id": customer_id})
            print(f"Firm lookup result: {existing_firm is not None}")
            if existing_firm:
                print(f"Found firm: {existing_firm.get('name', 'Unknown')} (ID: {existing_firm.get('_id')})")
            else:
                print(f"❌ No firm found with stripe_customer_id: {customer_id}")
                # Let's also check all firms to see what customer IDs exist
                all_firms = list(db.firms.find({}, {"name": 1, "stripe_customer_id": 1}))
                print(f"All firms in database: {len(all_firms)}")
                for firm in all_firms[:5]:  # Show first 5 firms
                    print(f"  - {firm.get('name', 'Unknown')}: {firm.get('stripe_customer_id', 'No customer ID')}")
            
            result = db.firms.update_one(
                {"stripe_customer_id": customer_id},
                {"$set": {"subscription_status": "active"}},
            )
            print(f"Database update result - Matched: {result.matched_count}, Modified: {result.modified_count}")
            
            if result.modified_count > 0:
                print(f"✅ Successfully updated firm subscription status to active for customer: {customer_id}")
            else:
                print(f"❌ Failed to update firm - no documents modified for customer: {customer_id}")
        else:
            print(f"❌ No customer_id found in checkout session")
    elif event["type"] == "customer.subscription.updated":
        subscription = event["data"]["object"]
        customer_id = subscription.get("customer")
        subscription_status = subscription.get("status")
        cancel_at_period_end = subscription.get("cancel_at_period_end", False)
        
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
            
            # If subscription is active but set to cancel at period end, mark as "canceling"
            if subscription_status == "active" and cancel_at_period_end:
                internal_status = "canceling"
            
            update_data = {"subscription_status": internal_status}
            
            # Store the period end date if subscription is set to cancel
            if cancel_at_period_end:
                current_period_end = subscription.get("current_period_end")
                if current_period_end:
                    update_data["subscription_ends_at"] = current_period_end
                    print(f"Setting subscription_ends_at to: {current_period_end}")
            else:
                # Remove the ends_at field if cancellation was undone
                update_data["$unset"] = {"subscription_ends_at": ""}
            
            db.firms.update_one(
                {"stripe_customer_id": customer_id},
                {"$set": update_data} if "$unset" not in update_data else {
                    "$set": {k: v for k, v in update_data.items() if k != "$unset"},
                    "$unset": update_data["$unset"]
                }
            )
            
            status_msg = f"{internal_status} for customer: {customer_id} (Stripe status: {subscription_status}"
            if cancel_at_period_end:
                status_msg += f", canceling at period end"
            status_msg += ")"
            print(f"Updated firm subscription status to {status_msg}")
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
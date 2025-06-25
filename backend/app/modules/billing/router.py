from fastapi import APIRouter, Depends, Request
from app.modules.billing import services
from app.modules.billing.schemas import CreateCheckoutSessionRequest
from app.modules.auth.services import get_current_user
from app.shared.models import User

router = APIRouter()

@router.post("/create-checkout-session")
async def create_checkout_session(
    request: CreateCheckoutSessionRequest,
    current_user: User = Depends(get_current_user),
):
    return await services.create_checkout_session(request.price_id, current_user)

@router.post("/create-customer-portal-session")
async def create_customer_portal_session(
    current_user: User = Depends(get_current_user),
):
    return await services.create_customer_portal_session(current_user)

@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
):
    return await services.cancel_subscription(current_user)

@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    return await services.handle_stripe_webhook(payload, sig_header)
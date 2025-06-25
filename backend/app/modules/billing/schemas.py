from pydantic import BaseModel

class CreateCheckoutSessionRequest(BaseModel):
    price_id: str
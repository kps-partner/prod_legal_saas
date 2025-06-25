from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class Firm(BaseModel):
    """Firm model for MongoDB storage."""
    id: Optional[str] = Field(default=None, alias="_id")
    name: str
    subscription_status: str = "inactive"
    stripe_customer_id: Optional[str] = None
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }


class User(BaseModel):
    """User model for MongoDB storage."""
    id: Optional[str] = Field(default=None, alias="_id")
    email: EmailStr
    hashed_password: str
    name: str
    role: str
    firm_id: str  # This will store the ObjectId as a string
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True
    }
from pydantic import BaseModel
from pydantic import EmailStr
from typing import Optional


class UserCreate(BaseModel):
    firm_name: str
    user_name: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    email: str
    name: str
    role: str
    firm_id: str
    subscription_status: str = "inactive"
    subscription_ends_at: Optional[int] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
from pydantic import BaseModel
from pydantic import EmailStr
from typing import Optional


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    firm_id: str


class UserResponse(BaseModel):
    email: str
    name: str
    role: str
    firm_id: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
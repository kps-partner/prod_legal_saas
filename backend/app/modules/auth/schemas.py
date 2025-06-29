from pydantic import BaseModel
from pydantic import EmailStr
from typing import Optional
from datetime import datetime
from app.shared.models import UserRole, UserStatus


class UserCreate(BaseModel):
    firm_name: str
    user_name: str
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: Optional[str] = None
    email: str
    name: str
    role: str
    firm_id: str
    status: str = "active"
    subscription_status: str = "inactive"
    subscription_ends_at: Optional[int] = None
    last_password_change: Optional[datetime] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None


# User Management Schemas
class UserInvite(BaseModel):
    email: EmailStr
    name: str
    role: UserRole


class UserInviteResponse(BaseModel):
    message: str
    user_id: str
    email: str
    temporary_password: str
    expires_at: datetime


class UserUpdate(BaseModel):
    role: Optional[UserRole] = None
    status: Optional[UserStatus] = None


class UserListItem(BaseModel):
    id: str
    email: str
    name: str
    role: str
    status: str
    created_at: Optional[datetime] = None
    last_password_change: Optional[datetime] = None


class UserListResponse(BaseModel):
    users: list[UserListItem]
    total: int


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class PasswordChangeResponse(BaseModel):
    message: str
    requires_relogin: bool = False
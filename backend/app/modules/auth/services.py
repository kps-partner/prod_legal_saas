from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
from app.shared.models import User
from app.core.db import client

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "your-secret-key-here"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_user_by_email(email: str) -> Optional[User]:
    """Get user by email from database."""
    db = client.lawfirm_os
    user_data = await db.users.find_one({"email": email})
    if user_data:
        return User(**user_data)
    return None


async def authenticate_user(email: str, password: str) -> Optional[User]:
    """Authenticate a user."""
    user = await get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def create_user(user_data: dict) -> User:
    """Create a new user."""
    db = client.lawfirm_os
    hashed_password = get_password_hash(user_data["password"])
    user_dict = {
        "email": user_data["email"],
        "hashed_password": hashed_password,
        "name": user_data["name"],
        "role": user_data["role"],
        "firm_id": user_data["firm_id"]
    }
    result = await db.users.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    return User(**user_dict)
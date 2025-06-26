from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_DETAILS: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    STRIPE_SECRET_KEY: str
    STRIPE_PUBLISHABLE_KEY: str
    STRIPE_WEBHOOK_SECRET: str
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REDIRECT_URI: str
    
    # Gmail API Configuration
    GMAIL_API_SCOPES: list = [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/gmail.send"
    ]
    EMAIL_FROM_NAME: str = "Vibecamp Legal"

    class Config:
        env_file = ".env"

settings = Settings()
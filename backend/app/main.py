from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.db import check_db_connection, client
from app.modules.auth.router import router as auth_router
from app.modules.billing.router import router as billing_router
from app.modules.scheduling.router import router as scheduling_router
from app.modules.firms.router import router as firms_router
from app.modules.public.router import router as public_router
from app.modules.cases.router import router as cases_router
from app.modules.timeline.router import router as timeline_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    check_db_connection()
    yield
    # Shutdown


app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(billing_router, prefix="/api/v1/billing", tags=["billing"])
app.include_router(scheduling_router, prefix="/api/v1/integrations", tags=["integrations"])
app.include_router(firms_router, prefix="/api/v1/settings", tags=["settings"])
app.include_router(public_router, prefix="/api/v1/public", tags=["public"])
app.include_router(cases_router, prefix="/api/v1/cases", tags=["cases"])
app.include_router(timeline_router, prefix="/api/v1/cases", tags=["timeline"])

# Add users router for the /me endpoint
from fastapi import APIRouter, Depends
from app.modules.auth.services import get_current_user, get_user_with_firm_info
from app.modules.auth.schemas import UserResponse

users_router = APIRouter()

@users_router.get("/me", response_model=UserResponse)
def read_users_me(current_user = Depends(get_current_user)):
    """Get current user information with subscription status."""
    try:
        # Try to get user with firm info from database
        user_with_firm = get_user_with_firm_info(current_user.email)
        if user_with_firm:
            user = user_with_firm["user"]
            subscription_status = user_with_firm["subscription_status"]
            subscription_ends_at = user_with_firm["subscription_ends_at"]
            return UserResponse(
                email=user.email,
                name=user.name,
                role=user.role,
                firm_id=user.firm_id,
                subscription_status=subscription_status,
                subscription_ends_at=subscription_ends_at
            )
    except Exception as e:
        print(f"Database error in /users/me: {e}")
    
    # Fallback for when database is not available (testing)
    return UserResponse(
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        firm_id=current_user.firm_id,
        subscription_status="inactive",
        subscription_ends_at=None
    )

app.include_router(users_router, prefix="/api/v1/users", tags=["users"])


@app.get("/api/v1/health")
def health_check():
    try:
        client.admin.command("ping")
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {e}")
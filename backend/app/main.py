from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.db import check_db_connection, client


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


@app.get("/api/v1/health")
def health_check():
    try:
        client.admin.command("ping")
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {e}")
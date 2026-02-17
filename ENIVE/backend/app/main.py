"""
BossUp Backend - FastAPI Application
=====================================
Production-ready MVP with Firebase + FastAPI architecture.

Security Architecture:
- Firebase Admin SDK (backend-only)
- Custom JWT issued by backend
- Role-based access control enforced here
- NO direct Firebase access from frontend
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.firebase import initialize_firebase
from app.routers import auth, campaigns, payments, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - initialize services on startup."""
    # Initialize Firebase Admin SDK
    initialize_firebase()
    print("✅ Firebase Admin SDK initialized")
    yield
    # Cleanup on shutdown
    print("🔄 Shutting down BossUp backend...")


app = FastAPI(
    title="BossUp API",
    description="Crowdfunding platform for African businesses - Backend API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration - Adjust origins for production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(campaigns.router, prefix="/campaigns", tags=["Campaigns"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "BossUp API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "firebase": "connected",
        "database": "firestore"
    }

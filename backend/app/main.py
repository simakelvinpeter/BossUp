"""Serve the BossUp API and frontend."""

import os
import time
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.firebase import initialize_firebase
from app.routers import auth, campaigns, payments, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan - initialize services on startup."""
    initialize_firebase()
    print("✅ Firebase Admin SDK initialized")
    yield
    print("🔄 Shutting down BossUp backend...")


app = FastAPI(
    title="BossUp API",
    description="Crowdfunding platform for African businesses - Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        origin for origin in os.getenv("CORS_ORIGINS", "").split(",") if origin
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(campaigns.router, prefix="/campaigns", tags=["Campaigns"])
app.include_router(payments.router, prefix="/payments", tags=["Payments"])
app.include_router(admin.router, prefix="/admin", tags=["Admin"])


@app.get("/api-info")
async def root():
    """Health check endpoint."""
    return {"status": "online", "service": "BossUp API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {"status": "healthy", "firebase": "connected", "database": "firestore"}


@app.middleware("http")
async def same_origin_writes(request: Request, call_next):
    from urllib.parse import urlparse

    origin = request.headers.get("origin")
    if request.method in {"POST", "PUT", "PATCH", "DELETE"} and origin:
        allowed = [value for value in os.getenv("CORS_ORIGINS", "").split(",") if value]
        same_host = urlparse(origin).netloc == request.headers.get("host")
        if not same_host and origin not in allowed:
            return JSONResponse(
                {"detail": "Request origin is not allowed"}, status_code=403
            )
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; "
        "connect-src 'self'; object-src 'none'; base-uri 'self'; "
        "frame-ancestors 'none'; form-action 'self'"
    )
    if os.getenv("ENVIRONMENT") == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response


frontend = Path(__file__).resolve().parents[2] / "frontend"
app.mount("/", StaticFiles(directory=frontend, html=True), name="frontend")


attempts = {}


@app.middleware("http")
async def limit_sensitive_requests(request: Request, call_next):
    if request.method == "POST" and request.url.path in {
        "/auth/login",
        "/auth/signup",
        "/payments/initiate",
    }:
        current = time.monotonic()
        for key in list(attempts):
            if attempts[key][1] <= current:
                del attempts[key]
        key = (request.client.host if request.client else "unknown", request.url.path)
        count, expires = attempts.get(key, (0, current + 60))
        if count >= 10:
            return JSONResponse(
                {"detail": "Too many attempts. Please wait a minute."},
                status_code=429,
                headers={"Retry-After": "60"},
            )
        attempts[key] = (count + 1, expires)
    return await call_next(request)

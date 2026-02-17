"""
Security Module - JWT & Role Enforcement
=========================================
Custom JWT issued by backend (NOT Firebase tokens to frontend).

Security Flow:
1. User authenticates via Firebase Auth (backend-side)
2. Backend verifies Firebase ID token
3. Backend issues its own JWT with role & permissions
4. All protected routes require this custom JWT

Roles:
- INVESTOR
- BUSINESS_OWNER
- ADMIN
"""

import os
from datetime import datetime, timedelta
from typing import Optional
from enum import Enum

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.firebase import users_collection, audit_logs_collection


# =============================================================================
# CONFIGURATION
# =============================================================================

# JWT Settings - USE ENVIRONMENT VARIABLES IN PRODUCTION
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "bossup-dev-secret-change-in-production-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

# Security scheme
security = HTTPBearer()


# =============================================================================
# USER ROLES (STRICT)
# =============================================================================

class UserRole(str, Enum):
    """Allowed user roles - enforced by backend, not Firebase rules."""
    INVESTOR = "INVESTOR"
    BUSINESS_OWNER = "BUSINESS_OWNER"
    ADMIN = "ADMIN"


class KYCStatus(str, Enum):
    """KYC verification status."""
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"


# =============================================================================
# TOKEN MODELS
# =============================================================================

class TokenPayload(BaseModel):
    """JWT token payload structure."""
    sub: str  # user_id
    email: str
    role: UserRole
    exp: datetime
    iat: datetime


class TokenResponse(BaseModel):
    """Response model for token endpoints."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: str
    role: str


class CurrentUser(BaseModel):
    """Current authenticated user context."""
    user_id: str
    email: str
    role: UserRole


# =============================================================================
# JWT OPERATIONS
# =============================================================================

def create_access_token(user_id: str, email: str, role: UserRole) -> TokenResponse:
    """
    Create a custom JWT access token.
    
    This is the ONLY token sent to frontend.
    Firebase tokens stay backend-side.
    """
    now = datetime.utcnow()
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "sub": user_id,
        "email": email,
        "role": role.value,
        "iat": now,
        "exp": expire
    }
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return TokenResponse(
        access_token=token,
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user_id=user_id,
        role=role.value
    )


def decode_token(token: str) -> TokenPayload:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return TokenPayload(
            sub=payload["sub"],
            email=payload["email"],
            role=UserRole(payload["role"]),
            exp=datetime.fromtimestamp(payload["exp"]),
            iat=datetime.fromtimestamp(payload["iat"])
        )
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


# =============================================================================
# FASTAPI DEPENDENCIES (Role Enforcement)
# =============================================================================

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> CurrentUser:
    """
    Dependency: Extract and validate current user from JWT.
    
    Usage:
        @router.get("/protected")
        async def protected_route(user: CurrentUser = Depends(get_current_user)):
            ...
    """
    token = credentials.credentials
    payload = decode_token(token)
    
    return CurrentUser(
        user_id=payload.sub,
        email=payload.email,
        role=payload.role
    )


async def require_investor(
    user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """Dependency: Require INVESTOR role."""
    if user.role != UserRole.INVESTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Investor access required"
        )
    return user


async def require_business_owner(
    user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """Dependency: Require BUSINESS_OWNER role."""
    if user.role != UserRole.BUSINESS_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Business owner access required"
        )
    return user


async def require_admin(
    user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """Dependency: Require ADMIN role."""
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user


async def require_investor_or_business(
    user: CurrentUser = Depends(get_current_user)
) -> CurrentUser:
    """Dependency: Require INVESTOR or BUSINESS_OWNER role."""
    if user.role not in [UserRole.INVESTOR, UserRole.BUSINESS_OWNER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Investor or business owner access required"
        )
    return user


# =============================================================================
# AUDIT LOGGING
# =============================================================================

def log_audit_event(action: str, user_id: str, details: Optional[dict] = None) -> None:
    """
    Log security-relevant events to Firestore.
    
    Required for:
    - Login/logout
    - Campaign approval/rejection
    - Payment transactions
    - Admin actions
    """
    audit_logs_collection().add({
        "action": action,
        "user_id": user_id,
        "details": details or {},
        "timestamp": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow()
    })


# =============================================================================
# OWNERSHIP VERIFICATION
# =============================================================================

async def verify_campaign_ownership(campaign_id: str, user_id: str) -> bool:
    """
    Verify that a user owns a specific campaign.
    
    Used for:
    - Editing campaigns
    - Viewing campaign analytics
    """
    from app.core.firebase import campaigns_collection
    
    doc = campaigns_collection().document(campaign_id).get()
    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found"
        )
    
    campaign_data = doc.to_dict()
    if campaign_data.get("owner_id") != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this campaign"
        )
    
    return True

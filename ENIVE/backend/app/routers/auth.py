"""
Authentication Router
======================
Handles signup, login, and user profile endpoints.

Endpoints:
- POST /auth/signup - Register new user
- POST /auth/login - Authenticate user
- GET /auth/me - Get current user profile
"""

from fastapi import APIRouter, HTTPException, Depends, status

from app.core.security import get_current_user, CurrentUser
from app.services.auth_service import (
    auth_service,
    SignupRequest,
    LoginRequest,
    UserProfile,
    TokenResponse
)

router = APIRouter()


@router.post("/signup", response_model=TokenResponse)
async def signup(request: SignupRequest):
    """
    Register a new user.
    
    - Creates Firebase Auth user
    - Creates Firestore profile
    - Returns JWT token
    """
    try:
        token = await auth_service.signup(request)
        return token
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """
    Authenticate user and return JWT.
    
    Note: For production, implement proper password verification
    using Firebase REST API or client SDK proxy.
    """
    try:
        token = await auth_service.login(request)
        return token
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    user: CurrentUser = Depends(get_current_user)
):
    """
    Get current authenticated user's profile.
    
    Requires valid JWT in Authorization header.
    """
    try:
        profile = await auth_service.get_user_profile(user.user_id)
        return profile
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(user: CurrentUser = Depends(get_current_user)):
    """
    Refresh JWT token.
    
    Requires valid (but possibly near-expiry) JWT.
    """
    from app.core.security import create_access_token, UserRole
    
    token = create_access_token(
        user_id=user.user_id,
        email=user.email,
        role=user.role
    )
    return token

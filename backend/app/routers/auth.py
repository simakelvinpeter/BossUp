"""Account signup, login and session routes."""

import os
from fastapi import APIRouter, HTTPException, Depends, status, Response

from app.core.security import get_current_user, CurrentUser
from app.services.auth_service import (
    auth_service,
    SignupRequest,
    LoginRequest,
    UserProfile,
    TokenResponse,
)

router = APIRouter()


def set_session(response, token):
    response.set_cookie(
        "bossup_session",
        token.access_token,
        httponly=True,
        secure=os.getenv("ENVIRONMENT") == "production",
        samesite="lax",
        max_age=token.expires_in,
        path="/",
    )


@router.post("/signup", response_model=TokenResponse)
async def signup(request: SignupRequest, response: Response):
    """Register a new user."""
    try:
        token = await auth_service.signup(request)
        set_session(response, token)
        return token
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}",
        )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, response: Response):
    """Authenticate user and return JWT."""
    try:
        token = await auth_service.login(request)
        set_session(response, token)
        return token
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login is temporarily unavailable",
        )


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(user: CurrentUser = Depends(get_current_user)):
    """
    Get current authenticated user's profile.

    Requires valid JWT in Authorization header.
    """
    try:
        profile = await auth_service.get_user_profile(user.user_id)
        return profile
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    response: Response, user: CurrentUser = Depends(get_current_user)
):
    """
    Refresh JWT token.

    Requires valid (but possibly near-expiry) JWT.
    """
    from app.core.security import create_access_token, UserRole

    token = create_access_token(user_id=user.user_id, email=user.email, role=user.role)
    set_session(response, token)
    return token


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("bossup_session", path="/")
    return {"message": "Signed out"}

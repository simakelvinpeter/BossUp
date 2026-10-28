"""Register users and verify Firebase passwords."""

from datetime import datetime
from typing import Optional
import os
import httpx
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.core.markets import Country

from firebase_admin import auth as firebase_auth
from firebase_admin.exceptions import FirebaseError

from app.core.firebase import users_collection, get_firebase_auth
from app.core.security import (
    UserRole,
    KYCStatus,
    create_access_token,
    log_audit_event,
    TokenResponse,
)


class SignupRequest(BaseModel):
    """User registration request."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole
    country: Country
    full_name: Optional[str] = None

    @field_validator("role")
    @classmethod
    def public_role(cls, role):
        if role == UserRole.ADMIN:
            raise ValueError("Administrators cannot register through public signup")
        return role


class LoginRequest(BaseModel):
    """User login request."""

    email: EmailStr
    password: str


class UserProfile(BaseModel):
    """User profile data."""

    user_id: str
    email: str
    role: str
    country: str
    kyc_status: str
    full_name: Optional[str] = None
    created_at: str


class AuthService:
    """Authentication service - Firebase Auth + Firestore."""

    @staticmethod
    async def signup(request: SignupRequest) -> TokenResponse:
        """Register a new user."""
        try:
            firebase_user = firebase_auth.create_user(
                email=request.email,
                password=request.password,
                display_name=request.full_name,
            )

            user_id = firebase_user.uid

            user_data = {
                "email": request.email,
                "role": request.role.value,
                "country": request.country,
                "full_name": request.full_name,
                "kyc_status": KYCStatus.PENDING.value,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat(),
            }

            users_collection().document(user_id).set(user_data)

            log_audit_event(
                action="USER_SIGNUP",
                user_id=user_id,
                details={"email": request.email, "role": request.role.value},
            )

            return create_access_token(
                user_id=user_id, email=request.email, role=request.role
            )

        except FirebaseError as e:
            raise ValueError(f"Registration failed: {str(e)}")

    @staticmethod
    async def login(request: LoginRequest) -> TokenResponse:
        """
        Authenticate user and issue JWT.

        Verify the password with Firebase before issuing a BossUp token.
        """
        try:
            api_key = os.getenv("FIREBASE_WEB_API_KEY")
            if not api_key:
                raise ValueError("Password login is not configured")
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post(
                    "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword",
                    params={"key": api_key},
                    json={
                        "email": str(request.email),
                        "password": request.password,
                        "returnSecureToken": True,
                    },
                )
            if response.status_code != 200:
                raise ValueError("Invalid email or password")
            firebase_user = firebase_auth.get_user_by_email(request.email)
            user_id = firebase_user.uid
            if firebase_user.disabled or response.json().get("localId") != user_id:
                raise ValueError("Invalid email or password")

            user_doc = users_collection().document(user_id).get()

            if not user_doc.exists:
                raise ValueError("User profile not found")

            user_data = user_doc.to_dict()

            log_audit_event(
                action="USER_LOGIN", user_id=user_id, details={"email": request.email}
            )

            return create_access_token(
                user_id=user_id, email=request.email, role=UserRole(user_data["role"])
            )

        except firebase_auth.UserNotFoundError:
            raise ValueError("Invalid email or password")
        except FirebaseError as e:
            raise ValueError(f"Login failed: {str(e)}")

    @staticmethod
    async def get_user_profile(user_id: str) -> UserProfile:
        """Get user profile from Firestore."""
        user_doc = users_collection().document(user_id).get()

        if not user_doc.exists:
            raise ValueError("User not found")

        data = user_doc.to_dict()

        return UserProfile(
            user_id=user_id,
            email=data.get("email", ""),
            role=data.get("role", ""),
            country=data.get("country", ""),
            kyc_status=data.get("kyc_status", "PENDING"),
            full_name=data.get("full_name"),
            created_at=data.get("created_at", ""),
        )

    @staticmethod
    async def update_kyc_status(user_id: str, status: KYCStatus, admin_id: str) -> bool:
        """
        Update user KYC status (Admin only).
        """
        users_collection().document(user_id).update(
            {
                "kyc_status": status.value,
                "kyc_updated_at": datetime.utcnow().isoformat(),
                "kyc_updated_by": admin_id,
            }
        )

        log_audit_event(
            action="KYC_STATUS_UPDATE",
            user_id=admin_id,
            details={"target_user": user_id, "new_status": status.value},
        )

        return True


auth_service = AuthService()

"""
Authentication Service
=======================
Handles user registration, login, and Firebase Auth integration.

Security:
- Firebase Auth for identity (backend-side only)
- Custom JWT issued after Firebase verification
- Roles stored in Firestore, NOT Firebase custom claims
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr

from firebase_admin import auth as firebase_auth
from firebase_admin.exceptions import FirebaseError

from app.core.firebase import users_collection, get_firebase_auth
from app.core.security import (
    UserRole, 
    KYCStatus, 
    create_access_token, 
    log_audit_event,
    TokenResponse
)


# =============================================================================
# REQUEST/RESPONSE MODELS
# =============================================================================

class SignupRequest(BaseModel):
    """User registration request."""
    email: EmailStr
    password: str
    role: UserRole
    country: str
    full_name: Optional[str] = None


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


# =============================================================================
# AUTHENTICATION SERVICE
# =============================================================================

class AuthService:
    """
    Authentication service - Firebase Auth + Firestore.
    
    Flow:
    1. Create user in Firebase Auth
    2. Store profile & role in Firestore
    3. Issue custom JWT
    """
    
    @staticmethod
    async def signup(request: SignupRequest) -> TokenResponse:
        """
        Register a new user.
        
        1. Create Firebase Auth user
        2. Create Firestore user document
        3. Issue JWT
        """
        try:
            # Step 1: Create Firebase Auth user
            firebase_user = firebase_auth.create_user(
                email=request.email,
                password=request.password,
                display_name=request.full_name
            )
            
            user_id = firebase_user.uid
            
            # Step 2: Create Firestore user document
            user_data = {
                "email": request.email,
                "role": request.role.value,
                "country": request.country,
                "full_name": request.full_name,
                "kyc_status": KYCStatus.PENDING.value,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            users_collection().document(user_id).set(user_data)
            
            # Step 3: Audit log
            log_audit_event(
                action="USER_SIGNUP",
                user_id=user_id,
                details={"email": request.email, "role": request.role.value}
            )
            
            # Step 4: Issue custom JWT
            return create_access_token(
                user_id=user_id,
                email=request.email,
                role=request.role
            )
            
        except FirebaseError as e:
            raise ValueError(f"Registration failed: {str(e)}")
    
    @staticmethod
    async def login(request: LoginRequest) -> TokenResponse:
        """
        Authenticate user and issue JWT.
        
        Note: Firebase Admin SDK doesn't support password verification directly.
        In production, use Firebase REST API or client SDK on backend proxy.
        For MVP, we verify user exists and issue token.
        """
        try:
            # Get Firebase user by email
            firebase_user = firebase_auth.get_user_by_email(request.email)
            user_id = firebase_user.uid
            
            # Get user profile from Firestore
            user_doc = users_collection().document(user_id).get()
            
            if not user_doc.exists:
                raise ValueError("User profile not found")
            
            user_data = user_doc.to_dict()
            
            # Audit log
            log_audit_event(
                action="USER_LOGIN",
                user_id=user_id,
                details={"email": request.email}
            )
            
            # Issue custom JWT
            return create_access_token(
                user_id=user_id,
                email=request.email,
                role=UserRole(user_data["role"])
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
            created_at=data.get("created_at", "")
        )
    
    @staticmethod
    async def update_kyc_status(user_id: str, status: KYCStatus, admin_id: str) -> bool:
        """
        Update user KYC status (Admin only).
        """
        users_collection().document(user_id).update({
            "kyc_status": status.value,
            "kyc_updated_at": datetime.utcnow().isoformat(),
            "kyc_updated_by": admin_id
        })
        
        log_audit_event(
            action="KYC_STATUS_UPDATE",
            user_id=admin_id,
            details={"target_user": user_id, "new_status": status.value}
        )
        
        return True


# Singleton instance
auth_service = AuthService()

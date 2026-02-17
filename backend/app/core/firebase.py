"""
Firebase Admin SDK Initialization
==================================
Backend-only Firebase access. NO frontend Firebase SDK usage.

Security:
- Service account credentials stored securely (env var or file)
- Firestore accessed only through this module
- All Firebase operations go through backend
"""

import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
from typing import Optional

# Global Firestore client
_db: Optional[firestore.Client] = None


def initialize_firebase() -> None:
    """
    Initialize Firebase Admin SDK.
    
    Uses service account credentials from:
    1. GOOGLE_APPLICATION_CREDENTIALS env var (path to JSON file)
    2. FIREBASE_CREDENTIALS env var (JSON string)
    3. Default: firebase-credentials.json in backend root
    """
    global _db
    
    if firebase_admin._apps:
        # Already initialized
        _db = firestore.client()
        return
    
    cred = None
    
    # Option 1: Path to credentials file via env var
    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)
    
    # Option 2: Default path
    elif os.path.exists("firebase-credentials.json"):
        cred = credentials.Certificate("firebase-credentials.json")
    
    # Option 3: JSON string in env var
    elif os.getenv("FIREBASE_CREDENTIALS"):
        import json
        cred_dict = json.loads(os.getenv("FIREBASE_CREDENTIALS"))
        cred = credentials.Certificate(cred_dict)
    
    else:
        raise RuntimeError(
            "Firebase credentials not found. Set GOOGLE_APPLICATION_CREDENTIALS "
            "or place firebase-credentials.json in backend root."
        )
    
    firebase_admin.initialize_app(cred)
    _db = firestore.client()


def get_firestore() -> firestore.Client:
    """Get Firestore client instance."""
    global _db
    if _db is None:
        initialize_firebase()
    return _db


def get_firebase_auth():
    """Get Firebase Auth module for user management."""
    return auth


# =============================================================================
# FIRESTORE COLLECTIONS (Type-safe access)
# =============================================================================

class Collections:
    """Firestore collection names - single source of truth."""
    USERS = "users"
    CAMPAIGNS = "campaigns"
    TRANSACTIONS = "transactions"
    AUDIT_LOGS = "audit_logs"


def get_collection(collection_name: str):
    """Get a Firestore collection reference."""
    db = get_firestore()
    return db.collection(collection_name)


def users_collection():
    """Get users collection."""
    return get_collection(Collections.USERS)


def campaigns_collection():
    """Get campaigns collection."""
    return get_collection(Collections.CAMPAIGNS)


def transactions_collection():
    """Get transactions collection."""
    return get_collection(Collections.TRANSACTIONS)


def audit_logs_collection():
    """Get audit logs collection."""
    return get_collection(Collections.AUDIT_LOGS)

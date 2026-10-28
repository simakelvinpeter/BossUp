"""Connect backend services to Firebase."""

import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
from typing import Optional

_db: Optional[firestore.Client] = None


def initialize_firebase() -> None:
    """Initialize Firebase Admin SDK."""
    global _db

    if firebase_admin._apps:
        _db = firestore.client()
        return

    cred = None

    cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if cred_path and os.path.exists(cred_path):
        cred = credentials.Certificate(cred_path)

    elif os.path.exists("firebase-credentials.json"):
        cred = credentials.Certificate("firebase-credentials.json")

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

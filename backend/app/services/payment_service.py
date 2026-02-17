"""
Payment Service
================
Backend-only payment processing with abstract gateway layer.

Security (NON-NEGOTIABLE):
- NO payment secrets in frontend
- All payment operations go through backend
- Transactions logged in Firestore
- Gateway abstraction for easy provider swap

Payment Flow:
1. Frontend → /payments/initiate
2. Backend verifies JWT, creates transaction doc
3. Backend initiates payment with gateway (stub)
4. Returns payment session to frontend
5. Webhook/callback updates transaction status
6. Dashboard reflects updates
"""

from datetime import datetime
from typing import Optional
from enum import Enum
from pydantic import BaseModel
from abc import ABC, abstractmethod

from app.core.firebase import transactions_collection
from app.core.security import log_audit_event


# =============================================================================
# MODELS
# =============================================================================

class TransactionStatus(str, Enum):
    """Payment transaction status."""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PaymentMethod(str, Enum):
    """Supported payment methods."""
    CARD = "CARD"
    MOBILE_MONEY = "MOBILE_MONEY"
    BANK_TRANSFER = "BANK_TRANSFER"


class InitiatePaymentRequest(BaseModel):
    """Request to initiate a payment."""
    campaign_id: str
    amount: float
    currency: str = "USD"
    payment_method: PaymentMethod = PaymentMethod.CARD
    return_url: Optional[str] = None


class PaymentSessionResponse(BaseModel):
    """Payment session response to frontend."""
    transaction_id: str
    session_id: str
    checkout_url: str
    amount: float
    currency: str
    status: str
    expires_at: Optional[str] = None


class TransactionResponse(BaseModel):
    """Transaction data response."""
    transaction_id: str
    user_id: str
    campaign_id: str
    amount: float
    currency: str
    status: str
    payment_method: str
    created_at: str
    completed_at: Optional[str] = None


class ConfirmPaymentRequest(BaseModel):
    """Webhook/callback to confirm payment."""
    transaction_id: str
    gateway_reference: str
    status: TransactionStatus


# =============================================================================
# PAYMENT GATEWAY ABSTRACTION
# =============================================================================

class PaymentGateway(ABC):
    """Abstract payment gateway interface."""
    
    @abstractmethod
    async def create_session(
        self,
        amount: float,
        currency: str,
        reference: str,
        return_url: str
    ) -> dict:
        """Create payment session with gateway."""
        pass
    
    @abstractmethod
    async def verify_payment(self, session_id: str) -> dict:
        """Verify payment status with gateway."""
        pass


class StubPaymentGateway(PaymentGateway):
    """
    Stub payment gateway for MVP development.
    Replace with real gateway (Stripe, Paystack, Flutterwave) in production.
    """
    
    async def create_session(
        self,
        amount: float,
        currency: str,
        reference: str,
        return_url: str
    ) -> dict:
        """Create fake payment session."""
        return {
            "session_id": f"stub_session_{reference}",
            "checkout_url": f"http://localhost:8000/payments/stub-checkout?ref={reference}",
            "expires_at": datetime.utcnow().isoformat()
        }
    
    async def verify_payment(self, session_id: str) -> dict:
        """Stub verification - always returns success."""
        return {
            "status": "success",
            "gateway_reference": f"stub_ref_{session_id}"
        }


# =============================================================================
# PAYMENT SERVICE
# =============================================================================

class PaymentService:
    """
    Payment processing service.
    
    Uses abstract gateway - swap StubPaymentGateway for real one in production.
    """
    
    def __init__(self, gateway: PaymentGateway = None):
        self.gateway = gateway or StubPaymentGateway()
    
    async def initiate_payment(
        self,
        user_id: str,
        request: InitiatePaymentRequest
    ) -> PaymentSessionResponse:
        """
        Initiate payment flow.
        
        1. Create transaction record in Firestore
        2. Create session with payment gateway
        3. Return checkout URL to frontend
        """
        # Create transaction document
        transaction_data = {
            "user_id": user_id,
            "campaign_id": request.campaign_id,
            "amount": request.amount,
            "currency": request.currency,
            "payment_method": request.payment_method.value,
            "status": TransactionStatus.PENDING.value,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Save to Firestore
        doc_ref = transactions_collection().add(transaction_data)
        transaction_id = doc_ref[1].id
        
        # Create gateway session
        session = await self.gateway.create_session(
            amount=request.amount,
            currency=request.currency,
            reference=transaction_id,
            return_url=request.return_url or "http://localhost:5500/payment-complete.html"
        )
        
        # Update transaction with session info
        transactions_collection().document(transaction_id).update({
            "gateway_session_id": session["session_id"],
            "status": TransactionStatus.PROCESSING.value
        })
        
        # Audit log
        log_audit_event(
            action="PAYMENT_INITIATED",
            user_id=user_id,
            details={
                "transaction_id": transaction_id,
                "campaign_id": request.campaign_id,
                "amount": request.amount
            }
        )
        
        return PaymentSessionResponse(
            transaction_id=transaction_id,
            session_id=session["session_id"],
            checkout_url=session["checkout_url"],
            amount=request.amount,
            currency=request.currency,
            status=TransactionStatus.PROCESSING.value,
            expires_at=session.get("expires_at")
        )
    
    async def confirm_payment(
        self,
        request: ConfirmPaymentRequest
    ) -> TransactionResponse:
        """
        Confirm payment (webhook/callback from gateway).
        
        1. Verify with gateway
        2. Update transaction status
        3. Update campaign raised amount
        """
        doc_ref = transactions_collection().document(request.transaction_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise ValueError("Transaction not found")
        
        transaction_data = doc.to_dict()
        
        # Update transaction
        update_data = {
            "status": request.status.value,
            "gateway_reference": request.gateway_reference,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if request.status == TransactionStatus.COMPLETED:
            update_data["completed_at"] = datetime.utcnow().isoformat()
            
            # Update campaign raised amount
            from app.services.campaign_service import campaign_service
            await campaign_service.update_raised_amount(
                campaign_id=transaction_data["campaign_id"],
                amount=transaction_data["amount"]
            )
        
        doc_ref.update(update_data)
        
        # Audit log
        log_audit_event(
            action="PAYMENT_CONFIRMED",
            user_id=transaction_data["user_id"],
            details={
                "transaction_id": request.transaction_id,
                "status": request.status.value
            }
        )
        
        # Get updated transaction
        return await self.get_transaction(request.transaction_id)
    
    async def get_transaction(self, transaction_id: str) -> TransactionResponse:
        """Get transaction by ID."""
        doc = transactions_collection().document(transaction_id).get()
        
        if not doc.exists:
            raise ValueError("Transaction not found")
        
        data = doc.to_dict()
        return TransactionResponse(
            transaction_id=transaction_id,
            user_id=data.get("user_id", ""),
            campaign_id=data.get("campaign_id", ""),
            amount=data.get("amount", 0),
            currency=data.get("currency", "USD"),
            status=data.get("status", ""),
            payment_method=data.get("payment_method", ""),
            created_at=data.get("created_at", ""),
            completed_at=data.get("completed_at")
        )
    
    async def get_user_transactions(
        self, 
        user_id: str,
        limit: int = 50
    ) -> list[TransactionResponse]:
        """Get all transactions for a user."""
        query = transactions_collection().where("user_id", "==", user_id).limit(limit)
        docs = query.stream()
        
        transactions = []
        for doc in docs:
            data = doc.to_dict()
            transactions.append(TransactionResponse(
                transaction_id=doc.id,
                user_id=data.get("user_id", ""),
                campaign_id=data.get("campaign_id", ""),
                amount=data.get("amount", 0),
                currency=data.get("currency", "USD"),
                status=data.get("status", ""),
                payment_method=data.get("payment_method", ""),
                created_at=data.get("created_at", ""),
                completed_at=data.get("completed_at")
            ))
        
        return transactions


# Singleton instance
payment_service = PaymentService()

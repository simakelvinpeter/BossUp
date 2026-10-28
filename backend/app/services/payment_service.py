"""Donations are credited only after provider verification and an atomic write."""

from datetime import datetime, timezone
from decimal import Decimal
from typing import Optional
from enum import Enum

from pydantic import BaseModel, Field, field_validator
from firebase_admin import firestore

from app.core.firebase import (
    transactions_collection,
    campaigns_collection,
    users_collection,
    get_firestore,
)
from app.services.flutterwave import (
    FlutterwaveGateway,
    PAYMENT_OPTIONS,
    validate_receipt,
)


def now():
    return datetime.now(timezone.utc).isoformat()


class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class PaymentMethod(str, Enum):
    CARD = "CARD"
    MOBILE_MONEY = "MOBILE_MONEY"
    BANK_TRANSFER = "BANK_TRANSFER"


class InitiatePaymentRequest(BaseModel):
    campaign_id: str = Field(min_length=1, max_length=128, pattern=r"^[A-Za-z0-9_-]+$")
    amount: Decimal = Field(gt=0, le=100000000, max_digits=12, decimal_places=2)
    currency: str = "TZS"
    payment_method: PaymentMethod = PaymentMethod.CARD
    return_url: Optional[str] = (
        None  # Legacy input; the server uses its configured URL.
    )

    @field_validator("currency")
    @classmethod
    def supported_currency(cls, value):
        if value not in PAYMENT_OPTIONS:
            raise ValueError("Choose KES, UGX, TZS or RWF")
        return value


class PaymentSessionResponse(BaseModel):
    transaction_id: str
    session_id: str
    checkout_url: str
    amount: float
    currency: str
    status: str
    expires_at: Optional[str] = None


class TransactionResponse(BaseModel):
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
    transaction_id: str = Field(
        min_length=1, max_length=128, pattern=r"^[A-Za-z0-9_-]+$"
    )
    gateway_reference: str = Field(pattern=r"^[0-9]{1,30}$")


class PaymentService:
    def __init__(self, gateway=None):
        self.gateway = gateway or FlutterwaveGateway()

    async def initiate_payment(self, user_id, request):
        campaign = campaigns_collection().document(request.campaign_id).get()
        if not campaign.exists or campaign.to_dict().get("status") != "LIVE":
            raise ValueError("This campaign is not accepting donations")
        if campaign.to_dict().get("currency", "KES") != request.currency:
            raise ValueError("Donation currency must match the campaign")
        owner_id = campaign.to_dict().get("owner_id")
        owner = users_collection().document(owner_id).get() if owner_id else None
        if (
            not owner
            or not owner.exists
            or owner.to_dict().get("kyc_status") != "VERIFIED"
        ):
            raise ValueError(
                "The campaign owner must be verified before donations open"
            )
        profile = users_collection().document(user_id).get().to_dict() or {}
        if not profile.get("email"):
            raise ValueError("Donor email is missing")

        document = transactions_collection().document()
        data = {
            "user_id": user_id,
            "campaign_id": request.campaign_id,
            "amount": float(request.amount),
            "currency": request.currency,
            "payment_method": request.payment_method.value,
            "status": "PENDING",
            "created_at": now(),
        }
        document.set(data)
        try:
            session = await self.gateway.create_session(
                request.amount,
                request.currency,
                document.id,
                profile["email"],
            )
        except Exception:
            document.update({"status": "FAILED", "updated_at": now()})
            raise
        document.update(
            {"gateway_session_id": session["session_id"], "status": "PROCESSING"}
        )
        return PaymentSessionResponse(
            transaction_id=document.id,
            amount=float(request.amount),
            currency=request.currency,
            status="PROCESSING",
            **session,
        )

    async def confirm_payment(self, request):
        document = transactions_collection().document(request.transaction_id)
        snapshot = document.get()
        if not snapshot.exists:
            raise ValueError("Transaction not found")
        receipt = await self.gateway.verify_payment(request.gateway_reference)
        validate_receipt(receipt, snapshot.to_dict(), document.id)
        if str(receipt.get("id")) != request.gateway_reference:
            raise ValueError("Provider transaction ID does not match")

        campaign = campaigns_collection().document(snapshot.to_dict()["campaign_id"])
        receipt_ref = (
            get_firestore()
            .collection("payment_receipts")
            .document(request.gateway_reference)
        )

        @firestore.transactional
        def credit_once(transaction):
            donation = document.get(transaction=transaction).to_dict()
            prior_receipt = receipt_ref.get(transaction=transaction)
            campaign_snapshot = campaign.get(transaction=transaction)
            validate_receipt(receipt, donation, document.id)
            if donation["status"] == "COMPLETED":
                if donation.get("gateway_reference") != request.gateway_reference:
                    raise ValueError("Donation already has a different receipt")
                return
            if prior_receipt.exists:
                raise ValueError("This receipt was already used")
            if not campaign_snapshot.exists:
                raise ValueError("Campaign not found")
            campaign_data = campaign_snapshot.to_dict()
            if campaign_data.get("currency", "KES") != donation["currency"]:
                raise ValueError("Campaign currency changed")
            raised = Decimal(str(campaign_data.get("raised_amount", 0)))
            raised += Decimal(str(donation["amount"]))
            transaction.update(
                campaign, {"raised_amount": float(raised), "updated_at": now()}
            )
            transaction.update(
                document,
                {
                    "status": "COMPLETED",
                    "gateway_reference": request.gateway_reference,
                    "completed_at": now(),
                    "updated_at": now(),
                },
            )
            transaction.set(
                receipt_ref, {"transaction_id": document.id, "created_at": now()}
            )

        credit_once(get_firestore().transaction())
        return await self.get_transaction(document.id)

    async def get_transaction(self, transaction_id):
        document = transactions_collection().document(transaction_id).get()
        if not document.exists:
            raise ValueError("Transaction not found")
        return self.response(document.id, document.to_dict())

    @staticmethod
    def response(transaction_id, data):
        return TransactionResponse(
            transaction_id=transaction_id,
            **{
                key: data.get(key)
                for key in TransactionResponse.model_fields
                if key != "transaction_id"
            },
        )

    async def get_user_transactions(self, user_id, limit=50):
        documents = (
            transactions_collection()
            .where("user_id", "==", user_id)
            .limit(limit)
            .stream()
        )
        return [
            self.response(document.id, document.to_dict()) for document in documents
        ]


payment_service = PaymentService()

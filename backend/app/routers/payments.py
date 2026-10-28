"""Authenticated donation checkout and verified Flutterwave v3 notifications."""

import hmac
import os
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import ValidationError
from app.core.security import get_current_user, require_investor, CurrentUser, UserRole
from app.services.payment_service import (
    payment_service,
    InitiatePaymentRequest,
    ConfirmPaymentRequest,
    PaymentSessionResponse,
    TransactionResponse,
)

router = APIRouter()


@router.post("/initiate", response_model=PaymentSessionResponse)
async def initiate_payment(
    request: InitiatePaymentRequest, user: CurrentUser = Depends(require_investor)
):
    try:
        return await payment_service.initiate_payment(user.user_id, request)
    except ValueError as error:
        raise HTTPException(400, str(error)) from None
    except Exception:
        raise HTTPException(
            502, "Checkout is unavailable. Please try again later."
        ) from None


@router.post("/confirm", response_model=TransactionResponse)
async def confirm_payment(
    request: ConfirmPaymentRequest, user: CurrentUser = Depends(get_current_user)
):
    try:
        donation = await payment_service.get_transaction(request.transaction_id)
        if donation.user_id != user.user_id:
            raise HTTPException(403, "Access denied")
        return await payment_service.confirm_payment(request)
    except ValueError as error:
        raise HTTPException(400, str(error)) from None
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            502, "Payment verification is temporarily unavailable"
        ) from None


@router.post("/webhook")
async def payment_webhook(request: Request):
    secret = os.getenv("FLW_SECRET_HASH", "")
    signature = request.headers.get("verif-hash", "")
    if not secret or not hmac.compare_digest(secret.encode(), signature.encode()):
        raise HTTPException(401, "Invalid webhook signature")
    body = await request.body()
    if len(body) > 65536:
        raise HTTPException(413, "Webhook is too large")
    try:
        payload = await request.json()
        data = payload.get("data", {})
        if (
            payload.get("event") != "charge.completed"
            or data.get("status") != "successful"
        ):
            return {"received": True}
        confirmation = ConfirmPaymentRequest(
            transaction_id=data.get("tx_ref"),
            gateway_reference=str(data.get("id")),
        )
        await payment_service.confirm_payment(confirmation)
    except (ValueError, ValidationError):
        raise HTTPException(400, "Payment receipt could not be verified") from None
    except Exception:
        # Do not acknowledge a failed write; Flutterwave can retry safely.
        raise HTTPException(503, "Please retry this notification") from None
    return {"received": True}


@router.get("/my", response_model=list[TransactionResponse])
async def get_my_transactions(user: CurrentUser = Depends(get_current_user)):
    return await payment_service.get_user_transactions(user.user_id)


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str, user: CurrentUser = Depends(get_current_user)
):
    try:
        donation = await payment_service.get_transaction(transaction_id)
    except ValueError:
        raise HTTPException(404, "Transaction not found") from None
    if donation.user_id != user.user_id and user.role != UserRole.ADMIN:
        raise HTTPException(403, "Access denied")
    return donation

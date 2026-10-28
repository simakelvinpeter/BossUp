from copy import deepcopy
from types import SimpleNamespace
from unittest.mock import AsyncMock
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.services import payment_service as module
from app.routers import payments


class Document:
    def __init__(self, key, data=None):
        self.id = key
        self.data = data

    def get(self, **kwargs):
        return SimpleNamespace(
            id=self.id,
            exists=self.data is not None,
            to_dict=lambda: deepcopy(self.data),
        )


@pytest.mark.asyncio
async def test_repeated_verified_receipt_credits_campaign_once(monkeypatch):
    donation = Document(
        "donation1",
        {
            "user_id": "user1",
            "campaign_id": "campaign1",
            "amount": 500,
            "currency": "KES",
            "status": "PROCESSING",
            "payment_method": "CARD",
            "created_at": "2026-10-28",
        },
    )
    campaign = Document("campaign1", {"raised_amount": 100, "currency": "KES"})
    receipt = Document("123")

    class Transaction:
        def update(self, document, changes):
            document.data.update(changes)

        def set(self, document, changes):
            document.data = changes

    monkeypatch.setattr(
        module,
        "transactions_collection",
        lambda: SimpleNamespace(document=lambda key: donation),
    )
    monkeypatch.setattr(
        module,
        "campaigns_collection",
        lambda: SimpleNamespace(document=lambda key: campaign),
    )
    database = SimpleNamespace(
        transaction=Transaction,
        collection=lambda name: SimpleNamespace(document=lambda key: receipt),
    )
    monkeypatch.setattr(module, "get_firestore", lambda: database)
    monkeypatch.setattr(module.firestore, "transactional", lambda function: function)
    gateway = SimpleNamespace(
        verify_payment=AsyncMock(
            return_value={
                "id": 123,
                "status": "successful",
                "tx_ref": "donation1",
                "amount": 500,
                "currency": "KES",
            }
        )
    )
    service = module.PaymentService(gateway)
    request = module.ConfirmPaymentRequest(
        transaction_id="donation1", gateway_reference="123"
    )
    await service.confirm_payment(request)
    await service.confirm_payment(request)
    assert campaign.data["raised_amount"] == 600
    assert donation.data["status"] == "COMPLETED"
    assert receipt.data["transaction_id"] == "donation1"


def test_payment_confirmation_requires_login_and_webhook_requires_secret(monkeypatch):
    app = FastAPI()
    app.include_router(payments.router, prefix="/payments")
    monkeypatch.delenv("FLW_SECRET_HASH", raising=False)
    client = TestClient(app)
    assert client.post(
        "/payments/confirm",
        json={"transaction_id": "donation1", "gateway_reference": "123"},
    ).status_code in (401, 403)
    assert (
        client.post("/payments/webhook", json={"event": "charge.completed"}).status_code
        == 401
    )
    monkeypatch.setenv("FLW_SECRET_HASH", "only-test-secret")
    assert (
        client.post(
            "/payments/webhook", headers={"verif-hash": "wrong"}, json={}
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/payments/webhook",
            headers={"verif-hash": "only-test-secret"},
            json={"event": "unrelated"},
        ).status_code
        == 200
    )

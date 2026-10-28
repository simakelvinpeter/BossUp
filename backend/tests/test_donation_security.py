import pytest
from pydantic import ValidationError
from app.services.flutterwave import validate_receipt, FlutterwaveGateway
from app.services.auth_service import SignupRequest
from app.services.payment_service import InitiatePaymentRequest


def test_receipt_requires_matching_paid_amount_currency_and_reference():
    expected = {"amount": 500, "currency": "KES"}
    good = {
        "status": "successful",
        "amount": 500,
        "currency": "KES",
        "tx_ref": "donation1",
    }
    validate_receipt(good, expected, "donation1")
    for changed in (
        {"status": "pending"},
        {"amount": 1},
        {"amount": "NaN"},
        {"currency": "UGX"},
        {"tx_ref": "another"},
    ):
        with pytest.raises(ValueError):
            validate_receipt({**good, **changed}, expected, "donation1")


@pytest.mark.parametrize("amount", [0, -10, "NaN", "Infinity", "1.001"])
def test_invalid_donations_are_rejected(amount):
    with pytest.raises(ValidationError):
        InitiatePaymentRequest(campaign_id="campaign1", amount=amount)


def test_public_signup_cannot_create_admin():
    with pytest.raises(ValidationError):
        SignupRequest(
            email="person@example.com",
            password="example-password",
            role="ADMIN",
            country="KE",
        )


@pytest.mark.asyncio
async def test_unconfigured_gateway_cannot_simulate_a_success(monkeypatch):
    monkeypatch.delenv("FLW_SECRET_KEY", raising=False)
    with pytest.raises(ValueError):
        await FlutterwaveGateway().verify_payment("123")

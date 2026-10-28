from unittest.mock import MagicMock
import pytest
from pydantic import ValidationError
from app.services.auth_service import SignupRequest
from app.services.campaign_service import CreateCampaignRequest
from app.services.payment_service import InitiatePaymentRequest, PaymentService
from app.services import payment_service


def test_burundi_signup_and_campaign_default_to_bif():
    account = SignupRequest(
        email="owner@example.com",
        password="safe-password",
        role="BUSINESS_OWNER",
        country="BI",
    )
    assert account.country == "BI"
    campaign = CreateCampaignRequest(
        title="Bujumbura bakery",
        description="Fresh bread for the community and training for young bakers in Burundi.",
        country="BI",
        target_amount=500000,
    )
    assert campaign.currency == "BIF"


@pytest.mark.parametrize("amount", [0.1, 100.5])
def test_bif_requires_whole_francs(amount):
    with pytest.raises(ValidationError):
        InitiatePaymentRequest(campaign_id="burundi1", amount=amount, currency="BIF")
    with pytest.raises(ValidationError):
        CreateCampaignRequest(
            title="Bujumbura bakery",
            description="Fresh bread for the community and training for young bakers in Burundi.",
            country="BI",
            target_amount=amount,
        )


@pytest.mark.asyncio
async def test_bif_does_not_use_unavailable_flutterwave_checkout(monkeypatch):
    database = MagicMock()
    monkeypatch.setattr(payment_service, "transactions_collection", database)
    request = InitiatePaymentRequest(campaign_id="burundi1", amount=5000)
    with pytest.raises(ValueError, match="Burundi payment provider"):
        await PaymentService().initiate_payment("user1", request)
    database.assert_not_called()

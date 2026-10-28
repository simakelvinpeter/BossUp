"""Hosted checkout. Card and mobile-money details stay with Flutterwave."""

import os
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse

import httpx


PAYMENT_OPTIONS = {
    "KES": "card,mpesa",
    "UGX": "card,mobilemoneyuganda",
    "TZS": "card,mobilemoneytanzania",
    "RWF": "card,mobilemoneyrwanda",
}


def validate_receipt(receipt, expected, reference):
    """Never trust the browser's success message or an unverified webhook."""
    try:
        amount = Decimal(str(receipt.get("amount")))
        expected_amount = Decimal(str(expected["amount"]))
    except (InvalidOperation, TypeError):
        raise ValueError("Invalid payment amount") from None
    if (
        receipt.get("status") != "successful"
        or receipt.get("tx_ref") != reference
        or receipt.get("currency") != expected["currency"]
        or not amount.is_finite()
        or amount != expected_amount
    ):
        raise ValueError("Payment does not match this donation")


class FlutterwaveGateway:
    def __init__(self, client=None):
        self.client = client

    @staticmethod
    def ensure_currency_supported(currency):
        if currency not in PAYMENT_OPTIONS:
            raise ValueError(
                "BIF checkout is not available yet. A Burundi payment provider "
                "must be connected before donations can be collected."
            )

    async def request(self, method, path, **kwargs):
        key = os.getenv("FLW_SECRET_KEY", "")
        if not key or os.getenv("PAYMENTS_ENABLED", "false").lower() != "true":
            raise ValueError("Donations are not enabled yet")
        headers = {"Authorization": f"Bearer {key}"}
        async with httpx.AsyncClient(timeout=20) as default_client:
            response = await (self.client or default_client).request(
                method,
                f"https://api.flutterwave.com/v3/{path}",
                headers=headers,
                **kwargs,
            )
        response.raise_for_status()
        payload = response.json()
        if payload.get("status") != "success":
            raise ValueError("Payment provider could not process this request")
        return payload["data"]

    async def create_session(self, amount, currency, reference, email):
        self.ensure_currency_supported(currency)
        redirect = os.getenv("PAYMENT_RETURN_URL", "")
        if urlparse(redirect).scheme != "https":
            raise ValueError("Configure an HTTPS PAYMENT_RETURN_URL")
        data = await self.request(
            "POST",
            "payments",
            json={
                "tx_ref": reference,
                "amount": str(amount),
                "currency": currency,
                "redirect_url": redirect,
                "customer": {"email": email},
                "payment_options": PAYMENT_OPTIONS[currency],
                "customizations": {"title": "BossUp campaign donation"},
            },
        )
        link = data.get("link", "")
        if (
            urlparse(link).scheme != "https"
            or urlparse(link).hostname != "checkout.flutterwave.com"
        ):
            raise ValueError("Invalid checkout link from payment provider")
        return {"session_id": reference, "checkout_url": link}

    async def verify_payment(self, provider_id):
        if not str(provider_id).isdigit():
            raise ValueError("Invalid provider transaction ID")
        return await self.request("GET", f"transactions/{provider_id}/verify")

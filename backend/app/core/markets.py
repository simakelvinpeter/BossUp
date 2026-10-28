"""Campaign markets are separate from payment-provider coverage."""

from decimal import Decimal
from typing import Literal

Country = Literal["BI", "TZ", "KE", "UG", "RW"]
Currency = Literal["BIF", "TZS", "KES", "UGX", "RWF"]


def validate_amount(amount, currency):
    if currency == "BIF" and Decimal(str(amount)) % 1:
        raise ValueError("BIF amounts must be whole Burundian francs")

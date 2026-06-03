"""
Razorpay service — stubbed until Week 4.
Real implementation lives below; uncomment when razorpay pkg is compatible.
"""
import hmac
import hashlib
from app.config import settings
from app.database import get_supabase


async def create_order(match_id: str, amount_paise: int) -> dict:
    raise NotImplementedError("Razorpay not wired yet — Week 4")


def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    raise NotImplementedError("Razorpay not wired yet — Week 4")


async def release_payout(match_id: str, traveller_account_id: str) -> dict:
    raise NotImplementedError("Razorpay not wired yet — Week 4")

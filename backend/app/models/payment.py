from pydantic import BaseModel
from enum import Enum
from typing import Optional
from datetime import datetime


class PaymentStatus(str, Enum):
    created = "created"
    captured = "captured"
    in_escrow = "in_escrow"
    released = "released"
    refunded = "refunded"
    failed = "failed"


class Payment(BaseModel):
    id: str
    match_id: str
    razorpay_order_id: str
    amount: int           # in paise
    platform_fee: int     # in paise
    status: PaymentStatus
    payout_id: Optional[str] = None
    created_at: datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.services.razorpay import create_order, verify_payment_signature

router = APIRouter()


class CreateOrderRequest(BaseModel):
    match_id: str
    amount: int  # in paise


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    match_id: str


@router.post("/create-order")
async def create_payment_order(body: CreateOrderRequest, user=Depends(get_current_user)):
    order = await create_order(body.match_id, body.amount)
    return order


@router.post("/verify")
async def verify_payment(body: VerifyPaymentRequest, user=Depends(get_current_user)):
    is_valid = verify_payment_signature(
        body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature
    )
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid payment signature")
    # TODO: update payment status to in_escrow in DB
    return {"verified": True, "match_id": body.match_id}

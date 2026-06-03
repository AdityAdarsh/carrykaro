from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.services.kyc import initiate_kyc_verification, check_kyc_status

router = APIRouter()


@router.post("/initiate")
async def initiate_kyc(user=Depends(get_current_user)):
    """Initiates KYC with third-party provider (IDfy/Signzy/HyperVerge)."""
    result = await initiate_kyc_verification(user.id, user.phone)
    return result


@router.get("/status")
async def kyc_status(user=Depends(get_current_user)):
    result = await check_kyc_status(user.id)
    return result

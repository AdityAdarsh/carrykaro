"""
KYC service — wraps IDfy / Signzy / HyperVerge REST API.
Swap the provider by changing KYC_PROVIDER in .env.
"""
import httpx
from app.config import settings
from app.database import get_supabase


async def initiate_kyc_verification(user_id: str, phone: str) -> dict:
    """
    Calls KYC provider to start Aadhaar OTP verification.
    Returns a verification session reference to pass to the frontend.
    """
    # Placeholder: replace with actual provider SDK/API call
    # IDfy example: POST https://eve.idfy.com/v3/tasks/sync/verify_with_source/ind_aadhaar
    provider_ref = f"kyc_session_{user_id}"  # TODO: real API call

    db = get_supabase()
    db.table("users").update({
        "kyc_status": "pending",
        "kyc_provider_ref": provider_ref,
    }).eq("id", user_id).execute()

    return {"status": "pending", "provider_ref": provider_ref}


async def check_kyc_status(user_id: str) -> dict:
    db = get_supabase()
    result = db.table("users").select("kyc_status, kyc_provider_ref").eq("id", user_id).single().execute()
    return result.data

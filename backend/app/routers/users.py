from fastapi import APIRouter, Depends, HTTPException
from postgrest.exceptions import APIError
from app.dependencies import get_current_user
from app.database import get_supabase
from app.models.user import UserProfileCreate, UserProfileUpdate

router = APIRouter()


@router.post("/profile")
async def create_profile(body: UserProfileCreate, user=Depends(get_current_user)):
    db = get_supabase()

    data = {
        "id": user.id,
        "email": user.email,
        "name": body.name,
        "city": body.city,
        "role": body.role,
        "kyc_status": "not_started",
    }
    try:
        result = db.table("users").upsert(data).execute()
    except APIError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e.message}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {type(e).__name__}: {e}")
    if not result.data:
        raise HTTPException(status_code=500, detail="Profile upsert returned no data")
    return result.data[0]


@router.get("/profile")
async def get_profile(user=Depends(get_current_user)):
    db = get_supabase()
    try:
        result = db.table("users").select("*").eq("id", user.id).single().execute()
    except Exception:
        raise HTTPException(status_code=404, detail="Profile not found")
    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return result.data


@router.patch("/profile")
async def update_profile(body: UserProfileUpdate, user=Depends(get_current_user)):
    db = get_supabase()
    updates = body.model_dump(exclude_none=True)
    result = db.table("users").update(updates).eq("id", user.id).execute()
    return result.data[0]

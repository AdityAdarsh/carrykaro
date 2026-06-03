from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.database import get_supabase
from app.models.match import MatchCreate

router = APIRouter()


@router.post("")
async def initiate_match(body: MatchCreate, user=Depends(get_current_user)):
    db = get_supabase()
    data = {
        "request_id": body.request_id,
        "trip_id": body.trip_id,
        "initiated_by": user.id,
        "status": "requested",
    }
    result = db.table("matches").insert(data).execute()
    return result.data[0]


@router.post("/{match_id}/accept")
async def accept_match(match_id: str, user=Depends(get_current_user)):
    db = get_supabase()
    result = db.table("matches").update({"status": "accepted"}).eq("id", match_id).execute()
    return result.data[0]


@router.post("/{match_id}/decline")
async def decline_match(match_id: str, user=Depends(get_current_user)):
    db = get_supabase()
    result = db.table("matches").update({"status": "declined"}).eq("id", match_id).execute()
    return result.data[0]


@router.post("/{match_id}/confirm-delivery")
async def confirm_delivery(match_id: str, user=Depends(get_current_user)):
    """Both parties call this. When both confirmed, status → completed and payout triggers."""
    db = get_supabase()
    # Store confirmation per user; payment service handles release logic
    result = db.table("matches").select("*").eq("id", match_id).single().execute()
    match = result.data
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    # TODO: track sender/traveller confirmation separately, trigger payout when both confirmed
    return {"match_id": match_id, "confirmed_by": user.id}


@router.get("/my")
async def my_matches(user=Depends(get_current_user)):
    db = get_supabase()
    result = (
        db.table("matches")
        .select("*, requests(*), trips(*)")
        .or_(f"requests.user_id.eq.{user.id},trips.user_id.eq.{user.id}")
        .execute()
    )
    return result.data

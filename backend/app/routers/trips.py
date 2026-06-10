from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from app.dependencies import get_current_user
from app.database import get_supabase
from app.models.trip import TripCreate

router = APIRouter()


@router.post("")
async def create_trip(body: TripCreate, user=Depends(get_current_user)):
    db = get_supabase()
    data = {**body.model_dump(), "user_id": user.id, "status": "open"}
    data["travel_date"] = str(data["travel_date"])
    result = db.table("trips").insert(data).execute()
    return result.data[0]


@router.get("")
async def list_trips(
    from_city: Optional[str] = Query(None),
    to_city: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    db = get_supabase()
    q = db.table("trips").select("*, users(name, city)").eq("status", "open")
    if from_city:
        q = q.eq("from_city", from_city)
    if to_city:
        q = q.eq("to_city", to_city)
    result = q.order("travel_date").execute()
    return result.data


@router.get("/{trip_id}")
async def get_trip(trip_id: str, user=Depends(get_current_user)):
    db = get_supabase()
    result = db.table("trips").select("*, users(name, city)").eq("id", trip_id).single().execute()
    return result.data


@router.delete("/{trip_id}")
async def cancel_trip(trip_id: str, user=Depends(get_current_user)):
    db = get_supabase()
    accepted = db.table("matches").select("id").eq("trip_id", trip_id).eq("status", "accepted").execute()
    if accepted.data:
        raise HTTPException(status_code=409, detail="You have an active match on this trip. Close the match before deleting.")
    db.table("trips").update({"status": "cancelled"}).eq("id", trip_id).eq("user_id", user.id).execute()
    return {"ok": True}

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
    my_req = db.table("requests").select("id").eq("user_id", user.id).execute()
    my_trip = db.table("trips").select("id").eq("user_id", user.id).execute()
    req_ids = [r["id"] for r in (my_req.data or [])]
    trip_ids = [t["id"] for t in (my_trip.data or [])]

    or_parts = [f"initiated_by.eq.{user.id}"]
    if req_ids:
        or_parts.append(f"request_id.in.({','.join(req_ids)})")
    if trip_ids:
        or_parts.append(f"trip_id.in.({','.join(trip_ids)})")

    result = (
        db.table("matches")
        .select("*, requests(id, from_city, to_city, user_id, users(name)), trips(id, from_city, to_city, travel_date, user_id, users(name))")
        .or_(",".join(or_parts))
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


@router.get("/{match_id}")
async def get_match(match_id: str, user=Depends(get_current_user)):
    db = get_supabase()
    result = (
        db.table("matches")
        .select("*, requests(id, from_city, to_city, item_type, weight_kg, needed_by_date, price_range_max, user_id, users(name, city)), trips(id, from_city, to_city, travel_date, travel_mode, capacity_kg, earning_range_min, user_id, users(name, city))")
        .eq("id", match_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Match not found")
    return result.data

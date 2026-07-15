from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.database import get_supabase
from app.models.match import MatchCreate

router = APIRouter()


def _get_match_and_check_party(db, match_id: str, user_id: str):
    """Fetch match and return it. Raises 404 if not found, 403 if user is not a party."""
    result = db.table("matches").select("*, requests(user_id), trips(user_id)").eq("id", match_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Match not found")
    match = result.data
    request_owner = (match.get("requests") or {}).get("user_id")
    trip_owner = (match.get("trips") or {}).get("user_id")
    if user_id not in [match.get("initiated_by"), request_owner, trip_owner]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return match, request_owner, trip_owner


@router.post("")
async def initiate_match(body: MatchCreate, user=Depends(get_current_user)):
    db = get_supabase()
    if body.request_id:
        req = db.table("requests").select("id").eq("id", body.request_id).eq("status", "open").execute()
        if not req.data:
            raise HTTPException(status_code=400, detail="Request not found or not available")
    if body.trip_id:
        trip = db.table("trips").select("id").eq("id", body.trip_id).eq("status", "open").execute()
        if not trip.data:
            raise HTTPException(status_code=400, detail="Trip not found or not available")
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
    match, request_owner, trip_owner = _get_match_and_check_party(db, match_id, user.id)
    if user.id == match.get("initiated_by"):
        raise HTTPException(status_code=403, detail="You cannot accept a match you initiated")
    result = db.table("matches").update({"status": "accepted"}).eq("id", match_id).execute()
    match = result.data[0]
    if match.get("request_id"):
        db.table("requests").update({"status": "matched"}).eq("id", match["request_id"]).eq("status", "open").execute()
    if match.get("trip_id"):
        db.table("trips").update({"status": "matched"}).eq("id", match["trip_id"]).eq("status", "open").execute()
    return match


@router.post("/{match_id}/decline")
async def decline_match(match_id: str, user=Depends(get_current_user)):
    db = get_supabase()
    match, _, _ = _get_match_and_check_party(db, match_id, user.id)
    if user.id == match.get("initiated_by"):
        raise HTTPException(status_code=403, detail="You cannot decline a match you initiated")
    if match.get("status") != "requested":
        raise HTTPException(status_code=400, detail="Only a pending match can be declined")
    result = db.table("matches").update({"status": "declined"}).eq("id", match_id).execute()
    return result.data[0]


@router.post("/{match_id}/mark-delivered")
async def mark_delivered(match_id: str, user=Depends(get_current_user)):
    """Traveller confirms the package has been dropped off."""
    db = get_supabase()
    match, _, trip_owner = _get_match_and_check_party(db, match_id, user.id)
    if user.id != trip_owner:
        raise HTTPException(status_code=403, detail="Only the traveller can mark the package as delivered")
    if match.get("status") != "accepted":
        raise HTTPException(status_code=400, detail="Match must be accepted before it can be marked as delivered")
    result = db.table("matches").update({"status": "delivered"}).eq("id", match_id).execute()
    match = result.data[0]
    if match.get("request_id"):
        db.table("requests").update({"status": "delivered"}).eq("id", match["request_id"]).execute()
    # trips.status has no 'delivered' value in its DB enum (open/matched/completed/cancelled) —
    # it intentionally stays 'matched' until mark_received moves it straight to 'completed'.
    return match


@router.post("/{match_id}/mark-received")
async def mark_received(match_id: str, user=Depends(get_current_user)):
    """Requester confirms the package has been received, closing out the match."""
    db = get_supabase()
    match, request_owner, _ = _get_match_and_check_party(db, match_id, user.id)
    if user.id != request_owner:
        raise HTTPException(status_code=403, detail="Only the requester can confirm receipt")
    if match.get("status") != "delivered":
        raise HTTPException(status_code=400, detail="Match must be delivered before receipt can be confirmed")
    result = db.table("matches").update({"status": "completed"}).eq("id", match_id).execute()
    match = result.data[0]
    if match.get("request_id"):
        db.table("requests").update({"status": "completed"}).eq("id", match["request_id"]).execute()
    if match.get("trip_id"):
        db.table("trips").update({"status": "completed"}).eq("id", match["trip_id"]).execute()
    return match


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
    _get_match_and_check_party(db, match_id, user.id)
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

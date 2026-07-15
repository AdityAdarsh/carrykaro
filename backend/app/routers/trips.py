from fastapi import APIRouter, BackgroundTasks, Depends, Query, HTTPException
from typing import Optional
from datetime import date
from app.dependencies import get_current_user
from app.database import get_supabase
from app.models.trip import TripCreate
from app.services.route_alerts_notify import notify_route_alerts

router = APIRouter()


@router.post("")
async def create_trip(body: TripCreate, background_tasks: BackgroundTasks, user=Depends(get_current_user)):
    db = get_supabase()
    data = {**body.model_dump(), "user_id": user.id, "status": "open"}
    data["travel_date"] = str(data["travel_date"])
    result = db.table("trips").insert(data).execute()
    created = result.data[0]
    if not created.get("is_stub"):
        background_tasks.add_task(
            notify_route_alerts, db, created["from_city"], created["to_city"], "trip", user.id
        )
    return created


@router.get("")
async def list_trips(
    from_city: Optional[str] = Query(None),
    to_city: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    db = get_supabase()
    q = db.table("trips").select("*, users(name, city), matches(count)").eq("status", "open").eq("is_stub", False).gte("travel_date", date.today().isoformat())
    if from_city:
        q = q.eq("from_city", from_city)
    if to_city:
        q = q.eq("to_city", to_city)
    result = q.order("travel_date").execute()
    for item in result.data:
        item["match_count"] = item["matches"][0]["count"] if item.get("matches") else 0
        del item["matches"]
    return result.data


@router.get("/{trip_id}")
async def get_trip(trip_id: str, user=Depends(get_current_user)):
    db = get_supabase()
    result = db.table("trips").select("*, users(name, city), matches(count)").eq("id", trip_id).single().execute()
    item = result.data
    item["match_count"] = item["matches"][0]["count"] if item.get("matches") else 0
    del item["matches"]
    return item


@router.patch("/{trip_id}/status")
async def update_trip_status(trip_id: str, body: dict, user=Depends(get_current_user)):
    db = get_supabase()
    status = body.get("status")
    if status not in ("matched", "cancelled"):
        raise HTTPException(status_code=400, detail="Invalid status")
    result = db.table("trips").update({"status": status}).eq("id", trip_id).eq("user_id", user.id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Trip not found or not yours")
    return result.data[0]


@router.delete("/{trip_id}")
async def cancel_trip(trip_id: str, user=Depends(get_current_user)):
    db = get_supabase()
    accepted = db.table("matches").select("id").eq("trip_id", trip_id).in_("status", ["accepted", "delivered"]).execute()
    if accepted.data:
        raise HTTPException(status_code=409, detail="You have an active match on this trip. Close the match before deleting.")
    result = db.table("trips").update({"status": "cancelled"}).eq("id", trip_id).eq("user_id", user.id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Trip not found or not yours")
    return {"ok": True}

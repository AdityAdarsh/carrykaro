from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from datetime import date
from app.dependencies import get_current_user
from app.database import get_supabase
from app.models.request import DeliveryRequestCreate
from postgrest.exceptions import APIError

router = APIRouter()


@router.post("")
async def create_request(body: DeliveryRequestCreate, user=Depends(get_current_user)):
    db = get_supabase()
    data = {**body.model_dump(), "user_id": user.id, "status": "open"}
    data["needed_by_date"] = str(data["needed_by_date"])
    try:
        result = db.table("requests").insert(data).execute()
    except APIError as e:
        if e.code == "23503":
            raise HTTPException(status_code=400, detail="Please complete your profile before posting a request.")
        raise HTTPException(status_code=500, detail=str(e.message))
    return result.data[0]


@router.get("")
async def list_requests(
    from_city: Optional[str] = Query(None),
    to_city: Optional[str] = Query(None),
    user=Depends(get_current_user),
):
    db = get_supabase()
    q = db.table("requests").select("*, users(name, city), matches(count)").eq("status", "open").eq("is_stub", False).gte("needed_by_date", date.today().isoformat())
    if from_city:
        q = q.eq("from_city", from_city)
    if to_city:
        q = q.eq("to_city", to_city)
    result = q.order("needed_by_date").execute()
    for item in result.data:
        item["match_count"] = item["matches"][0]["count"] if item.get("matches") else 0
        del item["matches"]
    return result.data


@router.get("/{request_id}")
async def get_request(request_id: str, user=Depends(get_current_user)):
    db = get_supabase()
    result = db.table("requests").select("*, users(name, city), matches(count)").eq("id", request_id).single().execute()
    item = result.data
    item["match_count"] = item["matches"][0]["count"] if item.get("matches") else 0
    del item["matches"]
    return item


@router.patch("/{request_id}/status")
async def update_request_status(request_id: str, body: dict, user=Depends(get_current_user)):
    db = get_supabase()
    status = body.get("status")
    if status not in ("matched", "cancelled"):
        raise HTTPException(status_code=400, detail="Invalid status")
    result = db.table("requests").update({"status": status}).eq("id", request_id).eq("user_id", user.id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Request not found or not yours")
    return result.data[0]


@router.delete("/{request_id}")
async def cancel_request(request_id: str, user=Depends(get_current_user)):
    db = get_supabase()
    accepted = db.table("matches").select("id").eq("request_id", request_id).eq("status", "accepted").execute()
    if accepted.data:
        raise HTTPException(status_code=409, detail="You have an active match on this request. Close the match before deleting.")
    result = db.table("requests").update({"status": "cancelled"}).eq("id", request_id).eq("user_id", user.id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Request not found or not yours")
    return {"ok": True}

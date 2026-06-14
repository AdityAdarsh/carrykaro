"""
Chat is handled via Supabase Realtime on the frontend.
This router stores messages to the DB for history.
"""
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.database import get_supabase
from app.models.message import MessageCreate

router = APIRouter()


def _check_match_access(db, match_id: str, user_id: str):
    """Raises 404 if match doesn't exist, 403 if user is not a party."""
    result = db.table("matches").select("initiated_by, requests(user_id), trips(user_id)").eq("id", match_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Match not found")
    match = result.data
    request_owner = (match.get("requests") or {}).get("user_id")
    trip_owner = (match.get("trips") or {}).get("user_id")
    if user_id not in [match.get("initiated_by"), request_owner, trip_owner]:
        raise HTTPException(status_code=403, detail="Not authorized")


@router.post("/messages")
async def send_message(body: MessageCreate, user=Depends(get_current_user)):
    db = get_supabase()
    _check_match_access(db, body.match_id, user.id)
    data = {"match_id": body.match_id, "sender_id": user.id, "content": body.content}
    result = db.table("messages").insert(data).execute()
    return result.data[0]


@router.get("/messages/{match_id}")
async def get_messages(match_id: str, user=Depends(get_current_user)):
    db = get_supabase()
    _check_match_access(db, match_id, user.id)
    result = (
        db.table("messages")
        .select("*")
        .eq("match_id", match_id)
        .order("created_at")
        .execute()
    )
    return result.data

"""
Chat is handled via Supabase Realtime on the frontend.
This router stores messages to the DB for history.
"""
from fastapi import APIRouter, Depends
from app.dependencies import get_current_user
from app.database import get_supabase
from app.models.message import MessageCreate

router = APIRouter()


@router.post("/messages")
async def send_message(body: MessageCreate, user=Depends(get_current_user)):
    db = get_supabase()
    data = {"match_id": body.match_id, "sender_id": user.id, "content": body.content}
    result = db.table("messages").insert(data).execute()
    return result.data[0]


@router.get("/messages/{match_id}")
async def get_messages(match_id: str, user=Depends(get_current_user)):
    db = get_supabase()
    result = (
        db.table("messages")
        .select("*")
        .eq("match_id", match_id)
        .order("created_at")
        .execute()
    )
    return result.data

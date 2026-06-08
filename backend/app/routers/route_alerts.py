from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.database import get_supabase
from app.models.route_alert import RouteAlertCreate

router = APIRouter()


@router.post("")
async def create_route_alert(body: RouteAlertCreate, user=Depends(get_current_user)):
    db = get_supabase()
    result = db.table("route_alerts").insert({
        **body.model_dump(),
        "user_id": user.id,
    }).execute()
    return result.data[0]

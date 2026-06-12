from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.database import get_supabase
from app.models.route_alert import RouteAlertCreate

router = APIRouter()


@router.get("/demand")
async def get_route_demand(from_city: str, to_city: str, looking_for: str, user=Depends(get_current_user)):
    db = get_supabase()
    result = db.table("route_alerts").select("id").eq("from_city", from_city).eq("to_city", to_city).eq("looking_for", looking_for).execute()
    return {"count": len(result.data)}


@router.post("")
async def create_route_alert(body: RouteAlertCreate, user=Depends(get_current_user)):
    db = get_supabase()
    try:
        result = db.table("route_alerts").insert({
            **body.model_dump(),
            "user_id": user.id,
        }).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Insert returned no data")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

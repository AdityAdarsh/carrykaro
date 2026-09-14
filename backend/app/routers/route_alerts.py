from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from app.dependencies import get_current_user
from app.database import get_supabase
from app.models.route_alert import RouteAlertCreate
from app.services.unsubscribe_token import verify_unsubscribe_token

router = APIRouter()

_UNSUBSCRIBE_PAGE = """<!doctype html><html><head><meta charset="utf-8">
<title>CarryKaro</title></head>
<body style="font-family:sans-serif;text-align:center;padding:64px 16px;color:#1A1209;">
<h2>{message}</h2>
<p><a href="https://carrykaro.live">Back to CarryKaro</a></p>
</body></html>"""


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


@router.get("/unsubscribe", response_class=HTMLResponse)
async def unsubscribe_route_alert(token: str):
    alert_id = verify_unsubscribe_token(token)
    if not alert_id:
        return HTMLResponse(_UNSUBSCRIBE_PAGE.format(message="This unsubscribe link is invalid."), status_code=400)

    db = get_supabase()
    db.table("route_alerts").delete().eq("id", alert_id).execute()
    return HTMLResponse(_UNSUBSCRIBE_PAGE.format(message="You've been unsubscribed from this route alert."))

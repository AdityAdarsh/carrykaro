from fastapi import HTTPException, Header
from supabase import Client
from app.database import get_supabase


async def get_current_user(authorization: str = Header(...)):
    """
    Validate Supabase JWT and return the user payload.
    The frontend sends: Authorization: Bearer <supabase_access_token>
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.split(" ")[1]
    db: Client = get_supabase()

    try:
        user = db.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user.user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Could not validate credentials: {e}")

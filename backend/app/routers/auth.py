"""
Auth is handled entirely by Supabase on the frontend.
This router handles post-auth callbacks and profile creation triggers.
"""
from fastapi import APIRouter

router = APIRouter()


@router.get("/me")
async def me():
    # Placeholder — frontend calls Supabase directly for auth state
    return {"message": "Use Supabase client on frontend for auth"}

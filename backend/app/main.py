from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, users, requests, trips, matches, chat, kyc, payments

app = FastAPI(
    title="CarryKaro API",
    version="0.1.0",
    docs_url="/docs" if settings.env == "development" else None,
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(requests.router, prefix="/requests", tags=["requests"])
app.include_router(trips.router, prefix="/trips", tags=["trips"])
app.include_router(matches.router, prefix="/matches", tags=["matches"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(kyc.router, prefix="/kyc", tags=["kyc"])
app.include_router(payments.router, prefix="/payments", tags=["payments"])


@app.get("/health")
async def health():
    return {"status": "ok"}

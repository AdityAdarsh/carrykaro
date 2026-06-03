# CarryKaro

P2P package delivery — leverage people already travelling between cities.

**Stack:** FastAPI · React + Vite · Supabase · Razorpay  
**Deploy:** Railway (backend) · Vercel (frontend)

---

## Local setup

### 1. Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor
3. Create storage bucket: **item-photos** (Public: on)
4. Enable Phone OTP in Authentication > Providers > Phone
5. Enable Google OAuth in Authentication > Providers > Google

### 2. Backend
```bash
cd backend
cp .env.example .env       # fill in Supabase + Razorpay keys
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# → http://localhost:8000/docs
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env       # fill in Supabase URL + anon key
npm install
npm run dev
# → http://localhost:5173
```

---

## Project structure

```
carrykaro/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, router registration
│   │   ├── config.py        # Pydantic settings from .env
│   │   ├── database.py      # Supabase client singleton
│   │   ├── dependencies.py  # JWT auth dependency
│   │   ├── models/          # Pydantic request/response models
│   │   ├── routers/         # One file per domain (requests, trips, matches, chat, kyc, payments)
│   │   └── services/        # KYC provider + Razorpay wrappers
│   ├── requirements.txt
│   ├── Dockerfile
│   └── railway.toml
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Routes
│   │   ├── index.css        # Design tokens + global styles
│   │   ├── components/      # Nav, UI primitives (Button, Card, Input, StatusBadge)
│   │   ├── pages/           # Home, Login, Onboarding, Browse, PostRequest, PostTrip, Chat, Profile
│   │   ├── hooks/           # useAuth, useChat
│   │   └── lib/             # supabase.js, api.js, utils.js
│   ├── vite.config.js       # Dev proxy → localhost:8000
│   └── vercel.json
│
└── supabase/
    └── migrations/
        └── 001_initial_schema.sql   # All tables, RLS policies, indexes, realtime
```

---

## Build order (from spec)

| Week | Focus |
|------|-------|
| 1 | Auth (Google + Phone OTP) + Profiles — `Login.jsx`, `Onboarding.jsx`, `/users` router |
| 2 | Post requests/trips + Browse board — `PostRequest.jsx`, `PostTrip.jsx`, `Browse.jsx` |
| 3 | Match initiation + In-app chat — `MatchPage.jsx`, `ChatPage.jsx`, `useChat.js` |
| 4 | Aadhaar KYC gate + Razorpay escrow — `services/kyc.py`, `services/razorpay.py` |
| 5 | Delivery confirmation + payout release |
| 6 | Bug fixes → first real transaction |

## KYC integration
Use IDfy, Signzy, or HyperVerge — all three offer Aadhaar OTP via a REST API call.  
Cost: ₹15–40/verification. Fill `KYC_API_KEY` + `KYC_API_SECRET` in `.env` and implement `services/kyc.py`.  
**Do not** attempt direct UIDAI integration — requires government KYC User Agency registration.

## Payments
Razorpay escrow flow: sender pays → money held → both confirm delivery → payout to traveller.  
Platform fee: 10% (configurable via `PLATFORM_FEE_PERCENT` in `.env`).  
MVP disputes: handle manually via WhatsApp.

# CarryKaro — Project Brief

**Last updated:** 2026-06-10
**Owner:** Aditya Adarsh (adityai81011@gmail.com)

---

## What it is

CarryKaro is a peer-to-peer package delivery platform. Senders post delivery requests (package, route, budget). Travellers post trips with spare capacity. They match, chat, and the traveller earns money for carrying the package on a trip they were already taking.

---

## Live URLs

| Service | URL |
|---|---|
| Frontend | https://carrykaro.live |
| Backend API | https://carrykaro-0zpp.onrender.com — auto-deploy from `main` |
| Database | Supabase — project ID: `ciyloumrhebzecfgptzg` |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth — Google OAuth only |
| Analytics | PostHog — project ID: `459564`, US cloud (`us.i.posthog.com`) |
| Payments | Razorpay — deferred to Phase 2 |
| KYC | IDfy — deferred to Phase 2 |
| Frontend deploy | Netlify (auto-deploy from GitHub `main`) |
| Backend deploy | Render (Docker) |
| Repo | github.com/AdityAdarsh/carrykaro |

---

## Local Setup

```bash
# Backend
cd backend
venv/bin/uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
npm run dev   # runs on http://localhost:5173
```

Project root: `/Users/adityaadarsh/Documents/Claude Projects/Carrykaro V1`

---

## Database

- **Tables:** `users`, `requests`, `trips`, `matches`, `messages`, `payments`
- **RLS:** enabled on all tables
- **Migration run:** `supabase/migrations/001_initial_schema.sql`
- **Pending migration:** `supabase/migrations/002_route_alerts.sql` — must be pasted into Supabase SQL Editor manually (CLI not installed)
- **Pending SQL:** `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_unique;` — stale constraint from old phone-OTP era, causes onboarding to fail for users with a phone on their account

---

## Pages Built

| Route | Page | Status |
|---|---|---|
| `/` | Landing / Home | Done — needs How It Works + Why CarryKaro sections |
| `/login` | Google OAuth sign-in | Done |
| `/onboarding` | Name, city, role setup | Done — needs Both role + travel frequency |
| `/browse` | Browse requests & trips with city filters | Done — needs better empty states |
| `/requests/:id` | Request detail + carrier match flow | Done |
| `/trips/:id` | Trip detail + sender match flow | Done |
| `/post-request` | Post a delivery request | Done |
| `/post-trip` | Post a trip | Done |
| `/profile` | View/edit profile | Done |
| `/matches/:matchId` | Match detail | Stub — needs "interest captured" confirmation screen |
| `/chat/:matchId` | Chat | Deferred to Phase 2 |

---

## Auth Flow

- Google OAuth only — phone OTP removed at MVP stage
- New users after Google sign-in → redirected to `/onboarding` (profile check in Browse.jsx)
- Phone number is optional — can be added in Profile, not collected at onboarding
- Supabase URL Config must have:
  - Site URL: `https://carrykaro.live`
  - Redirect URL: `https://carrykaro.live/**`

---

## Status Lifecycle (designed, partially implemented)

```
Request:  open → matched → in_transit → delivered → completed / cancelled
Match:    requested → accepted → in_transit → delivered → completed / declined
Trip:     open → matched → completed / cancelled
```

**What's actually wired up:**
- Match created → status `requested` ✅
- Match accepted → status `accepted` ✅
- Match declined → status `declined` ✅
- Request/trip status update when match accepted ❌ (not implemented — deferred)
- in_transit / delivered / completed transitions ❌ (deferred to Phase 2)
- Confirm delivery + payout ❌ (deferred to Phase 2)

For MVP: requests stay `open` indefinitely. Fine until real volume.

---

## Design System

| Token | Value |
|---|---|
| Saffron (primary) | `#E8601C` |
| Ink (text) | `#1A1209` |
| Background | `#FAF6F1` (cream) |
| Logo font | Oswald, 700 weight |
| Body/headings | Plus Jakarta Sans |

**Responsive:** Mobile has a bottom tab bar (Browse / Send / Carry / Profile). Desktop has top nav links. Breakpoints: ≤640px mobile, 641–900px tablet.

---

## Key Decisions Made

- **Google OAuth only** — phone OTP removed for MVP simplicity
- **Phone optional** — not collected at signup, can add later in Profile
- **Mobile-first** — bottom tab bar navigation on mobile
- **Payments deferred** — Razorpay is Phase 2
- **Status transitions deferred** — requests stay `open`, fine for early users
- **Netlify + `_redirects`** — `/* /index.html 200` added so React Router works on direct URL access
- **Env vars baked at build time** — all `VITE_*` vars must be set in Netlify dashboard (not just local `.env`); `.env` is gitignored
- **Legal/compliance deferred** — significant unresolved questions; Phase 1 is validation only
- **MatchPage stays a stub for now** — platform is pre-launch validation, not full functionality
- **No seeded fake data** — route popularity signal only shows when real data exists

---

## Phase 1 — Pre-Launch Validation (current focus)

Goal: gauge real demand before building full functionality. Drive traffic, collect data, let metrics decide Phase 2.

**Build order:**

| # | Item | Notes |
|---|---|---|
| 1 | ~~PostHog setup~~ | ✅ Done — all events wired, deployed |
| 2 | ~~KYC banner → "Early Access Beta"~~ | ✅ Done |
| 3 | ~~Better empty states + Route demand capture~~ | ✅ Code done — run `002_route_alerts.sql` in Supabase to activate |
| 4 | Enhanced onboarding | Add "Both" role + travel frequency field |
| 5 | Landing page — How It Works + Why CarryKaro | Conversion copy |
| 6 | Route popularity signal | Real data only, no seeded numbers |
| 7 | Feedback widget | Use Tally.so embed, not custom build |
| 8 | Verify all PostHog events firing | Check PostHog dashboard |

**PostHog events to track:**
`landing_page_visit`, `get_started_click`, `signup_completed`, `role_selected`, `request_posted`, `trip_posted`, `listing_viewed`, `listing_clicked`, `match_requested`, `route_alert_created`, `feedback_submitted`

**Phase 1 complete when all items above are live. Then stop building. Drive traffic.**

**Success metrics (measure 4–6 weeks post-launch):**
- Match rate >30% to continue (below 10% after 500 users = liquidity problem)
- Route alert signups — shows where demand exists without supply
- Funnel drop-off — where users abandon between signup and posting
- Top 3 routes by volume — Phase 2 focus corridors

---

## Explicitly Deferred to Phase 2

Do not touch until Phase 1 metrics justify it:
- Payments / Razorpay / Escrow
- KYC / IDfy
- Insurance
- Ratings / Reviews / Verification badges
- Chat (full implementation)
- Delivery OTP
- Dispute management
- Fraud detection
- Custom admin dashboard
- Request/trip status transitions
- **Item photos** — upload input is hidden in PostRequest for now. When re-enabling: add `browser-image-compression` (client-side, silent, ≤1MB target), show thumbnail preview after pick, display photo strip in RequestDetail. Code is already in place, just commented out.

---

## Production Bug Fixes (2026-06-10)

All production users were getting "Load Failed" / "Failed to fetch" on the Onboarding page. Root causes found and fixed:

1. **`VITE_API_BASE_URL` missing in Netlify** → fell back to `/api` (no proxy) → fixed by setting env var in Netlify dashboard
2. **CORS headers missing on error responses** — Starlette's `CORSMiddleware` does not add `Access-Control-Allow-Origin` to `HTTPException` or unhandled exception responses → fixed by adding custom `@app.exception_handler` handlers in `backend/app/main.py`
3. **`users_phone_unique` constraint in production** — stale unique constraint from old phone-OTP flow caused `POST /users/profile` upsert to crash → fixed by removing `phone` from the upsert payload in `backend/app/routers/users.py`

**Still needed:** Run `ALTER TABLE users DROP CONSTRAINT IF EXISTS users_phone_unique;` in Supabase SQL Editor.

---

## What's NOT Done Yet

- [x] PostHog analytics setup — all 9 events wired, user identify + reset on auth
- [x] KYC banner copy → "Early Access Beta" messaging
- [x] Route demand capture — code done; needs `002_route_alerts.sql` run in Supabase SQL Editor
- [ ] Drop `users_phone_unique` constraint — run in Supabase SQL Editor
- [ ] Enhanced onboarding (Both role + travel frequency)
- [ ] Landing page How It Works + Why CarryKaro sections
- [ ] Route popularity signal (real data only)
- [ ] Feedback widget (Tally.so)
- [ ] MatchPage → "interest captured" confirmation screen
- [ ] Legal / compliance page
- [ ] Delete `frontend/src/pages/FontPreview.jsx` (orphaned dev utility)

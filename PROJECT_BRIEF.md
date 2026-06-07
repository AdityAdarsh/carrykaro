# CarryKaro — Project Brief

**Last updated:** 2026-06-08
**Owner:** Aditya Adarsh (adityai81011@gmail.com)

---

## What it is

CarryKaro is a peer-to-peer package delivery platform. Senders post delivery requests (package, route, budget). Travellers post trips with spare capacity. They match, chat, and the traveller earns money for carrying the package on a trip they were already taking.

---

## Live URLs

| Service | URL |
|---|---|
| Frontend | https://carrykaro.live |
| Backend API | Render (Docker) — auto-deploy from `main` |
| Database | Supabase — project ID: `ciyloumrhebzecfgptzg` |

---

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth — Google OAuth only |
| Payments | Razorpay — not yet integrated |
| KYC | IDfy — placeholder only |
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
- **Migration:** `supabase/migrations/001_initial_schema.sql`

---

## Pages Built

| Route | Page | Status |
|---|---|---|
| `/` | Landing / Home | Done |
| `/login` | Google OAuth sign-in | Done |
| `/onboarding` | Name, city, role setup | Done |
| `/browse` | Browse requests & trips with city filters | Done |
| `/requests/:id` | Request detail + carrier match flow | Done |
| `/trips/:id` | Trip detail + sender match flow | Done |
| `/post-request` | Post a delivery request | Done |
| `/post-trip` | Post a trip | Done |
| `/profile` | View/edit profile | Done |
| `/matches/:matchId` | Match detail | Stub only |
| `/chat/:matchId` | Chat | Stub only |

---

## Auth Flow

- Google OAuth only — phone OTP was removed at MVP stage
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
- Request/trip status update when match accepted ❌ (not implemented)
- in_transit / delivered / completed transitions ❌ (stubs / TODOs)
- Confirm delivery + payout ❌ (TODO in backend)

For MVP: requests stay `open` indefinitely. Not a problem until real volume.

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
- **Phone optional** — not collected at signup, user can add later in Profile
- **Mobile-first** — bottom tab bar navigation on mobile
- **No payment at MVP** — Razorpay keys exist but integration is Week 4
- **Status transitions deferred** — requests stay `open`, fine for early users
- **Netlify + `_redirects`** — `/* /index.html 200` added so React Router works on direct URL access

---

## What's NOT Done Yet

- [ ] Razorpay payment integration (Week 4)
- [ ] KYC / IDfy integration
- [ ] MatchPage — currently just shows match ID and "Open chat" button
- [ ] Chat page — stub only
- [ ] Request/trip status transitions when match is accepted
- [ ] Confirm delivery + payout flow
- [ ] Supabase unique constraints for phone/email (needs duplicate cleanup first)
- [ ] Delete `frontend/src/pages/FontPreview.jsx` (orphaned dev utility)

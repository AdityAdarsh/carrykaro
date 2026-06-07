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
| Analytics | PostHog — to be set up (Phase 1) |
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
- **Migration:** `supabase/migrations/001_initial_schema.sql`
- **Pending:** Add `route_alerts` table for demand capture (Phase 1)
- **Pending:** Supabase unique constraints for phone/email (delete duplicates first)

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
- **Legal/compliance deferred** — significant unresolved questions; Phase 1 is validation only
- **MatchPage stays a stub for now** — platform is pre-launch validation, not full functionality
- **No seeded fake data** — route popularity signal only shows when real data exists

---

## Phase 1 — Pre-Launch Validation (current focus)

Goal: gauge real demand before building full functionality. Drive traffic, collect data, let metrics decide Phase 2.

**Build order:**

| # | Item | Notes |
|---|---|---|
| 1 | PostHog setup | Must go in first — all events tracked from day one |
| 2 | KYC banner → "Early Access Beta" | 5-min copy change |
| 3 | Better empty states + Route demand capture | Linked — empty state CTA creates route alert |
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

---

## What's NOT Done Yet

- [ ] PostHog analytics setup
- [ ] Route demand capture (new `route_alerts` Supabase table + empty state CTAs)
- [ ] Enhanced onboarding (Both role + travel frequency)
- [ ] Landing page How It Works + Why CarryKaro sections
- [ ] Route popularity signal (real data only)
- [ ] Feedback widget (Tally.so)
- [ ] MatchPage → "interest captured" confirmation screen
- [ ] KYC banner copy change
- [ ] Legal / compliance page
- [ ] Delete `frontend/src/pages/FontPreview.jsx` (orphaned dev utility)
- [ ] Supabase unique constraints for phone/email

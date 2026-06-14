# CarryKaro — Project Brief

**Last updated:** 2026-06-14
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

- **Tables:** `users`, `requests`, `trips`, `matches`, `messages`, `payments`, `route_alerts`
- **RLS:** enabled on all tables
- **Migrations run:** `001_initial_schema.sql`, `002_route_alerts.sql`
- **Pending migration:** `supabase/migrations/003_stub_and_match_count.sql` — adds `is_stub` column to `trips` and `requests`; must be pasted into Supabase SQL Editor manually (CLI not installed)
- **Note:** `users_phone_unique` constraint intentionally kept — phone verification planned for Phase 2

---

## Pages Built

| Route | Page | Status |
|---|---|---|
| `/` | Landing / Home | Done — needs How It Works + Why CarryKaro sections |
| `/login` | Google OAuth sign-in | Done |
| `/onboarding` | Name, city, role setup | Done — needs Both role + travel frequency |
| `/browse` | Browse requests & trips & My Listings (3 tabs) | Done |
| `/requests/:id` | Request detail + one-tap carrier interest + delete | Done |
| `/trips/:id` | Trip detail + one-tap sender interest + delete | Done |
| `/post-request` | Post a delivery request | Done |
| `/post-trip` | Post a trip | Done |
| `/profile` | View/edit profile + sign out | Done |
| `/messages` | Messages inbox — all chat threads with unread indicators | Done |
| `/chat/:matchId` | Real-time chat | Done |
| `/matches/:matchId` | Match detail | Stub — kept for Phase 2 lifecycle (accept/reject, status tracking) |

---

## Auth Flow

- Google OAuth only — phone OTP removed at MVP stage
- New users after Google sign-in → redirected to `/onboarding` (profile check in Browse.jsx)
- Phone number is optional — can be added in Profile, not collected at onboarding
- Supabase URL Config must have:
  - Site URL: `https://carrykaro.live`
  - Redirect URL: `https://carrykaro.live/**`

---

## Navigation

- **Top nav (all screens):** CarryKaro logo (left) · 💬 Messages icon with unread badge · 🔔 Notifications bell with badge (right)
- **Desktop:** additional Browse / Send / Carry / Profile text links in top nav
- **Mobile:** bottom tab bar — Browse / Send / Carry / Profile
- **Sign out:** inside Profile page, not in nav
- **Notifications bell shows:** new match interest on your listing, your match accepted, your match declined
- **Messages badge:** live unread message count via Supabase Realtime; clears on visiting `/messages`

---

## Notifications & Messaging Architecture

- `useNotifications` hook (frontend): fetches user's matches on mount, derives notifications from match status + ownership, subscribes to Supabase Realtime `postgres_changes` on `messages` table per match
- Seen state persisted in `localStorage`: `notif_seen_{matchId}`, `chat_last_read_{matchId}`
- Active chat detection via `window.location.pathname` — no badge increment if user is already on that chat
- `MessagesPage` fetches `/matches/my` + last message per match in parallel; shows unread dot if last message is from other party and newer than `chat_last_read_{matchId}`

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

## Delete Listing

- **RequestDetail + TripDetail:** Delete button shown to owner only
- **Guard:** Backend returns 409 if an accepted match exists — user sees inline error "You have an active match on this listing"
- **On success:** soft-delete (sets status to `cancelled`), redirects to Browse
- **Endpoints:** `DELETE /requests/:id` and `DELETE /trips/:id` — both on backend

---

## Form Validation

- **Weight / capacity:** dropdown select 1–10 kg (not free-text)
- **Same city guard:** submit disabled with inline error if from_city === to_city
- **Date:** `min={today}`, inline error if past date selected
- **Budget (sender):** single field, value written to both `price_range_min` and `price_range_max` in DB
- **Min earning (carrier):** single field, value written to both `earning_range_min` and `earning_range_max` in DB
- **Onboarding name:** pre-filled from Google `user_metadata.full_name`, still editable

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
- **MatchPage stays a stub** — kept for Phase 2 (accept/reject flow, match lifecycle); after a match is created users go directly to `/chat/:matchId`
- **No seeded fake data** — route popularity signal only shows when real data exists
- **Chat opens on `requested` status** — as soon as carrier expresses interest, not waiting for acceptance
- **Delete only, no edit** — if user made a mistake, delete and repost; edit deferred (complex with active matches)
- **No staging environment yet** — direct-to-prod acceptable until real users exist; set up staging (second Supabase project + Netlify site on `staging` branch) when user base reaches ~10–20
- **Photo upload hidden** — disabled for Phase 1; will re-enable with client-side compression in Phase 2

---

## Phase 1 — Pre-Launch Validation (current focus)

Goal: gauge real demand before building full functionality. Drive traffic, collect data, let metrics decide Phase 2.

**Build order:**

| # | Item | Status |
|---|---|---|
| 1 | PostHog setup | ✅ Done — all events wired, deployed |
| 2 | KYC banner → "Early Access Beta" | ✅ Done |
| 3 | Better empty states + Route demand capture | ✅ Done — `002_route_alerts.sql` run in Supabase |
| 4 | Form validation + UX polish | ✅ Done — dropdowns, same-city guard, single price fields, name prefill |
| 5 | Chat + Messages inbox + Notifications | ✅ Done — real-time chat, `/messages` inbox, bell + badge in nav |
| 6 | Delete listing | ✅ Done — with accepted-match guard |
| 7 | One-tap express interest (no pre-posting required) | ✅ Done — stub listing pattern, smart route detection |
| 8 | Stub listings hidden from Browse | ✅ Done — `is_stub` flag; run `003_stub_and_match_count.sql` in Supabase to activate |
| 9 | Match interest count on listings | ✅ Done — "X interested" badge on Browse cards + detail pages |
| 10 | My Listings tab in Browse | ✅ Done — mark-as-matched + delete actions inline |
| 11 | Enhanced onboarding | ✅ Done — "Both" role + travel frequency field added |
| 12 | Landing page — How It Works + Why CarryKaro | ✅ Done — conversion copy live |
| 13 | Route popularity signal | ✅ Done — real data only |
| 14 | Feedback widget | ✅ Done — Tally.so embed live |

**PostHog events to track:**
`landing_page_visit`, `get_started_click`, `signup_completed`, `role_selected`, `request_posted`, `trip_posted`, `listing_viewed`, `listing_clicked`, `match_requested`, `route_alert_created`, `feedback_submitted`

**Phase 1 is code-complete. All 14 items shipped. Now: drive traffic, measure metrics.**

**Success metrics (measure 4–6 weeks post-launch):**
- Match rate >30% to continue (below 10% after 500 users = liquidity problem)
- Route alert signups — shows where demand exists without supply
- Funnel drop-off — where users abandon between signup and posting
- Top 3 routes by volume — Phase 2 focus corridors

---

## Explicitly Deferred to Phase 2

Do not touch until Phase 1 metrics justify it:
- **Stale listing auto-expiry:** Browse already filters out past-date listings on read (`.gte("needed_by_date", today)` on requests, `.gte("travel_date", today)` on trips). For Phase 2: add an `expired` status (distinct from `cancelled` = user-deleted), set up a Supabase pg_cron job to mark past-date `open` listings as `expired` daily, and show a "Repost?" CTA in My Listings for expired entries.
- Payments / Razorpay / Escrow
- KYC / IDfy
- Insurance
- Ratings / Reviews / Verification badges
- Delivery OTP
- Dispute management
- Fraud detection
- Custom admin dashboard
- Request/trip status transitions (in_transit, delivered, completed)
- **Item photos** — upload input is hidden in PostRequest for now. When re-enabling: add `browser-image-compression` (client-side, silent, ≤1MB target), show thumbnail preview after pick, display photo strip in RequestDetail. Code is already in place, just commented out.
- **PRD** — to be written after Phase 1 testing; will capture validated decisions and inform Phase 2 scope

---

## Production Bug Fixes (2026-06-10)

All production users were getting "Load Failed" / "Failed to fetch" on the Onboarding page. Root causes found and fixed:

1. **`VITE_API_BASE_URL` missing in Netlify** → fell back to `/api` (no proxy) → fixed by setting env var in Netlify dashboard
2. **CORS headers missing on error responses** — Starlette's `CORSMiddleware` does not add `Access-Control-Allow-Origin` to `HTTPException` or unhandled exception responses → fixed by adding custom `@app.exception_handler` handlers in `backend/app/main.py`
3. **`users_phone_unique` constraint in production** — stale unique constraint from old phone-OTP flow caused `POST /users/profile` upsert to crash → fixed by removing `phone` from the upsert payload in `backend/app/routers/users.py`

---

## Post-Phase-1 Polish (2026-06-13 session)

Changes shipped in commits `ec87b0d` and `5cb4490`:

- **Button system:** Three-tier CSS system — `btn-primary` (saffron fill), `btn-outline` (transparent/border), `btn-danger` (red outline). `justify-content: center` added to base `.btn` so text stays centred at any width. All pages migrated off inline styles.
- **LoadingPage component:** Spinner + "Loading…" → "Getting the carriers moving…" after 5s. Used in Profile, RequestDetail, TripDetail.
- **Browse + Messages loading states:** Inline loading text replaced with spinner + branded message.
- **`api.js` retry + 401 handling:** Retries up to 3× (5s delay) on `TypeError` (Render cold start). On 401: attempts session refresh once; signs out only if refresh also fails. Prevents false logouts for users with briefly-expired tokens.
- **iOS date input fix:** Added `min-height: 44px`, `padding: 10px 14px`, `display: block` with `!important` — Safari was collapsing date fields to near-zero height.
- **Profile fixes:** Role label correctly maps DB value `traveller` → "Carrier" (not `carrier`). Email shown as read-only in view mode. Cancel button uses `btn-outline`. `saveContact` uses `try/finally` so saving state always resets on error.
- **PostRequest / PostTrip:** Submit handler now has `try/catch`; `setLoading(false)` in catch so button doesn't stay stuck.
- **ButtonPreview page:** `/button-preview` — visual reference for all button variants.

## Netlify Push Budget

~5 pushes remaining of the free tier allotment (resets 11 July 2026). **Do not push automatically — always ask first.**

## Pending Manual Actions (Supabase SQL Editor)

These must be run manually — Supabase CLI not installed:

1. `supabase/migrations/003_stub_and_match_count.sql` — adds `is_stub` to trips + requests; Browse will error without it

## Remaining Gaps

- [ ] Legal / compliance page (not built)
- [ ] Google OAuth consent screen still shows Supabase URL ("to continue to ciyloumrhebzecfgptzg.supabase.co") — not fixable without paid Supabase custom domain; workaround: switch Audience to Production + add `carrykaro.live` to Authorized Domains in Google Cloud Console

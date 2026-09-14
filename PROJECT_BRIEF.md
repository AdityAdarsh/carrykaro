# CarryKaro — Project Brief

**Last updated:** 2026-07-15
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
- **Migrations run:** `001_initial_schema.sql`, `002_route_alerts.sql`, `003_stub_and_match_count.sql`, `004_travel_frequency_both_role.sql`, `005_realtime_matches.sql` — all applied in Supabase
- **Schema quirk:** `route_alerts.user_id` references `auth.users(id)` directly, unlike every other table which references `public.users(id)` — PostgREST can't embed `users(...)` in a `route_alerts` select because of this. See Route Alert Email Notifications below.
- **Schema limitation:** `trip_status` enum only has `open / matched / completed / cancelled` — no `delivered` or `in_transit` value (unlike `request_status`, which has both). Don't set `trips.status = 'delivered'` without a migration first — it violates the enum constraint.
- **Note:** `users_phone_unique` constraint intentionally kept — phone verification planned for Phase 2

---

## Pages Built

| Route | Page | Status |
|---|---|---|
| `/` | Landing / Home | ✅ Done — hero, How It Works, Why CarryKaro, privacy footer |
| `/login` | Google OAuth sign-in | ✅ Done |
| `/onboarding` | Name, city, role + travel frequency | ✅ Done |
| `/browse` | Browse requests & trips & My Listings (3 tabs) | ✅ Done |
| `/requests/:id` | Request detail + one-tap carrier interest + delete | ✅ Done |
| `/trips/:id` | Trip detail + one-tap sender interest + delete | ✅ Done |
| `/post-request` | Post a delivery request | ✅ Done |
| `/post-trip` | Post a trip | ✅ Done |
| `/profile` | View/edit profile + sign out | ✅ Done |
| `/messages` | Messages inbox — all chat threads with unread indicators | ✅ Done |
| `/chat/:matchId` | Real-time chat | ✅ Done |
| `/button-preview` | Dev tool — visual reference for button variants | ✅ Done (not linked in nav) |
| `*` (404) | Page not found | ✅ Done — friendly fallback with back-to-browse link |
| `/matches/:matchId` | Match detail | ⚠️ Stub — file exists, NOT routed. Backend GET /matches/:id is implemented. Kept for Phase 2. |

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

## Status Lifecycle (2026-07-15: delivered/completed now wired)

```
Request:  open → matched → delivered → completed / cancelled   (in_transit unused)
Match:    requested → accepted → delivered → completed / declined
Trip:     open → matched → completed / cancelled                (no delivered state — enum limitation, see Database)
```

**What's actually wired up:**
- Match created → status `requested` ✅
- Match accepted → status `accepted` ✅ (also updates request + trip to `matched`) — `POST /matches/:id/accept`
- Match declined → status `declined` ✅, only legal from `requested` (guard added 2026-07-15) — `POST /matches/:id/decline`
- Traveller marks delivered → match + request → `delivered` ✅ — `POST /matches/:id/mark-delivered`. Trip status intentionally NOT updated here (no `delivered` value in `trip_status` enum); trip stays `matched` until completion.
- Sender confirms receipt → match + request + trip → `completed` ✅ — `POST /matches/:id/mark-received`
- `in_transit` — declared in both `RequestStatus`/`MatchStatus` enums but no code path ever sets it; vestigial, not wired to anything
- Payout on completion ❌ (deferred to Phase 2 with Razorpay — old `confirm-delivery` stub was removed and replaced by mark-delivered/mark-received, no payment logic added)
- **Cancellation guard:** `DELETE /requests/:id` and `DELETE /trips/:id` block if a match is `accepted` OR `delivered` (fixed 2026-07-15 — previously only checked `accepted`, so a listing could be cancelled mid-handoff and later silently overwritten back to `completed` by mark-received)

For MVP: requests stay `open` indefinitely if never matched. Fine until real volume.

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

**Buttons:** Three-tier CSS system — `btn-primary` (saffron fill), `btn-outline` (transparent/border), `btn-danger` (red outline). All use `.btn` base class with `display: inline-flex; justify-content: center`.

**Fonts loaded:** Only Oswald + Plus Jakarta Sans (trimmed from 10 families to 2 on 2026-07-02).

**Responsive:** Mobile has a bottom tab bar (Browse / Send / Carry / Profile). Desktop has top nav links. Breakpoints: ≤640px mobile, 641–900px tablet.

---

## Backend Routers

| Router | Endpoints | Status |
|---|---|---|
| `users` | POST/GET/PATCH `/profile`, GET `/listings` | ✅ Full |
| `requests` | POST/GET (list)/GET `:id`/PATCH `:id/status`/DELETE `:id` | ✅ Full |
| `trips` | POST/GET (list)/GET `:id`/PATCH `:id/status`/DELETE `:id` | ✅ Full |
| `matches` | POST, POST `:id/accept`, POST `:id/decline`, POST `:id/mark-delivered`, POST `:id/mark-received`, GET `/my`, GET `:id` | ✅ Full — delivery confirmation flow added 2026-07-15, replacing the old `confirm-delivery` stub |
| `chat` | POST `/messages`, GET `/messages/:matchId` | ✅ Full |
| `route_alerts` | GET `/demand`, POST | ✅ Full — POST now triggers email notification (see below) |
| `payments` | POST `/create-order`, POST `/verify` | ⚠️ Stub — both raise `NotImplementedError` |
| `kyc` | POST `/initiate`, GET `/status` | ⚠️ Stub — fake `provider_ref`, no real API call |
| `auth` | GET `/me` | ⚠️ Placeholder — not used; auth is all Supabase client-side |

---

## Route Alert Email Notifications (2026-07-15 — LIVE)

Route alerts (`route_alerts` table) previously only captured demand with no delivery mechanism — a user could register interest in a route and never hear anything back. Now wired end to end and confirmed working in production (verified: real email received, correct `carrykaro.live` link).

- **Event-driven, not cron:** when `POST /requests` or `POST /trips` creates a new listing, `notify_route_alerts()` (`backend/app/services/route_alerts_notify.py`) fires as a `BackgroundTasks` job — no polling, no scheduler to host.
- Looks up `route_alerts` rows matching the new listing's `from_city`/`to_city`/`looking_for`, excludes the listing's own creator via `.neq("user_id", ...)`, fetches recipient emails from `users`, sends via Resend (`backend/app/services/email.py`).
- **Stub listings excluded** — the one-tap "express interest" flow (`TripDetail.jsx`/`RequestDetail.jsx`) creates `is_stub: true` requests/trips just to attach a match; these are skipped so alert subscribers aren't emailed about listings that never appear in Browse (fixed 2026-07-15).
- **HTML-escaped + URL-encoded** — `from_city`/`to_city` are free-text on the backend (only the frontend UI restricts them via a dropdown), so both are escaped with `html.escape()` before going into the email body/href, and the deep link's query string uses `urlencode()` (fixed 2026-07-15 — previously vulnerable to HTML/attribute injection via a direct API call, and city names with spaces broke the link in some email clients).
- **Deep link works** — `Browse.jsx` now reads `?tab=&from=&to=` via `useSearchParams` on load and pre-fills the tab + filters (fixed 2026-07-15 — previously the link was decorative and always landed on the default Browse view).
- **Batched sends** — `send_email()`/`send_batch()` in `email.py` call Resend's `/emails/batch` endpoint (up to 100 recipients per HTTP call) instead of one blocking call per recipient (fixed 2026-07-15).
- Email failures are logged and swallowed (never raises) — a Resend outage must never break listing creation.
- **Known v1 tradeoff (unchanged):** no "already notified" tracking. A busy route will re-email an alerted user on every new matching listing, not just the first. Fine at current volume; revisit with a `notified_at` column if it gets noisy.
- **Manual setup completed:** Resend account created, `carrykaro.live` domain verified (DNS records added in Namecheap — DKIM TXT, SPF MX + TXT, DMARC TXT; needed "Custom MX" mode switched on in Namecheap's Mail Settings before the MX record type appeared), `RESEND_API_KEY` + `FROM_EMAIL=CarryKaro <alerts@carrykaro.live>` + `FRONTEND_BASE_URL=https://carrykaro.live` set on Render.

---

## Delivery Confirmation Flow (2026-07-15)

Closes the gap previously listed under Explicitly Deferred as "Request/trip status transitions." Replaced the old `POST /matches/:id/confirm-delivery` stub (raised nothing useful, had a `# TODO` for tracking per-party confirmation) with two real endpoints in `backend/app/routers/matches.py`:

- **`POST /matches/:id/mark-delivered`** — only the traveller (trip owner) can call it, only from `accepted` status. Sets match + request to `delivered`. Does NOT touch `trips.status` (enum limitation — see Database section).
- **`POST /matches/:id/mark-received`** — only the sender (request owner) can call it, only from `delivered` status. Sets match, request, AND trip to `completed`.
- **`decline_match` guard added** — previously had no status check at all; now requires `status == 'requested'`, so a match that's already `delivered`/`completed` can't be declined out from under the other party.
- **Known limitation:** `mark-delivered` is traveller-asserted with no sender recourse besides messaging them — a traveller can mark delivered on an undelivered package and the request shows `delivered` indefinitely with no dispute/override path. Acceptable at this scale (no payment on the line yet); watch for it in support tickets. Would need a dispute flow before Razorpay/escrow ships.

**Frontend (`ChatPage.jsx`):**
- Shows a status badge + the correct action button per party: `requested` → Accept/Decline (for the non-initiator), `accepted` → "Mark as delivered" (traveller only), `delivered` → "Mark as received" (sender only), `completed` → "Completed ✓".
- Fetches match state via `GET /matches/:id` on mount, and now also subscribes to Supabase Realtime (`postgres_changes` UPDATE on `matches`, filtered by `id`) so the other party's action shows up live instead of needing a manual reload. Requires migration `005_realtime_matches.sql` (adds `matches` to the `supabase_realtime` publication) — **already run in Supabase**.
- `StatusBadge.jsx` now exports `STATUS_COLORS` as the single source of truth; `MessagesPage.jsx` imports it instead of a second hardcoded color map that had drifted (was showing a different shade of green for `completed` in the inbox list vs. the chat header).

---

## Safety & Prohibited Items Page (2026-07-15)

Added ahead of any real-user launch — CarryKaro doesn't inspect packages or verify identities, so senders and travellers are meeting as strangers.

- **`frontend/public/safety.html`** — static page matching the existing `privacy.html` pattern (same fonts/colors, not a React route). Covers: meet in public, open-package policy (never accept a sealed item), a prohibited items list (cash, drugs, weapons, alcohol/tobacco without license, stolen/counterfeit goods, live animals, hazardous materials), what to do if something goes wrong, and a liability/responsibility clause.
- Linked from the landing page footer (next to Privacy Policy) and from a short notice directly above the submit button on both `PostRequest.jsx` and `PostTrip.jsx` — placed where it'll actually get read, right before someone posts.

---

## Key Decisions Made

- **Google OAuth only** — phone OTP removed for MVP simplicity
- **Phone optional** — not collected at signup, can add later in Profile
- **Mobile-first** — bottom tab bar navigation on mobile
- **Payments deferred** — Razorpay is Phase 2
- **Status transitions deferred** — requests stay `open`, fine for early users
- **Netlify + `_redirects`** — `/* /index.html 200` added so React Router works on direct URL access
- **Env vars baked at build time** — all `VITE_*` vars must be set in Netlify dashboard (not just local `.env`); `.env` is gitignored
- **Privacy policy built** — `public/privacy.html` (static HTML, not a React page), live at `carrykaro.live/privacy.html`
- **MatchPage stays a stub** — kept for Phase 2 (accept/reject flow, match lifecycle); after a match is created users go directly to `/chat/:matchId`; MatchPage is NOT routed in App.jsx
- **No seeded fake data** — route popularity signal only shows when real data exists
- **Chat opens on `requested` status** — as soon as carrier expresses interest, not waiting for acceptance
- **Delete only, no edit** — if user made a mistake, delete and repost; edit deferred (complex with active matches)
- **No staging environment yet** — direct-to-prod acceptable until real users exist; set up staging (second Supabase project + Netlify site on `staging` branch) when user base reaches ~10–20
- **Photo upload hidden** — disabled for Phase 1; will re-enable with client-side compression in Phase 2

---

## Phase 1 — Pre-Launch Validation

Goal: gauge real demand before building full functionality. Drive traffic, collect data, let metrics decide Phase 2.

| # | Item | Status |
|---|---|---|
| 1 | PostHog setup | ✅ Done — all events wired, deployed |
| 2 | KYC banner → "Early Access Beta" | ✅ Done |
| 3 | Better empty states + Route demand capture | ✅ Done |
| 4 | Form validation + UX polish | ✅ Done — dropdowns, same-city guard, single price fields, name prefill |
| 5 | Chat + Messages inbox + Notifications | ✅ Done — real-time chat, `/messages` inbox, bell + badge in nav |
| 6 | Delete listing | ✅ Done — with accepted-match guard |
| 7 | One-tap express interest (no pre-posting required) | ✅ Done — stub listing pattern, smart route detection |
| 8 | Stub listings hidden from Browse | ✅ Done — `is_stub` flag active |
| 9 | Match interest count on listings | ✅ Done — "X interested" badge on Browse cards + detail pages |
| 10 | My Listings tab in Browse | ✅ Done — mark-as-matched + delete actions inline |
| 11 | Enhanced onboarding | ✅ Done — "Both" role + travel frequency field added |
| 12 | Landing page — How It Works + Why CarryKaro | ✅ Done — conversion copy live |
| 13 | Route popularity signal | ✅ Done — real data only |
| 14 | Feedback widget | ✅ Done — Tally.so embed live (form ID: ODV0a7) |

**Phase 1 is code-complete. All 14 items shipped. Now: drive traffic, measure metrics.**

**PostHog events tracked:**
`landing_page_visit`, `get_started_click`, `signup_completed`, `role_selected`, `request_posted`, `trip_posted`, `listing_viewed`, `listing_clicked`, `match_requested`, `route_alert_created`, `feedback_submitted`

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
- ~~Request/trip status transitions (in_transit, delivered, completed)~~ — **delivered/completed shipped 2026-07-15**, see Delivery Confirmation Flow. `in_transit` remains unwired (vestigial enum value).
- MatchPage full implementation (file exists, backend endpoint exists — just needs wiring)
- **Item photos** — upload input is hidden in PostRequest for now. When re-enabling: add `browser-image-compression` (client-side, silent, ≤1MB target), show thumbnail preview after pick, display photo strip in RequestDetail. Code is already in place, just commented out.
- **PRD** — to be written after Phase 1 testing; will capture validated decisions and inform Phase 2 scope

---

## Production Bug Fixes (2026-06-10)

All production users were getting "Load Failed" / "Failed to fetch" on the Onboarding page. Root causes found and fixed:

1. **`VITE_API_BASE_URL` missing in Netlify** → fell back to `/api` (no proxy) → fixed by setting env var in Netlify dashboard
2. **CORS headers missing on error responses** — Starlette's `CORSMiddleware` does not add `Access-Control-Allow-Origin` to `HTTPException` or unhandled exception responses → fixed by adding custom `@app.exception_handler` handlers in `backend/app/main.py`
3. **`users_phone_unique` constraint in production** — stale unique constraint from old phone-OTP flow caused `POST /users/profile` upsert to crash → fixed by removing `phone` from the upsert payload in `backend/app/routers/users.py`

---

## Post-Phase-1 Polish (2026-06-13)

- **Button system:** Three-tier CSS system — `btn-primary`, `btn-outline`, `btn-danger`. All pages migrated off inline styles.
- **LoadingPage component:** Spinner + "Loading…" → "Getting the carriers moving…" after 5s. Used in Profile, RequestDetail, TripDetail.
- **Browse + Messages loading states:** Inline loading text replaced with spinner + branded message.
- **`api.js` retry + 401 handling:** Retries up to 3× (5s delay) on `TypeError` (Render cold start). On 401: attempts session refresh once; signs out only if refresh also fails.
- **iOS date input fix:** Added `min-height: 44px`, `padding: 10px 14px`, `display: block` with `!important` — Safari was collapsing date fields to near-zero height.
- **Profile fixes:** Role label correctly maps DB value `traveller` → "Carrier". Email shown as read-only in view mode. `saveContact` uses `try/finally` so saving state always resets on error.
- **PostRequest / PostTrip:** Submit handler has `try/catch`; `setLoading(false)` in catch so button doesn't stay stuck.

## Code Cleanup (2026-07-02)

- **Font bloat fixed:** `index.html` trimmed from 10 Google Font families to 2 (Oswald + Plus Jakarta Sans only). ~300–500ms faster first load.
- **404 route added:** `*` catch-all in App.jsx shows a friendly "Page not found" screen with back-to-browse link.
- **Dead file removed:** `FontPreview.jsx` deleted (was never imported or routed).

---

## Route Alerts, Delivery Flow, Safety Page (2026-07-15)

Pushed as commit `aacacbe`. Full detail in the dedicated sections above (Route Alert Email Notifications, Delivery Confirmation Flow, Safety & Prohibited Items Page). Summary:

- Route alert emails now actually send (Resend, `carrykaro.live` domain verified) when a matching request/trip is posted
- Delivery confirmation flow: `mark-delivered` → `mark-received` endpoints + ChatPage UI + live status updates via Realtime
- `frontend/public/safety.html` — meet-in-public / open-package / prohibited-items guidance, linked from footer + both post forms
- Code-review fixes bundled in: stale cancellation guard (blocked only on `accepted`, not `delivered`), `decline_match` missing a status guard, HTML injection risk in emails, broken deep link, duplicated status-color maps, sequential blocking email sends
- Deliberately NOT fixed: `mark_delivered` doesn't set `trips.status` — would violate the `trip_status` Postgres enum (no `delivered` value exists for trips); documented instead of forced

---

## Netlify Push Budget

Reset date (11 July 2026) has passed, so the free-tier allotment should have refreshed — exact remaining count not re-checked. One push made 2026-07-15 (commit `aacacbe` — route alert emails, delivery flow, safety page, review fixes). **Do not push automatically — always ask first.**

## Env Vars

**Netlify (frontend — set in dashboard, NOT in .env which is gitignored):**
```
VITE_SUPABASE_URL=https://ciyloumrhebzecfgptzg.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
VITE_API_BASE_URL=https://carrykaro-0zpp.onrender.com
VITE_POSTHOG_KEY=phc_nUS2kb3YLMdtzkqA6Nhhbn7fUjSFbPcK2uNjpZtnX2V3
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

**Render (backend):** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `CORS_ORIGINS=https://carrykaro.live`, `RESEND_API_KEY`, `FROM_EMAIL=CarryKaro <alerts@carrykaro.live>`, `FRONTEND_BASE_URL=https://carrykaro.live` (route-alert email vars added + confirmed live 2026-07-15)

**Local backend `.env` note:** `FRONTEND_BASE_URL` is intentionally `http://localhost:5173` locally (so test emails during dev link to the local frontend) vs. `https://carrykaro.live` on Render — not a bug if a locally-triggered test email links to localhost.

---

## Remaining Gaps

- [x] Legal / compliance — `public/privacy.html` live at `carrykaro.live/privacy.html`
- [x] Google OAuth verification — **complete as of 2026-06-15**. Brand verification approved by Google Trust & Safety. App is **In Production** — any user can sign in without the "unverified app" warning.
- [ ] Google OAuth consent screen still shows Supabase URL ("to continue to ciyloumrhebzecfgptzg.supabase.co") — not fixable without paid Supabase custom domain

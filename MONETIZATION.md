# Monetization & Release Strategy

This document captures the plan to take **Evenkeep** from a single-family tool
to a monetizable, publicly-releasable product — and tracks what has been built
so far.

**Name:** Evenkeep (`evenkeep.com`) — chosen for warmth + ownability, a clean
trademark namespace, and to differentiate from the clinical incumbent
(FairSplit). "Even" (fair division) + "keep" (keepsakes) + "even keel" (calm, no
family conflict). Tagline: *"The fair, kind way for families to divide a loved
one's belongings."*

## The product

A private, fair "draft" for dividing a family's belongings: an organizer
photographs each item (with optional audio memories), family members privately
rate and rank what they want via personal links, a draft order is set, and
people take turns picking until everything is distributed — with results export.
Emotionally resonant, single-purpose, and already validated with real families.

## Platform decision: web-first (PWA), not native apps

Stay web-first and ship an installable PWA. Do **not** build native iOS/Android
apps yet.

- Usage is **episodic and link-driven** — a family does this once. Nobody
  installs a store app to pick heirlooms one time.
- Users span generations, including **non-technical elderly parents**. A tapped
  text link that opens instantly beats "download an 80MB app + make an account."
- Native means 3 codebases, app-store review, and Apple/Google taking 15–30% of
  the exact in-app purchase we're monetizing — poor ROI for a low-frequency product.
- The one native advantage (camera capture) already works on the web.

Revisit native only if the product later becomes an *ongoing* "home
inventory / legacy vault" with heavy recurring capture — and even then via
Expo/React Native over the same API.

## Pricing

The payer is the **organizer** (executor, eldest sibling, or increasingly a
parent planning proactively while alive).

- **Per-estate one-time activation** ($79–$199) is the primary model — it matches
  how people mentally budget a one-time life event. (Implemented as the Stripe
  activation gate below.)
- **Freemium funnel:** free to set up, add items, and invite family; pay to run
  the live draft + unlock exports. Captures people once they're invested.
- **B2B / partner channel (scale play):** estate attorneys, financial/legacy
  planners, senior living, hospice, funeral homes — a steady stream of exactly
  these families and the only place recurring revenue really lives.

## Build sequence

- **Phase 0 — Validate.** ✅ Done informally (used with family; inbound interest).
- **Phase 1 — MVP SaaS.** Multi-tenancy, organizer auth, per-estate payment,
  object storage, email invites, PWA, privacy/ToS. ← *in progress (see below)*
- **Phase 2 — Growth.** SMS invites, real-time draft (SSE/websockets),
  appraisal/valuation help, the attorney/funeral-home partner channel, analytics.
- **Phase 3 — Expand.** Proactive "legacy planning while alive" mode; native
  wrapper only if data justifies it.

## What this branch adds (Phase 1 foundation)

Delivered additively so the existing single-family deployment keeps working
unchanged (all legacy data is backfilled into a "default estate" that is marked
active, so it is never blocked by billing):

- **Multi-tenant data model** — new `organizers` and `estates` tables; every
  domain table (`siblings`, `items`, `wishlist_items`, `item_ratings`,
  `family_members`, `family_suggestions`, `draft_state`, `app_settings`) now
  carries an `estate_id`. Additive migrations + backfill in `server/migrate.ts`.
- **Request-scoped tenancy** — `server/tenant.ts` uses `AsyncLocalStorage` so
  every storage read/write is automatically scoped to the current estate without
  threading an id through 120 call sites. `server/auth.ts` resolves the estate
  per request (session → `x-estate-id` header → participant bootstrap path →
  default).
- **Organizer accounts** — email/password (scrypt-hashed) with Postgres-backed
  sessions. `POST /api/auth/signup` creates an estate; `login`, `logout`, `me`.
  Signup/login UI at `/account`. See `server/accounts.ts`.
- **Stripe activation gate (scaffolding)** — `POST /api/billing/checkout`,
  `GET /api/billing/status`, and a signature-verified `POST /api/billing/webhook`.
  Env-gated: entirely inert until `STRIPE_SECRET_KEY` is set. When configured,
  `POST /api/draft/start` requires the estate to be `active`.
- **Client tenant context** — `x-estate-id` sent on every request; the organizer
  sets it at login, participants pick it up from their first loaded entity.

### New environment variables

| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | Signs organizer session cookies (set a long random value in prod) |
| `STRIPE_SECRET_KEY` | Enables billing. Omit to keep billing inert. |
| `STRIPE_WEBHOOK_SECRET` | Verifies Stripe webhook signatures |
| `STRIPE_PRICE_ID` | Optional — a fixed Price to charge (else an inline amount is used) |
| `STRIPE_ACTIVATION_AMOUNT` | Optional — inline activation amount in cents (default `9900`) |

## Recommended next steps (not yet done)

1. ~~**Object storage for media.**~~ ✅ Done — photos/audio now upload directly
   from the browser to Vercel Blob (bypassing the serverless body limit) when
   `BLOB_READ_WRITE_TOKEN` is set, with automatic base64 fallback otherwise;
   existing data-URI records keep serving. Follow-ups: delete orphaned blobs when
   media is replaced/removed, and route the first-run setup hero photo (uploaded
   before an admin PIN exists) through Blob too — it currently stays base64.
2. **Participant onboarding.** ✅ Email invites shipped — organizers add a
   participant's email and send their private `/join` link with one tap (or
   "Invite all"), via Resend, env-gated behind `RESEND_API_KEY`. Still to do:
   SMS invites (Twilio) and a per-estate landing/onboarding polish.
3. **Durable rate limiting.** The current limiter is in-memory and ineffective on
   serverless — move to Postgres/Upstash.
4. **Estate dashboard.** Let an organizer (e.g. an attorney) create and switch
   between multiple estates from the UI (schema already supports it).
5. **Legal/privacy.** Privacy policy, ToS, data-deletion/export, and a clear
   "not legal advice / not a substitute for a will" disclaimer.
6. **Brand rollout.** Name unified to **Evenkeep** across the app. Still to do:
   register `evenkeep.com` + social handles, file the USPTO trademark, and add a
   logo/wordmark (currently a Heart icon + "Evenkeep" text).
7. **Observability.** Sentry + lightweight product analytics.

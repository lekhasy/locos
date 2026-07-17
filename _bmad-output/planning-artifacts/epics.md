---
stepsCompleted: ["1", "2", "3", "4"]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-locos-2026-07-10/prd.md
  - _bmad-output/planning-artifacts/architecture/architecture-locos-2026-07-10/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-locos-2026-07-10/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-locos-2026-07-10/EXPERIENCE.md
---

# locos - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for locos, decomposing the requirements from the PRD, UX Design, and Architecture spine into implementable stories. Phase 1 is the shop-owner posting tool only; the shopper-facing marketplace is Phase 2 and out of scope here.

**Scope of this breakdown: application code that runs locally on a developer machine.** All hosting, deployment, and operator-only provisioning concerns (WSL host provisioning, Caddy TLS, systemd units, host secret provisioning, log scrape pipeline, production backups, environment promotion, operator provisioning tool) are deliberately deferred — they will be addressed in a separate deployment-runbook artifact once the app is running end-to-end on the developer's local machine. The dev seed script substitutes for the operator provisioning tool while local-only.

## Requirements Inventory

### Functional Requirements

- **FR1.** The locos team can manually create a shop account; there is no public self-service signup.
- **FR2.** A shop owner logs in by entering their phone number, receiving a one-time passcode (OTP) via SMS, and entering that OTP.
- **FR3.** A successful login establishes a persistent session so the owner is not forced to re-authenticate on every visit.
- **FR4.** Only accounts provisioned by the locos team can authenticate; an unknown phone number cannot log in or self-register.
- **FR5.** A shop owner can connect one Facebook Page by logging into Facebook and authorizing locos; locos exchanges this for a Page access token and stores it for reuse.
- **FR6.** Connection is a one-time action; subsequent publishes reuse the stored token without re-authorization.
- **FR7.** If the stored token becomes invalid/expired, the owner is prompted to reconnect, and publishing to Facebook is blocked until they do.
- **FR8.** A shop owner can start a new product by uploading a few photos of the item and entering a rough free-text description, optionally including a price.
- **FR9.** From those inputs, locos generates a Vietnamese product title, marketing description, price, and one or more images of a model wearing the product.
- **FR10.** The generated model image must depict the actual uploaded product recognizably (soft target, watched via CM1/CM2).
- **FR11.** Before generating, the owner can select model attributes (gender and style preset).
- **FR12.** The owner can regenerate images; there is no regeneration cap in Phase 1. Regeneration is per-image, not whole-batch.
- **FR13.** The owner can edit the generated title, description, and price before publishing.
- **FR14.** If the owner provided a price in their description, the generated price defaults to it; the owner can always override.
- **FR15.** Publishing a product saves it to the shop's locos catalog.
- **FR16.** Posting to Facebook is a distinct "Post / Republish to Facebook" action, always available on any product. Each use creates a new Facebook post with the product's current content.
- **FR17.** locos never edits or deletes a previously created Facebook post. To reflect an edit on Facebook, the owner republishes.
- **FR18.** Each Facebook post is self-contained: it includes the generated images, the Vietnamese caption (title + description + price), and the shop's contact information.
- **FR19.** Phase-1 Facebook posts carry no locos watermark and no discovery link.
- **FR20.** If a Facebook post fails, the owner is clearly notified and can retry (republish); the product remains in the locos catalog regardless.
- **FR21.** Facebook is the only publish destination in Phase 1.
- **FR22.** A shop owner can view a list of the products they have published.
- **FR23.** A shop owner can edit a product's title, description, price, and images. Edits update the locos catalog record only; existing Facebook posts are untouched, and changes reach Facebook via republish.
- **FR24.** A shop owner can delete a product from their locos catalog (tombstone-on-row; bytes persist for retention window).
- **FR25.** A shop owner can mark a product as sold out (distinct from deleting it). The owner can also delete any single generated image from a product (UX-derived FR-extension, flagged by UX and accepted by Architecture via AD-4).

### NonFunctional Requirements

- **NFR1 — Localization:** The UI and all AI-generated content are in Vietnamese.
- **NFR2 — Responsive web:** The app works on both desktop and mobile browsers, with mobile as a first-class experience.
- **NFR3 — Scale:** System designed to grow to ~5,000 active shops and ~5,000 product publishes/day (design band, not SLA).
- **NFR4 — Generation latency:** AI generation on the order of tens of seconds per generation. No hard cap. Implemented as async jobs.
- **NFR5 — Security:** OTPs and stored Facebook Page tokens are handled and stored securely; tokens are scoped to minimum permissions needed to post to a Page. Phone numbers and OTP codes never stored in locos (handled by Clerk).
- **NFR6 — Reliability of publish:** Transient Facebook or generation failures are surfaced and retryable, never silently dropped.
- **NFR7 — Cost awareness:** AI image/text generation costs are observable via structured event emission; no usage cap in Phase 1.
- **NFR8 — Data handling:** Retention windows, deletion on shop-owner request and account removal, and token revocation when a Page is disconnected — all paths covered (architecture owns specifics; tombstone-on-row for content, revoke for tokens).

### Additional Requirements

(From Architecture Spine — invariants the epics must honor.)

- **AR-1 — Hexagonal core:** Application services and domain entities live in `core/`; they depend only on ports (interface-only). All concrete adapters (Postgres, filesystem, Graphile Worker, Clerk, SMS, FASHN, Gemini, Facebook Graph) live under `adapters/`. No SDK imports in `core/`.
- **AR-2 — Async AI generation:** FASHN and Gemini calls run inside Graphile Worker jobs. The HTTP request returns `{jobId}` immediately; UI polls job status at ≤ 3s interval.
- **AR-3 — FB post = owner-content:** Core exposes exactly one publishing action: `createPost(productId, currentRevisionId)`. No update/delete/edit-post functions anywhere. Post body = images + caption + shop contact only.
- **AR-4 — Content-addressable, shop-namespaced storage:** Storage path shape `originals/{shopId}/{sha256}.{ext}` and `generated/{shopId}/{sha256}.{ext}`. Originals immutable; regen inserts a new row, never mutates. Owner-initiated delete = tombstone-on-row.
- **AR-5 — Multi-tenant from day one:** Every repository method takes `shopId` as a required argument; every Postgres query has `WHERE shop_id = $1`.
- **AR-6 — Generation job idempotency:** `jobKey = hash(shopId, productId, imageIndex, inputFingerprint)` enforced via Graphile Worker's `job_key` column.
- **AR-7 — Auth boundary:** Clerk owns identity via the username+password strategy; locos stores only `clerk_user_id`. No passwords, OTP codes, email addresses, or phone numbers are persisted in locos; no two-step auth UI exists in `/app`. **Two identity surfaces share the Clerk boundary: shop_owner (paired with a `shop` row by `clerk_user_id`) and sales_rep (flagged with `publicMetadata.role = 'sales_rep'`).** Sales reps provision accounts **in-app** at `/rep/shops/new`; the handler calls Clerk `users.createUser` then writes the matching `shop` row. A rep never has a `shop` row; a shop owner never has the rep flag.
- **AR-8 — Encrypted FB Page tokens:** Stored encrypted-at-rest (libsodium secretbox); caller accesses via callback `withDecryptedToken(shopId, pageId, fn)` — decrypted reference never escapes the closure.
- **AR-9 — Cross-unit atomic writes:** Multi-row writes visible to another unit (Next.js ↔ worker) execute inside a single Drizzle transaction. Transient third-party failures emit a retry surface (logged event + UI affordance). `publish_succeeded` only after FB API confirms AND locator persisted in same transaction.
- **AR-10 — Worker-job boundary:** First statement of every worker job handler is `verifyShopActive(shopId)`; exits with `JobError('shop_inactive')` otherwise. Per-job Zod schema for job arguments.
- **AR-11 — FB publish state machine:** `publish_attempt` row written in `state='pending'` before API call → `succeeded` with post id on success → `failed` on permanent error → `unknown` if API call neither succeeded nor definitively failed. `unknown` rows visible to ops; reconciliation strategy deferred.
- **AR-12 — Sales-rep-only account provisioning (no self-signup):** The locos app contains no signup surface, no public signup endpoint, no public surface that accepts new accounts. The rep signs in via the FR2 flow, lands on `/rep/shops`, opens `/rep/shops/new`, fills the five fields (username, password, display name, address, contact phone), and submits. The handler calls Clerk `users.createUser` and writes the matching `shop` row bound by `clerk_user_id`. The rep hands the credentials to the owner via Zalo or in person. *For local dev, the dev seed script creates a dev rep user (flagged with the rep role via Clerk dashboard) and a sample shop, paired with a Clerk dev user, so the rep surface renders with one entry on first dev login.*
- **AR-13 — Counter-metric + success-metric event emission:** Every write path logs the events that feed PRD §3 metrics (`shop_login`, `product_created`, `generation_started`, `generation_completed`, `generation_failed`, `regeneration_requested`, `publish_attempted`, `publish_succeeded`, `publish_failed`, `reconnect_required`, `product_sold_out_toggled`). Never logs PII or token bytes. *Local-only: events log to stdout + local file. Production log scrape is deferred.*
- **AR-14 — Stack:** Node 24 LTS, Next.js 15.x App Router, Postgres 17, Drizzle, Graphile Worker, Clerk (username+password strategy; `clerkClient.users.createUser` exercised by the sales-rep surface), Gemini 3 Pro, FASHN v1.6 via fal.ai, Facebook Graph v25.0, local filesystem storage. No SMS provider — no OTP of any kind. *Hosting layer (Caddy TLS, systemd units, host secrets) deferred.*

### UX Design Requirements

(From DESIGN.md + EXPERIENCE.md — actionable work items the dev agent must build.)

- **UX-DR1 — Design tokens as CSS variables:** Implement the token set declared in `DESIGN.md` (colors, typography, layout/spacing, elevation, shapes, components) as CSS variables in a single root stylesheet. No Tailwind / shadcn / MUI in Phase 1.
- **UX-DR2 — System font stack with Vietnamese diacritic coverage:** Use `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` for body/title; `ui-monospace, "SF Mono", Menlo, Consolas, monospace` for price. No webfonts.
- **UX-DR3 — Mobile-first single-column layout:** Max content width 480px; centered on phone, centered on desktop. 16px gutters. 8px spacing grid.
- **UX-DR4 — Catalog grid breakpoints:** 1 column < 360px; 2 columns at ≥ 360px; 3 columns at ≥ 720px. Never more than 3 columns.
- **UX-DR5 — Button components:** Implement `button-primary` (solid accent, 44px min), `button-secondary` (1px outline), `button-text` (no border, accent text). All text in Vietnamese, noun-first phrasing, no exclamation marks, no emoji.
- **UX-DR6 — Input components:** Implement `input`, `textarea` (auto-grow), `price-input` (numeric font, right-aligned). Focus = 1.5px accent ring, not border color change. 44px height. Max-length enforced for title (80) and description (500).
- **UX-DR7 — Username field:** Single-line input, Vietnamese label "Tên đăng nhập". Min 3 / max 32 chars; allowed characters: a-z, 0-9, `_`, `-`. Autocomplete `username`. Paste-anywhere. ARIA: `aria-label="Tên đăng nhập"` on the input.
- **UX-DR8 — Password field:** Single-line input with masked entry, Vietnamese label "Mật khẩu". Min 8 / max 128 chars. Autocomplete `current-password`. Toggle visibility with a small "Hiện/Ẩn" affordance (icon button, 44×44px tap target). ARIA: `aria-label="Mật khẩu"`.
- **UX-DR9 — Photo tile:** Square `{colors.surface-dim}` tile, 4:5 aspect; dashed border when empty, solid when filled. Tap empty → camera on mobile / file picker on desktop. Tap filled → preview. Long-press filled → drag-reorder. Max 6 tiles. Direct camera access on phones (no library picker first).
- **UX-DR10 — Product card:** Image top with `{rounded.lg}`; status pill bottom-left of image; title `{typography.title}` ellipsised 1 line; price `{typography.numeric}` right-aligned. Sold-out state shows overlay tint + pill.
- **UX-DR11 — Generation tile:** Skeleton box with shimmer (opacity, not transform — safe to disable); descriptor below. Replaced inline when generation finishes.
- **UX-DR12 — Image action overlay:** On hover (desktop) / always-visible on mobile: row of two icon buttons — "Tạo lại" (regenerate) and "Xoá" (delete image). Tap image opens full-screen preview with same actions.
- **UX-DR13 — Status pill:** `{rounded.full}` with surface fill, outline border, label text. Variants: `posted` (success), `sold-out` (gray), `failed` (error). Color always paired with text label.
- **UX-DR14 — Connect FB prompt:** Bottom sheet on mobile, centered dialog on desktop. Used when publish attempted without Page, or when token invalid. Quiet `{status-pill warning}` on top-bar persists until reconnect.
- **UX-DR15 — Empty state:** Centered subtle gray shape (no mascot); `{typography.heading}` title; one `{button-primary}`. Functional, not motivational.
- **UX-DR16 — Bottom action bar:** "Đăng sản phẩm mới" pinned sticky bottom on mobile, top on desktop. Primary action button.
- **UX-DR17 — No nav bar, no bottom tab bar in Phase 1:** Catalog is the only "tab." Settings lives behind avatar menu top-right. Anything outside catalog = modal or full-screen.
- **UX-DR18 — Surface-derived state UI:** Every surface reflects (a) Page-connected state, (b) generation-in-flight state, (c) FB token validity. State surfaced inline, not buried in settings.
- **UX-DR19 — Generation image set semantics:** N generated images per product (default 3, configurable). Per-image regen; text never re-rolled (owner edits inline). Owner can delete any generated image.
- **UX-DR20 — Vietnamese microcopy:** Imperative, noun-first; no exclamation marks; no emoji in UI; VND integer format `350.000₫` via `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })`.
- **UX-DR21 — Accessibility floor:** Tap targets ≥ 44×44px; WCAG AA contrast (ink-primary on surface ≥ 7:1; ink-secondary ≥ 4.5:1); logical tab order; image alt inherits from product title; reduce-motion honored (opacity-only shimmer); focus ring visible.
- **UX-DR22 — Pull-to-refresh on Catalog only.**
- **UX-DR23 — Pinch/double-tap zoom on generated image preview.**
- **UX-DR24 — Bottom sheet on mobile for all confirmations (delete, mark sold out, FB republish); centered dialog on desktop. Cancel = left action; confirm = right primary.**
- **UX-DR25 — Top-bar avatar menu on every authenticated screen (top-right).**

### FR Coverage Map

- FR1: Epic 1 Story 3 — in-app sales-rep provisioning surface
- FR-1a (NEW): Epic 1 Story 3 — rep lists + creates shops (5 fields); both Clerk user and `shop` row bound by `clerk_user_id` in a single handler
- FR2: Epic 1 Story 1 — username + password login via Clerk
- FR3: Epic 1 Story 2 — persistent session
- FR4: Epic 1 Story 3 — provisioned-only enforcement (rep surface writes both the Clerk user and the `shop` row, so the bound-row invariant is enforced at create time)
- FR5: Epic 2 Story 1 — OAuth Page connection
- FR6: Epic 2 Story 2 — token reuse via `withDecryptedToken`
- FR7: Epic 2 Story 3 — token expiry + reconnect prompt
- FR8: Epic 3 Story 1 — new product start (photos + description)
- FR9: Epic 3 Story 3 — generation triggers Vietnamese title/description/price/images
- FR10: Epic 3 Story 3 — generation includes model-wearing image (soft target, watched via CM1/CM2)
- FR11: Epic 3 Story 2 — model attribute selection
- FR12: Epic 3 Story 4 — per-image regeneration
- FR13: Epic 3 Story 4 — edit generated title/description/price
- FR14: Epic 3 Story 5 — price default from description
- FR15: Epic 4 Story 1 — publish to locos catalog
- FR16: Epic 4 Story 3 — republish always available
- FR17: Epic 4 Story 2 — create new post (never edit/delete)
- FR18: Epic 4 Story 2 — self-contained post body (images + caption + contact)
- FR19: Epic 4 Story 2 — no watermark / no discovery link
- FR20: Epic 4 Story 4 — failure handling + retry
- FR21: Epic 4 Story 2 — Facebook is only destination
- FR22: Epic 5 Story 1 — catalog list
- FR23: Epic 5 Story 3 — edit product (catalog only; FB via republish)
- FR24: Epic 5 Story 5 — delete product (tombstone-on-row)
- FR25: Epic 5 Story 4 — mark sold out + Epic 3 Story 4 — delete generated image

## Epic List

### Epic 1: Authentication & Account Access
A provisioned shop owner can open locos, log in with their username + password, and stay signed in across sessions. Unknown usernames cannot log in; no self-signup surface exists in the app. Sales reps provision accounts out-of-band via Clerk dashboard; the locos app contains no signup form.

**FRs covered:** FR1, FR2, FR3, FR4
**NFRs:** NFR5 (security boundary)
**ARs:** AR-1 (hexagonal), AR-5 (multi-tenant), AR-7 (Clerk-owned auth), AR-12 (sales-rep-only provisioning), AR-13 (logger + event emitter)
**UX-DRs:** UX-DR1-4 (tokens, typography, layout, grid), UX-DR6 (input), UX-DR7 (username field), UX-DR8 (password field), UX-DR20 (microcopy)

### Epic 2: Facebook Page Connection
A logged-in shop owner can connect their Facebook Page once; the connection persists; if the token expires, they're prompted to reconnect before publishing to Facebook.

**FRs covered:** FR5, FR6, FR7
**NFRs:** NFR5 (token security), NFR8 (token revocation path)
**ARs:** AR-1, AR-5, AR-8 (encrypted-at-rest tokens)
**UX-DRs:** UX-DR14 (connect-fb-prompt), UX-DR18 (surface-derived state)

### Epic 3: Product Creation & AI Generation
A shop owner with photos + a rough description gets a finished listing — Vietnamese title, marketing copy, price, and model-wearing images — and can refine it (regenerate per-image, edit text inline, delete unwanted images) before saving.

**FRs covered:** FR8, FR9, FR10, FR11, FR12, FR13, FR14
**NFRs:** NFR4 (async latency), NFR6 (generation retry), NFR7 (cost observability)
**ARs:** AR-1, AR-2, AR-4, AR-5, AR-6, AR-9, AR-10, AR-13
**UX-DRs:** UX-DR9 (photo-tile), UX-DR11 (generation-tile), UX-DR12 (image-action-overlay), UX-DR19 (image-set semantics), UX-DR22, UX-DR23

### Epic 4: Publishing to Facebook
A finished product can be saved to the locos catalog, then posted (and later republished) to the shop's Facebook Page as a self-contained post. Transient failures are surfaced and retryable.

**FRs covered:** FR15, FR16, FR17, FR18, FR19, FR20, FR21
**NFRs:** NFR6 (resilience)
**ARs:** AR-1, AR-3, AR-5, AR-8, AR-9, AR-11
**UX-DRs:** UX-DR13 (status-pill)

### Epic 5: Catalog Management
A shop owner can browse, edit, delete, and mark sold-out their products in the locos catalog. Sold-out state is visible everywhere. Edits update the locos catalog only; existing Facebook posts are unchanged (reach FB via republish).

**FRs covered:** FR22, FR23, FR24, FR25
**NFRs:** NFR8 (data handling)
**ARs:** AR-1, AR-4, AR-5
**UX-DRs:** UX-DR10 (product-card), UX-DR15 (empty-state), UX-DR24 (confirmation bottom sheet)

---

## Epic 1: Authentication & Account Access

A provisioned shop owner can open locos on their local machine, log in with their username + password, and stay signed in across sessions. Unknown usernames cannot log in. The dev seed creates the dev shop row directly while running locally.

### Story 1.0: Local development setup

As a developer running locos locally,
I want a one-command path that bootstraps Postgres, migrations, env, and a seeded dev shop,
So that I can run the app on my machine and log in as a known user.

**Acceptance Criteria:**

**Given** the repo is cloned and Node 24 + Postgres 17 are available
**When** I run `npm install && npm run db:migrate && npm run db:seed && npm run dev`
**Then** the Next.js app starts at http://localhost:3000
**And** a `.env.example` documents every required env var (Clerk publishable + secret keys, FASHN key, Gemini key, Facebook dev app credentials, host secret for token envelope encryption, DB URL)
**And** `env.ts` Zod-validates all env vars at boot; missing/invalid vars crash the process with a clear message before any work begins
**And** `npm run worker` starts the Graphile Worker process in a separate terminal
**And** the dev seed inserts: one `shop` row linked to a Clerk dev user, one encrypted `page_token` row for a dev Facebook Page, one sample `product` row with photos and a generated image reference
**And** pino logs go to stdout in dev
**And** a README documents: starting Postgres locally, creating a Clerk dev app, getting FASHN/Gemini test keys, setting up a FB dev app, and the dev login phone number

### Story 1.1: Username + password login (Clerk, sales-rep-provisioned)

As a provisioned shop owner,
I want to log in with the username and password my sales rep gave me,
So that I can access the locos catalog without dealing with OTPs, magic links, or any phone-based step.

**Acceptance Criteria:**

**Given** an unauthenticated user opens the app
**When** they land on `/login`
**Then** they see a single sign-in form with two fields — `Tên đăng nhập` (username) and `Mật khẩu` (password) — and a primary submit button labeled `Đăng nhập`
**And** the form is the only auth-related UI on the page (no OTP cells, no phone-input, no "resend" affordance, no second step)
**When** they submit a valid username + password
**Then** Clerk authenticates via the `username` strategy and sets an HTTP-only session cookie
**And** the user is authenticated and redirected to `/catalog`
**And** a `shop_login` event is emitted (AR-13)
**When** they submit invalid credentials
**Then** the user sees a single generic localized error "Sai tên đăng nhập hoặc mật khẩu"
**And** the error message **never** reveals whether the username or the password was the wrong one
**And** submitting again from the same form is allowed without any cooldown
**And** there is **no** `/login/otp` route and **no** two-step auth flow anywhere in `/app`

**Out of scope (Story 1.1):** self-signup, password reset, first-login forced password change, any email/phone verification, any OTP flow.

### Story 1.2: Persistent session

As an authenticated shop owner,
I want my session to persist across visits,
So that I do not have to re-enter my credentials every time I open the app.

**Acceptance Criteria:**

**Given** an authenticated user closes the app
**When** they reopen it within 30 days of inactivity
**Then** they land on `/catalog` without re-authenticating
**And** the Clerk session token is validated server-side on every request
**When** the session has been inactive for more than 30 days
**Then** the next request redirects to `/login`
**And** logging out from the avatar menu clears the Clerk session immediately

### Story 1.3: In-app sales-rep provisioning

As a sales rep at the locos parent business,
I want a `/rep/shops` surface where I can see every shop I've provisioned and create a new one — capturing the username and password along with the shop's display name, address, and contact phone,
So that the shop owner only has to remember a username and password, never does account setup, and I hand them a complete account ready for product work.

**Acceptance Criteria:**

**Given** a Clerk user whose `publicMetadata.role === 'sales_rep'` signs in via `/login`
**When** the auth surface resolves the role
**Then** the rep lands on `/rep/shops`, **not** `/catalog`
**And** a shop owner with no rep flag continues to land on `/catalog`
**And** the boundary is enforced at the route shell — `/rep/(.*)` is reachable only by reps; anyone else is redirected to `/catalog` (shop owner) or `/login` (unauthenticated).

**Given** the rep opens `/rep/shops`
**When** the list surface renders
**Then** every active (non-tombstoned) `shop` row appears, sorted by `created_at DESC`
**And** each row shows `display_name` and creation date in Vietnamese format
**And** a "Tạo shop mới" button links to `/rep/shops/new`
**And** an empty list shows the standard empty state (UX-DR15) with one primary CTA "Tạo shop đầu tiên".

**Given** the rep is on `/rep/shops/new`
**When** the form renders
**Then** it is a two-step wizard:
- **Step 1 — Clerk user:** `Tên đăng nhập` (matching UX-DR7: 3–32 chars, `[a-zA-Z0-9_-]+`) and `Mật khẩu` (matching UX-DR8: 8–128 chars, with a Hiện/Ẩn visibility toggle).
- **Step 2 — Shop details:** `Tên cửa hàng` (display name, 1–80 chars, required), `Địa chỉ` (address, ≤ 200 chars, optional — empty string accepted), `Số điện thoại liên hệ` (contact phone, ≤ 32 chars, optional — empty string accepted).

**Given** the rep submits the form with valid inputs
**When** the server action runs
**Then** `createShopAction` first calls `clerkClient.users.createUser({ username, password })` (Clerk server SDK)
**And** on `createUser` success, writes the matching `shop` row (`id = cuid2`, `clerk_user_id = clerkUser.id`, `display_name`, `address`, `contact_phone`, `created_at`) bound by `clerk_user_id`
**And** both writes happen in the same handler; the Postgres insert follows immediately on `createUser` success
**And** on full success, the rep is redirected to `/rep/shops/{shopId}` and the list view refreshes on next visit.

**Given** `clerkClient.users.createUser` succeeds but the Postgres insert fails (network blip, validation, etc.)
**When** the rep sees the result
**Then** the form renders an inline banner: "Đã tạo tài khoản ở Clerk nhưng ghi shop thất bại. Vui lòng thử lại với tên đăng nhập khác hoặc liên hệ kỹ thuật để dọn tài khoản."
**And** no `shop` row exists; the orphan Clerk user is visible to ops via Clerk dashboard.

**Given** Clerk rejects the create (e.g. `form_username_exists`, `form_param_format_invalid`)
**When** the rep sees the result
**Then** the form surfaces a localized error from `adapters/clerk/sign-in-error-mapping.ts` adapted to `createUser` errors
**And** no `shop` row is written when `createUser` fails.

**Given** the implementation as a whole
**When** the build is checked
**Then** `core/rep/` never imports from `@clerk/nextjs` — `RepPort` is injected (AD-1); role detection lives in `adapters/clerk/rep.ts`
**And** the `shop` table migration adds `display_name text NOT NULL DEFAULT ''`, `address text NOT NULL DEFAULT ''`, `contact_phone text NOT NULL DEFAULT ''`
**And** the dev seed inserts a non-empty `display_name` for the dev shop
**And** the AD-1 grep guard passes: `grep -rE "from '@clerk|from 'drizzle" core/` returns empty
**And** Story 1.1's `/pending-provisioning` placeholder is **retired** in this story's cleanup step (file removed; middleware matcher no longer references it)
**And** `npm test`, `npm run typecheck`, `npm run lint` are green.

**Out of scope (Story 1.3):**

- Rep edit / disable / archive shops (deferred — no follow-up needed at MVP volume).
- Programmatic `publicMetadata.role = 'sales_rep'` setter (deferred — today = Clerk dashboard).
- Rep-side observer views (catalog listings, generation queues). Rep never accesses shop-owner surfaces.
- OQ4 admin view closure — deferred to Story 1.3 review.

---

## Epic 2: Facebook Page Connection

A logged-in shop owner can connect their Facebook Page once; the connection persists; if the token expires, they are prompted to reconnect before publishing.

### Story 2.1: First-time OAuth Page connection

As a logged-in shop owner,
I want to connect my Facebook Page once via OAuth,
So that locos can post to my Page without me re-authorizing every time.

**Acceptance Criteria:**

**Given** an authenticated shop owner with no connected Page
**When** they tap "Kết nối Facebook" from the catalog surface or a `connect-fb-prompt`
**Then** they are redirected to Facebook OAuth
**When** Facebook redirects back with an authorization code
**Then** the callback exchanges the code for a Page access token via Clerk
**And** the token is stored encrypted at rest via `ports/PageTokenRepository.store(shopId, pageId, token, scope, expiresAt)` using libsodium secretbox with the host secret (AR-8)
**And** the user is returned to the surface they came from
**And** the catalog surface reflects `page_connected = true`

### Story 2.2: Token reuse at publish time

As a shop with a connected Page,
I want locos to reuse my stored token without re-prompting me,
So that I can publish quickly every time.

**Acceptance Criteria:**

**Given** a shop with an encrypted stored token
**When** the owner publishes a product to Facebook
**Then** the Facebook adapter calls `withDecryptedToken(shopId, pageId, fn)` and the closure receives the plaintext token
**And** the decrypted token reference never escapes the closure (no return value or log carries it)
**And** the publish proceeds without a re-authorization prompt
**And** no caller anywhere in `core/` holds a decrypted token reference

### Story 2.3: Token expiry detection and reconnect prompt

As a shop whose Facebook token has expired,
I want to be prompted clearly to reconnect before I can publish,
So that I know exactly what to do and don't lose work.

**Acceptance Criteria:**

**Given** a shop with an expired or invalid Page token
**When** the owner attempts to publish to Facebook
**Then** the FB API call fails with a token-expired error mapped to a `FacebookGraphError`
**And** the `connect-fb-prompt` bottom sheet appears: "Kết nối Facebook đã hết hạn — kết nối lại ngay?" (UX-DR14)
**And** a quiet `{status-pill warning}` appears on the top-bar until the owner reconnects (UX-DR18)
**When** the owner confirms reconnect
**Then** the OAuth flow runs and a new encrypted token replaces the old one
**And** the warning status-pill clears
**And** the next publish attempt uses the new token

---

## Epic 3: Product Creation & AI Generation

A shop owner with photos + a rough description gets a finished listing — Vietnamese title, marketing copy, price, and model-wearing images — and can refine it (regenerate per-image, edit text inline, delete unwanted images) before saving.

### Story 3.1: New product start (photos + description)

As a shop owner starting a new product,
I want to photograph the item and type a rough description on the same screen,
So that I can capture everything in one session without juggling inputs.

**Acceptance Criteria:**

**Given** the owner taps "Đăng sản phẩm mới" on the catalog
**When** the new-product screen loads
**Then** they see six empty `photo-tile` slots (4:5 aspect) and a `description-input` textarea below
**And** tapping an empty tile opens the device camera directly on mobile, or the system file picker on desktop (no "Pick from library" picker first)
**And** long-pressing a filled tile enables drag-reorder (UX-DR9)
**And** attempting to add a 7th photo shows "Tối đa 6 ảnh"
**And** photos are uploaded to the local filesystem at `originals/{shopId}/{sha256}.{ext}` (AR-4) via the storage adapter
**And** the description textarea accepts free-form Vietnamese text with a placeholder example

### Story 3.2: Model attribute selection

As a shop owner about to generate images,
I want to pick the model's gender and style preset,
So that the generated model matches the vibe of my shop.

**Acceptance Criteria:**

**Given** the owner has at least one photo + a description
**When** they advance to the attribute step
**Then** they see two inline selects (UX-DR `attribute-row`): gender (Nữ / Nam) and style preset (Casual / Chic / Thời thượng / Tối giản)
**And** values are local-only (no fetch)
**And** the "Tạo ảnh" button is disabled until both are selected

### Story 3.3: Trigger generation (async)

As a shop owner ready to generate,
I want generation to start immediately and show progress on the same screen,
So that I can keep editing inputs or just watch the results arrive.

**Acceptance Criteria:**

**Given** the owner has photos + description + attributes
**When** they tap "Tạo ảnh"
**Then** an HTTP POST creates a generation job in Graphile Worker; the client receives `{jobId}` within 2 seconds (AR-2)
**And** three `generation-tile` skeletons appear below with descriptors "Đang tạo ảnh 1/3…", "Đang tạo ảnh 2/3…", "Đang tạo ảnh 3/3…" (UX-DR11)
**And** the UI polls `/api/jobs/{jobId}` every ≤ 3 seconds
**And** each per-image job carries `jobKey = hash(shopId, productId, imageIndex, inputFingerprint)` and Graphile Worker enforces single-instance-on-key (AR-6)
**And** the first statement of the job handler is `verifyShopActive(shopId)` (AR-10)
**And** `generation_started`, `generation_completed`, and `generation_failed` events are emitted (AR-13)
**And** on total failure, all tiles error and the generation panel collapses to a single "Tạo lại" message (UX Flow 1 failure path)

### Story 3.4: Generation result and inline edits

As a shop owner with finished generated images,
I want to edit the title, description, and price, regenerate any single image, and delete any image I don't like,
So that the final listing is exactly what I want to post.

**Acceptance Criteria:**

**Given** generation finishes for at least one image
**When** a tile finishes
**Then** the skeleton is replaced by the generated image inline
**And** `editable-title` (max 80 chars), `editable-description` (max 500 chars), and `editable-price` appear below the strip
**And** each generated image has an `image-action-overlay` with "Tạo lại" and "Xoá" buttons (UX-DR12)
**When** the owner taps "Tạo lại" on an image
**Then** a new job is enqueued with the same `jobKey` and that single image re-rolls; the other images are untouched (UX-DR19)
**And** text is never re-rolled — only the image bytes change
**When** the owner taps "Xoá" on a generated image
**Then** the row is tombstoned (`deleted_at` set); the bytes persist for the retention window (AR-4)
**And** `regeneration_requested` and image-delete events are emitted

### Story 3.5: Price default from owner description

As a shop owner who typed a price in my description,
I want the editable price to default to that value,
So that I do not retype it.

**Acceptance Criteria:**

**Given** the owner typed a VND amount in the description (e.g. "váy linen, 350k" or "áo 350.000đ" or "350000")
**When** generation finishes and the editable-price renders
**Then** it defaults to the parsed integer (e.g. `350000`)
**And** it displays in Vietnamese currency format `350.000₫` via `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })`
**And** the owner can override the value
**And** if the description had no parseable price, the field is empty (publish stays disabled until filled)

---

## Epic 4: Publishing to Facebook

A finished product can be saved to the locos catalog, then posted (and later republished) to the shop's Facebook Page as a self-contained post. Transient failures are surfaced and retryable.

### Story 4.1: Publish to locos catalog

As a shop owner with a finished product,
I want to save it to my locos catalog,
So that it is recorded in my shop regardless of any Facebook outcome.

**Acceptance Criteria:**

**Given** the owner has finished generation (at least one generated image) and valid title/description/price
**When** they tap "Đăng sản phẩm"
**Then** the product row + all generated image rows are inserted in a single Drizzle transaction (AR-9)
**And** they land on `/products/{id}` (Product Detail)
**And** the locos catalog publish succeeds even if Facebook is not connected
**And** a `product_created` event is emitted

### Story 4.2: Post to Facebook (create new post)

As a shop owner with a published product and a connected Page,
I want to post it to my Facebook Page as a self-contained post,
So that shoppers can see and contact me without leaving Facebook.

**Acceptance Criteria:**

**Given** a published product and a connected Page with a valid token
**When** the owner taps "Đăng lên Facebook"
**Then** a `publish_attempt` row is written with `state='pending'` BEFORE the FB API call (AR-11)
**And** the Facebook adapter calls `withDecryptedToken` to materialize the token only inside the API-call closure (AR-8)
**And** the FB Graph API is called with the product's images, Vietnamese caption (title + description + price), and the shop's contact info
**And** the post body contains NO locos URL, NO watermark, NO discovery CTA (FR19; AR-3)
**And** `publish_succeeded` is logged AND the `publish_attempt` row transitions to `state='succeeded'` with the FB post id — both in the same transaction as the API success response
**And** on permanent failure: `state='failed'` with error envelope + `publish_failed` event + button restore + `{status-pill failed}` on the surface
**And** on indeterminate: `state='unknown'` + `publish_failed` event (visible to ops for reconciliation; reconciliation strategy itself is deferred)

### Story 4.3: Republish always available

As a shop owner with an updated product,
I want to post it to Facebook again whenever I want,
So that shoppers see the latest price or copy without me having to edit a previous post.

**Acceptance Criteria:**

**Given** any product in the catalog (whether previously posted or not)
**When** the owner taps "Đăng lại lên Facebook" on Product Detail
**Then** a new FB post is created with the product's current content
**And** no `updateFbPost`, `deleteFbPost`, or `editFbPost` function exists in the codebase — verified by a grep test in CI (FR17; AR-3)
**And** each republish creates a new `publish_attempt` row and a new FB post id
**And** prior FB posts remain untouched

### Story 4.4: Failure handling and retry surface

As a shop owner whose FB publish just failed,
I want a clear retry affordance and confirmation that my catalog product is safe,
So that I can recover without losing work.

**Acceptance Criteria:**

**Given** a publish attempt that ended in `state='failed'` or `state='unknown'`
**When** the owner views the product
**Then** the "Đăng lên Facebook" button restores (no spinner)
**And** a `{status-pill failed}` appears on the surface with the structured error reason
**And** an explicit "Đăng lại" affordance stays enabled (UX Flow 1 failure path)
**When** the owner taps "Đăng lại"
**Then** a new publish_attempt row is created and the FB API is called again
**And** the locos catalog row remains unchanged regardless of FB outcome
**And** `reconnect_required` event is emitted when the failure was due to token expiry (drives UX Flow 3)

---

## Epic 5: Catalog Management

A shop owner can browse, edit, delete, and mark sold-out their products in the locos catalog. Sold-out state is visible everywhere. Edits update the locos catalog only; existing Facebook posts are unchanged (reach FB via republish).

### Story 5.1: Catalog list

As an authenticated shop owner,
I want to see my published products as a grid on the catalog,
So that I can scan and pick one to manage.

**Acceptance Criteria:**

**Given** an authenticated shop owner with at least one published product
**When** they open the app or `/catalog`
**Then** products render as `product-card` tiles in a responsive grid: 1 column < 360px, 2 columns ≥ 360px, 3 columns ≥ 720px (UX-DR4)
**And** sold-out products show a `{colors.sold-out}` overlay tint and `{status-pill sold-out}` (UX-DR10)
**And** pull-to-refresh on mobile fetches the newest products (UX-DR22)
**Given** a shop with zero products
**When** they open `/catalog`
**Then** they see the empty state with a "Đăng sản phẩm đầu tiên" CTA (UX-DR15)

### Story 5.2: Product detail view

As a shop owner who tapped a product card,
I want to see the product image-led with status pill, title, and price, and an action surface,
So that I can decide what to do with it.

**Acceptance Criteria:**

**Given** the owner taps a product card
**When** Product Detail loads at `/products/{id}`
**Then** the largest image is shown with a `{status-pill}` overlay (posted / sold-out / failed) (UX-DR13)
**And** title and price render below the image
**And** the action surface exposes: "Chỉnh sửa", "Đăng lại lên Facebook", "Đánh dấu hết hàng" (toggle label), "Xoá"
**And** the page reflects the shop's Page-connection state via surface-derived UI (UX-DR18)

### Story 5.3: Edit product

As a shop owner on Product Detail,
I want to edit the title, description, price, and images,
So that my catalog reflects updated information.

**Acceptance Criteria:**

**Given** the owner taps "Chỉnh sửa" on Product Detail
**When** the edit surface renders
**Then** title, description, price, and image set are editable
**When** they save
**Then** the catalog row updates atomically (AR-9)
**And** existing FB posts are untouched (verified by code-level guarantee: no update/delete FB post functions exist)
**And** reaching FB with the new content requires "Đăng lại lên Facebook"

### Story 5.4: Sold-out toggle

As a shop owner with a product that sold out,
I want to mark it sold out,
So that future shoppers see the right state and I can unmark when stock returns.

**Acceptance Criteria:**

**Given** the owner taps "Đánh dấu hết hàng" on Product Detail
**When** the bottom sheet appears
**Then** it reads "Đánh dấu sản phẩm này là hết hàng?" with cancel (left) + confirm (right primary) (UX-DR24)
**When** the owner confirms
**Then** the sold-out state persists immediately
**And** the product card in `/catalog` shows the sold-out overlay tint and pill
**And** a `product_sold_out_toggled` event is emitted
**And** tapping the toggle again unmarks (label flips to "Còn hàng"); no confirmation bottom sheet for unmark

### Story 5.5: Delete product

As a shop owner with a product I no longer want in my catalog,
I want to delete it,
So that it no longer appears in my catalog (existing FB posts are not affected).

**Acceptance Criteria:**

**Given** the owner taps "Xoá" on Product Detail
**When** the bottom sheet appears
**Then** it reads "Xoá sản phẩm này?" with cancel (left) + confirm (right primary) (UX-DR24)
**When** the owner confirms
**Then** the product row is tombstoned (`deleted_at` set); bytes persist for the retention window (AR-4; NFR8)
**And** the product disappears from `/catalog`
**And** existing FB posts remain untouched (FR17)
**And** the owner is returned to `/catalog`
# Sprint Change Proposal — 2026-07-16 (Revision B)

**Subject:** Switch Story 1.1 login from email+OTP → username+password (manually provisioned by sales reps)

**Trigger:** Epic 1, Story 1.1 (mid-implementation, third revision)
**Change scope:** Minor
**Author:** Correct Course workflow (Developer)
**Status:** Awaiting user approval

---

## 1. Issue Summary

### Problem Statement

The originally-planned username+password-less flow (phone+OTP) was rejected because Clerk Free tier doesn't include phone auth. Revision A (email+OTP on Clerk) avoided the vendor change but still relied on OTP — which the target audience (Vietnamese shop owners) distrusts due to widespread phone-based scam culture, and which is friction-heavy for low-tech users.

### Revised approach (this proposal)

Use **Clerk username + password**. Clerk Free tier supports the `username` strategy out of the box, no email/phone verification required. No OTP code path anywhere in the stack.

Accounts are **created by sales reps**, not self-serve. Operator onboarding becomes a sales-rep workflow: rep creates the user in Clerk dashboard (or programmatically via Clerk Backend API), hands the username + a one-time password to the shop owner out-of-band (typically via Zalo message or in person), owner logs in and changes the password on first use (Story 1.4 followup, optional).

Auth boundary (AD-7) is unchanged in shape: Clerk still owns identity, locos still stores only `clerk_user_id`. The driving adapter shrinks — no OTP verification path.

### What stays dormant

Per earlier instructions, the **phone-OTP code paths** added in Story 1.1 v1 remain in the repo (`PhoneForm.tsx`, phone variants in `sign-in-client.ts` / `ports/sign-in.ts`, `tests/phone-schema.test.ts`, `OtpForm.tsx`) — they are not wired into any UI route. The **email-OTP additions** proposed in Revision A are **not made** in this revision (no shipped email-OTP code to clean up).

### Triggering research

None. Same vendor as Story 1.0; same boundary shape; no new external services.

---

## 2. Impact Analysis

### 2.1 Epic Impact

| Epic | Affected? | Notes |
|---|---|---|
| Epic 1 | **Story 1.1 full rewrite; Story 1.3 reword** | Story 1.2 unchanged |
| Epic 2 and beyond | No | Consume `getCurrentShop()` — interface stable |

The Epic 1 goal ("a Vietnamese shop owner can authenticate and access a persistent session keyed to a pre-provisioned shop") is **still achievable** — only the identifier type and mechanism change.

### 2.2 Story Impact

| Story | Action | Reason |
|---|---|---|
| 1.1 — Login | **Full rewrite** | Was phone+OTP, was email+OTP (Rev A), now username+password |
| 1.2 — Persistent session | **Unchanged** | Clerk cookie session is strategy-agnostic |
| 1.3 — Provisioned-only enforcement | **Targeted reword** | "Email allowlist" → "every Clerk user maps to one locos shop row by `clerk_user_id`"; provisioning moves to a sales-rep workflow outside the app |

### 2.3 Artifact Conflicts

#### PRD — `prds/prd-locos-2026-07-10/prd.md`

| Section | Change |
|---|---|
| FR2 | "Email + OTP via Clerk transactional email" → "Username + password via Clerk. No self-signup; accounts provisioned manually by sales reps." |
| FR3 | Unchanged — Clerk cookie session |
| FR4 | "Email allowlist matches provisioned shop" → "Every Clerk user maps to exactly one row in `shop` by `clerk_user_id`; provisioning is a sales-rep operation outside the app" |
| NFR5 | "Phone numbers and OTP codes never persist in locos (handled by Clerk)" → "No auth secrets in locos — Clerk owns credentials; `clerk_user_id` is the only identity column in the locos DB" |
| Dependencies | Drop the "SMS/OTP provider for Vietnamese mobile numbers" entry; Clerk Free tier covers username+password |
| Risks | Remove "SMS deliverability gates login" / "ZBS template approval lead time"; add "password handoff between sales rep and shop owner is an operational reality — document secure-handling guidance in a RUNBOOK or operator README" (low-risk) |

#### Architecture — `architecture/architecture-locos-2026-07-10/ARCHITECTURE-SPINE.md`

| Section (line) | Change |
|---|---|
| AD-7 (lines 123–127) | Minor wording tweak: "Clerk owns identity via the **username + password** strategy; locos stores only `clerk_user_id`. No OTP, email verification, or phone verification is used." |
| AD-10 (line 159) | Unchanged |
| Capability Map row for FR2 (line 299) | Unchanged in shape — `app/(auth)/* → adapters/clerk/auth.ts → Clerk`; only the Clerk strategy parameter shifts to `username` |
| Stack (lines 193–194) | Unchanged (still Clerk) |
| Mermaid diagram | Unchanged |
| Structural Seed | Unchanged |
| Deferred (line 318) | Unchanged |

#### Epics — `epics.md`

| Section (line) | Change |
|---|---|
| AR-7 (line 69) | Minor reword — remove phone-number/OTP non-storage clauses; add "credentials handled by Clerk; no auth secrets in locos DB" |
| AR-14 (line 76) | Unchanged |
| Story 1.1 (lines 202–223) | **Full rewrite** — see §4.1 (Story 1.1 v3) |
| Story 1.2 (lines 225–239) | Unchanged |
| Story 1.3 (lines 241–254) | Targeted reword — see §4.2 |

### 2.4 Open Items

None blocking. Story 1.0's Clerk setup is fully reusable.

Optional follow-up (not in this proposal): first-login forced password-change flow (Story 1.4 candidate) so the sales rep's initial password does not linger. Low priority for MVP — sales-rep handoff can be operational.

---

## 3. Recommended Approach

**Option 1 — Direct Adjustment.** Replace Story 1.1 (and the Rev A email-OTP variants that were about to be added) with username+password. No new ports, no migrations, no vendor changes.

**Why this option:**

- Same vendor (Clerk). Same boundary (AD-7). Same middleware (`clerkMiddleware`). Only the Clerk `strategy` parameter shifts.
- Auth surface shrinks: no `requestOtp` / `verifyOtp` pair — just `signIn(username, password)`.
- Manual provisioning is feasible at MVP scale and matches the operational reality (sales reps handle a small client base).
- Rollback (Option 2) and MVP Review (Option 3) are unnecessary — no scope change, just identifier and mechanism.

**Effort estimate:** Low. **Risk level:** Low.

---

## 4. Detailed Change Proposals

### 4.1 Story 1.1 v3 (full rewrite)

> **Story 1.1 — Username + password login (Clerk, manually provisioned)**

**As a** Vietnamese shop owner whose sales rep has created an account for me
**I want** to enter my username and password on `/login` and land on my shop dashboard
**So that** I can manage my catalog without OTP, magic links, or any phone-based step

**Acceptance Criteria:**

1. Visiting `/login` while signed out shows a `LoginForm` with two fields: `Tên đăng nhập` (username) and `Mật khẩu` (password), with a primary submit button labeled `Đăng nhập`.
2. Submitting a valid username + password calls Clerk's `signIn.create({ strategy: 'username', identifier: username, password })` from the browser via the existing `useSignIn()` hook; loading and error states are reflected in the UI.
3. On success, Clerk sets an HTTP-only session cookie that persists across tabs and browser restarts for 7 days; the user is redirected to `/dashboard/<shopSlug>` where `<shopSlug>` is resolved by mapping the Clerk `userId` to a row in the locos `shop` table via `clerk_user_id`.
4. Invalid credentials surface a single generic localized error ("Sai tên đăng nhập hoặc mật khẩu") — **never** reveal whether the username or the password was wrong; this mapping lives in `adapters/clerk/sign-in-error-mapping.ts`.
5. Server-rendered routes under `app/(auth)` redirect authenticated users to `/dashboard` via `clerkMiddleware` (existing setup from Story 1.0, unchanged).
6. **There is no `/login/otp` route** — the two-step identifier-then-OTP flow is gone. The route file is removed; `OtpForm.tsx` stays in the repo as dormant code.
7. **Phone-OTP code paths stay dormant**: `PhoneForm.tsx`, phone variants in `adapters/clerk/sign-in-client.ts`, phone variants in `ports/sign-in.ts`, `tests/phone-schema.test.ts` remain in the repo unmodified and are not imported by any UI route.
8. **No self-signup.** There is no `/sign-up` route and no UI affordance to create an account from inside the app. Sales reps create accounts via Clerk dashboard (operational practice, documented in `RUNBOOK.md` or operator README outside the app scope).

**Implementation sequence (handoff to Developer):**

1. In `adapters/clerk/sign-in-client.ts`, add `signInWithCredentials(username, password)` calling `signIn.create({ strategy: 'username', identifier: username, password })`. Phone methods (`requestPhoneOtp`, `verifyPhoneOtp`) stay dormant.
2. In `adapters/clerk/sign-in-error-mapping.ts`, add mappings for Clerk username/password errors to a single generic localized message: `form_password_incorrect`, `form_identifier_not_found`, `could_not_find_user`, `invalid_credentials` → all map to `"Sai tên đăng nhập hoặc mật khẩu"`.
3. In `ports/sign-in.ts`, add `signIn({ username, password })` (replacing the email variants proposed in Rev A — those are not added). Phone variants stay dormant.
4. Add `app/(auth)/login/LoginForm.tsx` — a simple two-field form, Vietnamese labels, submit loading state, error display, keyboard-friendly (Enter to submit).
5. In `app/(auth)/login/page.tsx`, render `<LoginForm />` (no longer `<PhoneForm />`).
6. Delete `app/(auth)/login/otp/page.tsx` and `app/(auth)/login/otp/OtpForm.tsx` — or keep `OtpForm.tsx` in repo dormant; preferred: remove `otp/page.tsx` because routing structure is no longer two-step.
7. Keep `PhoneForm.tsx` in repo unmodified (dormant), per Rev A instruction.
8. Add `tests/credentials-schema.test.ts` covering the username + password Zod schema (username: 3–32 chars, alphanumeric + `_-`; password: 8–128 chars, no composition rules).
9. Keep `tests/phone-schema.test.ts` covering the dormant phone-schema code path; keep `tests/sign-in-error-mapping.test.ts` and add coverage for the new username/password error mappings.
10. Document operator onboarding in `RUNBOOK.md` or operator README: "Sales rep creates a Clerk user via Clerk dashboard. Rep hands the username + temporary password to the shop owner out-of-band (typically via Zalo or in person). Shop owner logs in via `/login`."

**Out of scope for Story 1.1 v3:**

- Self-signup / `/sign-up`.
- Password reset / forgot-password flow (sales rep can issue a new temp password via Clerk dashboard instead).
- First-login forced password change.
- Email or phone verification of any kind.
- OTP of any kind.

---

### 4.2 Story 1.3 — Targeted Reword

**Section:** Story 1.3, Acceptance Criteria (line 241–254)

| AC | OLD | NEW |
|---|---|---|
| AC1 | "Clerk `allowlist` contains only the **emails** of provisioned shops…" | "Every Clerk user corresponds to exactly one row in the locos `shop` table matched by `clerk_user_id`; a logged-in Clerk user that does **not** resolve to a `shop` row is redirected to `/pending-provisioning`." |
| AC2 | "Operator onboarding flow provisions a new shop by adding the **email** to the Clerk allowlist and creating the matching `shop` row in locos DB (with `shop.email` populated)." | "Sales-rep onboarding flow provisions a new shop by **(a)** creating a Clerk user (username + temporary password) via Clerk dashboard, and **(b)** creating the matching `shop` row in locos DB with `clerk_user_id` populated. The rep hands credentials to the shop owner out-of-band." |

---

### 4.3 PRD Edits — `prds/prd-locos-2026-07-10/prd.md`

| Section | Change |
|---|---|
| FR2 | "Username + password via Clerk. No self-signup; accounts provisioned manually by sales reps." |
| FR4 | "Every Clerk user maps to exactly one row in `shop` by `clerk_user_id`; provisioning is a sales-rep operation outside the app" |
| NFR5 | "No auth secrets in locos — Clerk owns credentials; `clerk_user_id` is the only identity column in the locos DB" |
| Dependencies | Drop the Vietnamese-mobile SMS/OTP entry; Clerk Free tier covers username+password |
| Risks | Replace SMS/OTP risks with "password handoff between sales rep and shop owner is operational reality — document secure-handling in a RUNBOOK or operator README" |

All other PRD sections unchanged.

---

### 4.4 Architecture Spine Edits — `architecture/architecture-locos-2026-07-10/ARCHITECTURE-SPINE.md`

| Section | Change |
|---|---|
| AD-7 (lines 123–127) | "Clerk owns identity via the **username + password** strategy; locos stores only `clerk_user_id`. No OTP, email verification, or phone verification is used." |

All other Architecture sections unchanged.

---

### 4.5 Epics Edits — `epics.md`

| Section | Change |
|---|---|
| AR-7 (line 69) | Remove phone-number/OTP non-storage clauses; add "credentials handled by Clerk; no auth secrets in locos DB" |
| AR-14 (line 76) | Unchanged |
| Story 1.1 (lines 202–223) | Replace with §4.1 Story 1.1 v3 |
| Story 1.2 (lines 225–239) | Unchanged |
| Story 1.3 (lines 241–254) | Per §4.2 |

---

## 5. Implementation Handoff

### Change scope classification

**Minor.** Same vendor, same boundary, same middleware. Auth surface **shrinks** (no OTP). Single Story 1.1 rewrite; Story 1.3 reword; PRD FR2/FR4/NFR5 touch.

### Routing

**Recipient:** Developer agent (direct implementation).

**Developer responsibilities (in order):**

1. Add `signInWithCredentials(username, password)` to `adapters/clerk/sign-in-client.ts` (phone methods stay dormant).
2. Extend `adapters/clerk/sign-in-error-mapping.ts` with username/password mappings to a single generic localized error.
3. Update `ports/sign-in.ts` interface to add credentials sign-in (drop the email variants proposed in Rev A — those were not yet written).
4. Add `app/(auth)/login/LoginForm.tsx`; update `page.tsx` to render it.
5. Remove `app/(auth)/login/otp/page.tsx` and `OtpForm.tsx` (or keep `OtpForm.tsx` dormant in repo — preferred).
6. Keep `PhoneForm.tsx` unmodified (dormant, per prior instruction).
7. Add `tests/credentials-schema.test.ts`; extend `tests/sign-in-error-mapping.test.ts` with username/password cases.
8. Document sales-rep onboarding in `RUNBOOK.md` or operator README.
9. End-to-end test: create a Clerk user via dashboard, log in via `/login`, land on `/dashboard/<shopSlug>`, refresh, sign out.

**PO responsibilities:**

- Apply PRD edits (§4.3) to `prds/prd-locos-2026-07-10/prd.md`.
- Apply Epics edits (§4.5) to `epics.md` — saving Story 1.1 v3 (§4.1) and Story 1.3 edit (§4.2).
- Update `sprint-status.yaml` to reflect the rewritten Story 1.1 (still in-progress).

**Architect responsibilities:**

- Apply Architecture AD-7 wording tweak (§4.4) to `ARCHITECTURE-SPINE.md`.

### Success criteria

- [ ] Story 1.1 v3 implemented and AC-verified end-to-end against staging.
- [ ] Phone-OTP code paths remain in the repo, not exposed via any UI route.
- [ ] `/login/otp` route removed; no two-step auth UI exists anywhere in `/app`.
- [ ] Story 1.3 reword applied.
- [ ] PRD / Architecture / Epics docs consistent with the username+password model.
- [ ] Sales-rep onboarding documented in `RUNBOOK.md`.

---

## Approval

Review complete proposal. **Continue [c]** or **Edit [e]**?

---

# Sprint Change Proposal — 2026-07-16 (Revision C)

**Subject:** Bring sales-rep provisioning in-app — rewrite Story 1.3 around a `/rep/shops` surface that creates Clerk users + `shop` rows in a single transaction

**Trigger:** Epic 1, Story 1.3 (placeholder to real surface)
**Change scope:** Moderate (full Story 1.3 rewrite; PRD adds FR-1a; AD-7 gets a sister clause; new `ports/rep.ts`; `shop` table gains three columns; two new route groups)
**Author:** Correct Course workflow (Developer)
**Status:** Approved (user, 2026-07-16 — "yes, let's go ahead and do it"; implementation delegated to Developer agent)
**Supersedes / builds on:** Rev B (Section 4.2 Story 1.3 reword) is fully replaced.

---

## 1. Issue Summary

### Problem Statement

Rev B deferred the actual sales-rep onboarding flow to "out-of-band" — the README and the architecture's "Account provisioning" consistency convention still claim that sales reps create Clerk users via the Clerk dashboard and pair them with `shop` rows through an out-of-band provisioning script. Two realities make that impossible to ship as-is:

1. **No operator provisioning tool exists** in this codebase. Story 1.0's `db/seed.ts` is the only writer of `shop` rows today, and only handles a single dev shop. There is no path for a real sales rep to materialize a `shop` row from a non-dev environment.
2. **Story 1.1 v3's `/pending-provisioning` placeholder** (added as the loop-breaker during review) is itself a UX dead-end: it tells the user "contact your sales rep" but provides no surface for the rep to act. Manual walkthrough surfacing this loop is what brought the question back.

### User-stated requirement (2026-07-16)

> "the sale representative should prepare everything before handling the account to the shop owner. The shop owner only needs to capture products and save it in their account, most things except social media link would be done by shop owner. We need a way for sale representative to do this. First, sales rep would be identified by a public metadata in clerk. When locos recognizes that public metadata, it knows this is a sales rep and displays the UI for the rep to work on a list of shop owners, including option to add new one with all detail needed."

### Revised approach (this proposal)

Replace the deferred Story 1.3 placeholder with a real in-app sales-rep provisioning surface:

- **Identity:** sales reps are flagged with `publicMetadata.role = 'sales_rep'` on their Clerk user. Locos reads that flag via `currentUser()` and routes the rep to `/rep/shops` instead of `/catalog`.
- **UI:** `/rep/shops` shows a list of provisioned shops. "Tạo shop mới" opens `/rep/shops/new`, a two-step form. Step 1 captures the Clerk user credentials (username + password). Step 2 captures shop details (display name + address + contact phone).
- **Backend:** a single Next.js server action `createShopAction` calls Clerk's server SDK (`createUser`) to mint the Clerk user, then writes the matching `shop` row bound by `clerk_user_id`. Both writes live in one handler; partial-failure is surfaced as a banner (no compensating delete).
- **Schema:** `shop` gains `display_name`, `address`, `contact_phone` (all `text NOT NULL DEFAULT ''`; empty string is acceptable for address/contact phone because the rep can fill them later in a follow-up story, and `display_name` is filled at create time).
- **Port:** a new `ports/rep.ts` (`RepPort = { listShops(), createShop(input) }`) keeps `core/` clean per AD-1.

### Locked decisions (carried over from the design conversation; not re-litigated here)

1. Rep identity lives in **Clerk `publicMetadata.role = 'sales_rep'`** only (no `sales_rep` table, no defense-in-depth counterpart).
2. Story 1.3 fully rewritten; the `/pending-provisioning` surface is retired (transient until Story 1.3 ships).
3. Rep and shop owner are **exclusive roles** — a Clerk user is either a rep (no `shop` row) or a shop owner (one `shop` row). Never both.
4. Create form captures **5 fields**: username, password, display name, address, contact phone.
5. **Flow:** step 1 collects Clerk-user creds → step 2 collects shop details → submit calls Clerk `createUser` first, then writes the `shop` row bound by `clerk_user_id`.
6. **Partial-failure policy:** best-effort. If Clerk `createUser` succeeds and the Postgres insert fails, surface a banner: "Đã tạo tài khoản ở Clerk nhưng ghi shop thất bại. Thử lại với tên đăng nhập khác hoặc liên hệ kỹ thuật." No compensating delete.

### Triggering research

None. Same vendor (Clerk) and SDK; only the surface that uses it changes (we already import `@clerk/nextjs/server` in `adapters/clerk/auth.ts`; extending it to use `clerkClient` for `createUser` is the same SDK path). The Rev C research file `_bmad-output/planning-artifacts/research/technical-supabase-auth-zalo-zns-sms-webhook-research-2026-07-16.md` from the abandoned Rev R pre-study is **not** relevant here — Rev C uses Clerk end-to-end.

---

## 2. Impact Analysis

### 2.1 Epic Impact

| Epic | Affected? | Notes |
|---|---|---|
| Epic 1 | **Story 1.3 full rewrite; Story 1.1 loop-breaker closure note** | New `ports/rep.ts`, new `core/rep/`, new `app/rep/` route group, `shop` table migration |
| Epic 2 | No | Rep never connects a Facebook Page — that's the shop owner's first-login flow |
| Epic 3 | No | Rep doesn't generate, edit, or delete products |
| Epic 4 | No | Rep doesn't publish |
| Epic 5 | No | Rep doesn't manage other shops' catalogs |

The Epic 1 goal is **unchanged** in intent ("a Vietnamese shop owner can authenticate to a pre-provisioned shop") — only the path that creates the provisioned shop moves into the app.

### 2.2 Story Impact

| Story | Action | Reason |
|---|---|---|
| 1.1 — Username + password login | Loop-breaker note closes | `/pending-provisioning` is now owned by Story 1.3 (and ultimately retires); replace the "Story 1.3 owns /pending-provisioning" reference in Story 1.1's Debug Log with "Story 1.3 now ships the sales-rep surface"; implementation itself is unchanged from Rev B |
| 1.2 — Persistent session | Unchanged | Same Clerk session, role-agnostic |
| **1.3 — In-app sales-rep provisioning** | **Full rewrite** | New title, ACs, tasks; ties Story 1.1's loop-breaker to a real surface |
| 1.4+ | Unchanged | Sales rep never touches other stories' surfaces |

### 2.3 Artifact Conflicts

#### PRD — `prds/prd-locos-2026-07-10/prd.md`

| Section | Change |
|---|---|
| FR1 | "**A sales rep** creates a shop account in-app via the sales-rep surface. **There is no public self-service signup.**" |
| FR-1a (NEW) | "The sales-rep surface lists every provisioned shop and lets the rep create a new one. A create captures five fields — username, password, display name, address, contact phone — writes a Clerk user first, then binds a `shop` row by `clerk_user_id`. Sales rep identity is a Clerk user with `publicMetadata.role = 'sales_rep'`; a rep never has a `shop` row." |
| UJ-1 step 1 | Already references "username and password (provisioned for her by the locos sales rep)" — keep, this is now accurate in the new in-app sense. |
| §4 (Users & Context) | Reword sentence about "Accounts are provisioned manually" to: "Accounts are **provisioned by locos sales reps** through the in-app sales-rep surface (FR-1a). The rep creates each shop-owner account, hands the credentials to the owner out-of-band (typically via Zalo or in person), and the owner logs in and uses the app for product work. There is no public self-service signup." |
| §8 Dependencies | Reword "Manual account-provisioning process" line: "Sales-rep in-app provisioning surface (FR-1a) — rep creates each shop-owner Clerk user through `/rep/shops/new`; the matching `shop` row is written by the same handler." |
| §8 Risks | Add a bullet: "Sales-rep Clerk identities need `publicMetadata.role = 'sales_rep'` set via the Clerk dashboard before the rep can sign in to `/rep`. Today this is a manual operator step; the programmatic flag-setter is **deferred**." |
| OQ4 | The rep surface (list of provisioned shops) is the in-app answer to OQ4 if no separate admin tool is built. Defer the question closure to Story 1.3 review. |

#### Architecture — `architecture/architecture-locos-2026-07-10/ARCHITECTURE-SPINE.md`

| Section | Change |
|---|---|
| AD-7 (lines 123–127) | Add a **sister clause**: the Clerk boundary has two identity surfaces — `clerk_user_id → shop row` (shop owner) and `publicMetadata.role = 'sales_rep'` (sales rep). Locos routes based on which surface the current user presents; sales reps have **no** shop row. |
| AD-7 rule line | Add: "Sales-rep provisioning is the in-app surface at `/rep/shops/*`. It calls Clerk's `users.createUser` server-API for the Clerk side and writes the matching `shop` row in the same handler. No compensating delete on partial failure; orphan Clerk users are visible to ops via Clerk dashboard and the rep can retry." |
| Vendor table (Stack, line 193) | Add a line: `clerkClient.users.createUser` is exercised by the rep provisioning surface. |
| Capability Map (line 295) | Add new row: "Sales-rep provisioning surface (FR1, FR-1a) — `app/rep/*` → `core/rep/*` → `adapters/clerk/rep.ts` (role detection) + `adapters/postgres/repositories/shop-repository.ts` (insert). Governed by AD-1, AD-7, AD-12." |
| Consistency Convention "Account provisioning" (line 181) | Replace "Operator-only. No self-service signup path exists in application code." with: "**Sales-rep-only via the in-app sales-rep surface.** A Clerk user flagged with `publicMetadata.role = 'sales_rep'` provisions new shop-owner accounts via `/rep/shops/new`; the matching `shop` row is written by the same handler. The locos app never accepts new account data through a public surface — every create flows through the rep." |
| Structural Seed (line 207) | Add: `app/rep/shops/page.tsx`, `app/rep/shops/new/page.tsx`, `app/rep/layout.tsx`; `core/rep/list-shops.ts`, `core/rep/create-shop.ts`; `ports/rep.ts`; `adapters/clerk/rep.ts`. |
| Deferred (line 318) | Note: "Sales-rep flag-setter (programmatic Clerk `publicMetadata.role` writer) — deferred. Today the flag is set via Clerk dashboard." |
| Open Questions | Carry forward: same OQ1/OQ3 unchanged. |

#### Epics — `epics.md`

| Section | Change |
|---|---|
| AR-7 (line 69) | Replace "Sales reps provision accounts out-of-band via Clerk dashboard" with "Sales reps provision accounts in-app via `/rep/shops/new` (flagged by `publicMetadata.role = 'sales_rep'`). A rep never has a `shop` row." |
| AR-12 (line 74) | Reword: "Sales-rep in-app provisioning is the only create path; the dev seed remains the local-dev shortcut." |
| AR-14 (line 76) | Add: "Clerk `users.createUser` server-API exercised by the sales-rep surface." |
| Story 1.1 (lines 202–223) | Debug Log note closed: replace placeholder reference with "Story 1.3 now ships the sales-rep surface at `/rep/shops/*`. Story 1.1 ships the loop-breaker placeholder until Story 1.3 lands." Implementation unchanged. |
| **Story 1.3 (lines 241–254)** | **Full rewrite** — see §4.2 |

### 2.4 Open Items

None blocking. The change is additive on top of Rev B's auth surface.

**Deferred (not in this proposal):**
- Rep edit/disable shops (after create, sales rep has no further way to update a provisioned shop — they only see it on the list). Deferred to a follow-up if rep-side corrections become operational pain.
- A sales rep's own avatar-menu / sign-out UX parity with shop owners. Today the rep uses the same Clerk `<SignOutButton>` placed on the rep shell; the spec'd avatar-menu (UX-DR25) is owned by Story 1.2's UI follow-through.
- Programmatically setting `publicMetadata.role = 'sales_rep'` from inside locos. Stuck on Clerk dashboard for now.

---

## 3. Recommended Approach

**Option 1 — Direct Adjustment (selected).** Rewrite Story 1.3 in place; add the rep surface incrementally; ship a Postgres migration as part of Story 1.3.

**Why this option:**

- The hexagonal boundary (AD-1) absorbs the change cleanly. `core/` doesn't import Clerk; the new `ports/rep.ts` and `core/rep/*` follow the same pattern as `core/shop/*`. Zero new patterns.
- AD-7 already governs identity. Adding a sister clause for the rep role is a wording change + a routing rule, not a new invariant.
- The schema migration is the longest pole (one migration, three new columns on `shop`). Everything else is greenfield code.
- Option 2 (rollback) and Option 3 (MVP review) are not relevant — this change *is* part of MVP. The placeholder wasn't really part of MVP; it was acknowledging a missing surface.

**Effort estimate:** Medium. **Risk level:** Low.

---

## 4. Detailed Change Proposals

### 4.1 Story 1.3 — Full Rewrite

> **Story 1.3 — In-app sales-rep provisioning**

**As a** sales rep at the locos parent business
**I want** a `/rep/shops` surface where I can see every shop I've provisioned and create a new one — capturing the username and password along with the shop's display name, address, and contact phone
**So that** the shop owner only has to remember a username and password, never does account setup, and I hand them a complete account ready for product work

**Acceptance Criteria:**

1. A Clerk user with `publicMetadata.role === 'sales_rep'` signing in lands on `/rep/shops`, **not** `/catalog`. The middleware (or shell-level route guard) routes based on the flag; shop owners continue to land on `/catalog`.
2. `/rep/shops` renders a list view of every active (non-tombstoned) `shop` row, sorted by `created_at DESC`. Each row shows display_name, creation date (`<shopTail>` Vietnamese format), and "Đăng nhập thử" affordance (optional).
3. The "Tạo shop mới" button on `/rep/shops` opens `/rep/shops/new`. The form is a two-step flow:
   - **Step 1 — Clerk user:** `Tên đăng nhập` (matching UX-DR7: 3–32 chars, alphanumeric + `_-`), `Mật khẩu` (matching UX-DR8: 8–128 chars; password has a "Hiện/Ẩn" visibility toggle), both Vietnamese-labeled.
   - **Step 2 — Shop details:** `Tên cửa hàng` (display name, 1–80 chars), `Địa chỉ` (address, ≤ 200 chars; can be empty), `Số điện thoại liên hệ` (contact phone, ≤ 32 chars; can be empty).
4. Submitting the form calls a single server action `createShopAction({ username, password, displayName, address, contactPhone })` that (a) calls `clerkClient.users.createUser({ username, password })` and (b) writes the matching `shop` row bound by `clerk_user_id`. Both writes happen in the same handler.
5. On full success, the rep is redirected to `/rep/shops/{shopId}` (read-only detail showing the four fields + creation date) and the list view refreshes.
6. **On partial failure** (Clerk user created but Postgres insert failed), the form renders an inline banner: "Đã tạo tài khoản ở Clerk nhưng ghi shop thất bại. Vui lòng thử lại với tên đăng nhập khác hoặc liên hệ kỹ thuật để dọn tài khoản." The rep can retry with a new username; orphan Clerk users are visible to ops via Clerk dashboard.
7. **On full failure** (e.g. Clerk rejects the username as taken), the form surfaces a localized error from the same `sign-in-error-mapping.ts` family adapted to `createUser` errors (`form_username_exists`, `form_param_format_invalid`, etc.). No `shop` row is written when `createUser` fails.
8. The `core/rep/` services never import from `@clerk/nextjs` — they take `RepPort` as a parameter (AD-1). Role detection (`publicMetadata.role === 'sales_rep'`) lives in `adapters/clerk/rep.ts` and is the only Clerk-side read.
9. The `shop` row migration adds `display_name text NOT NULL DEFAULT ''`, `address text NOT NULL DEFAULT ''`, `contact_phone text NOT NULL DEFAULT ''`. The dev seed inserts a non-empty `display_name`; address/contact phone default to empty string (acceptable per "all detail needed" rule — rep can update later via the eventual follow-up).
10. Empty-state UX: `/rep/shops` with zero shops shows the standard empty state (UX-DR15) with one primary CTA "Tạo shop đầu tiên" leading to `/rep/shops/new`.
11. The Story 1.1 `/pending-provisioning` placeholder is **retired** after Story 1.3 ships (Step 9 in §5 below keeps it functional during transition; cleanup is a one-line `rm` after the rep surface renders).
12. **AD-1 guard** passes — `grep -rE "from '@clerk|from 'drizzle" core/` returns empty.
13. **Tests:** new unit tests cover `core/rep/create-shop.ts` (insert path) and `core/rep/list-shops.ts` against fakes; an adapter test verifies `clerkClient.users.createUser` is called with the right shape. `npm test`, `npm run typecheck`, `npm run lint` clean.

**Out of scope (Story 1.3):**

- Rep edit/disable shops (deferred — see §2.4).
- Programmatic `publicMetadata.role = 'sales_rep'` setter (deferred; today = Clerk dashboard).
- Rep-side observer views (catalog listings, generation queues, etc.). Rep never accesses shop-owner surfaces.
- Operator admin view (OQ4) — the rep list IS the admin view, but metrics/dashboards stay in external tooling per A7.

### 4.2 PRD Edits — `prds/prd-locos-2026-07-10/prd.md`

| Section | OLD (Rev B) | NEW (Rev C) |
|---|---|---|
| §4 Users & Context | "Accounts are **provisioned manually** by the locos team (these are known customers of the parent business)." | "Accounts are **provisioned by sales reps** through the in-app sales-rep surface (FR-1a). Each rep creates a shop-owner account — username + temporary password + shop details — and hands the credentials out-of-band. The shop owner never deals with account setup; the only thing they receive is a username and password." |
| §6.1 FR1 | "The locos team can manually create a shop account; there is no public self-service signup." | "**A sales rep** creates a shop account in-app via the sales-rep surface (FR-1a). **There is no public self-service signup.**" |
| §6.1 FR-1a (NEW) | — | "The sales-rep surface lists every provisioned shop and lets the rep create a new one. A create captures five fields — username, password, display name, address, contact phone — writes a Clerk user first via Clerk's `users.createUser` server-API, then writes the matching `shop` row bound by `clerk_user_id`. Both writes happen in the same handler. Sales rep identity is a Clerk user with `publicMetadata.role = 'sales_rep'`; a rep never has a `shop` row." |
| §8 Dependencies | "Manual account-provisioning process owned by the locos/parent-business team — sales rep creates each shop owner a Clerk user with a temp password and hands credentials out-of-band." | "**Sales-rep in-app provisioning surface** (FR-1a) — sales rep signs in via Clerk username+password (FR2), lands on `/rep/shops`, opens `/rep/shops/new`, fills in the five fields, and submits. The handler calls Clerk `users.createUser` then writes the matching `shop` row. The rep hands the credentials to the shop owner out-of-band (in person or via Zalo)." |
| §8 Risks | (existing) "Password handoff between sales rep and shop owner is an operational reality…" | Unchanged, plus add: "**Sales-rep Clerk identities need `publicMetadata.role = 'sales_rep'` set via Clerk dashboard** before the rep can sign in to `/rep`. Today this is a manual operator step; programmatic flag-setter is **deferred**." |
| §10 A7 (OQ4) | "Success metrics live in internal tooling, not the shop-facing app." | Unchanged. Note that `/rep/shops` (list of provisioned shops) is the in-app admin view per OQ4 if no separate admin tool is built; OQ4 closure deferred to Story 1.3 review. |

### 4.3 Architecture Spine Edits — `architecture/architecture-locos-2026-07-10/ARCHITECTURE-SPINE.md`

| Section | OLD (Rev B) | NEW (Rev C) |
|---|---|---|
| AD-7 (lines 123–127) | "Clerk owns identity via the username+password strategy; locos stores only `clerk_user_id`. No OTP, email verification, or phone verification is used." | "Clerk owns identity via the username+password strategy; locos stores only `clerk_user_id`. **Two identity surfaces share the Clerk boundary:** (a) **shop_owner** — a Clerk user is paired 1:1 with a `shop` row via `clerk_user_id`; (b) **sales_rep** — a Clerk user is flagged with `publicMetadata.role = 'sales_rep'` and routes to `/rep/shops`. **A rep never has a `shop` row; a shop owner never has the rep flag.** Sales-rep provisioning is the in-app surface at `/rep/shops/new`; it calls Clerk's `users.createUser` server-API for the Clerk side and writes the matching `shop` row in the same handler. **No compensating delete on partial failure** — orphan Clerk users are visible to ops via Clerk dashboard and the rep retries with a different username." |
| Vendor table — Clerk (line 193) | "Clerk (Next.js SDK)" | "Clerk (Next.js SDK; `clerkClient.users.createUser` exercised by the sales-rep surface)" |
| Capability Map — add row (line 295) | — | "**Sales-rep provisioning surface (FR1, FR-1a)** — `app/rep/*` → `core/rep/*` → `adapters/clerk/rep.ts` (role detection) + `adapters/postgres/repositories/shop-repository.ts` (insert). Governed by AD-1, AD-7, AD-12." |
| Consistency Convention "Account provisioning" (line 181) | "Operator-only. No self-service signup path exists in application code. A shop row is created only by a locos-team internal tool that takes `clerk_user_id` from an out-of-band provisioning script. Application code never accepts phone numbers or personal data from a public surface for the purpose of account creation." | "**Sales-rep-only via the in-app sales-rep surface.** A Clerk user flagged with `publicMetadata.role = 'sales_rep'` provisions new shop-owner accounts via `/rep/shops/new`; the matching `shop` row is written by the same handler. The locos app never accepts new account data through a public surface — every create flows through the rep." |
| Structural Seed (line 207) | (existing) | Add: `app/rep/shops/page.tsx`, `app/rep/shops/new/page.tsx`, `app/rep/layout.tsx`; `core/rep/list-shops.ts`, `core/rep/create-shop.ts`; `ports/rep.ts`; `adapters/clerk/rep.ts`. |
| Deferred (line 318) | (existing) | Add: "Programmatic sales-rep flag-setter (Clerk `publicMetadata.role` writer) — deferred. Today the flag is set via Clerk dashboard." |

### 4.4 Epics Edits — `epics.md`

| Section | OLD (Rev B) | NEW (Rev C) |
|---|---|---|
| AR-7 (line 69) | "Sales reps provision accounts out-of-band via Clerk dashboard." | "Sales reps provision accounts in-app via `/rep/shops/new` (flagged by `publicMetadata.role = 'sales_rep'`). A rep never has a `shop` row." |
| AR-12 (line 74) | "Sales-rep-only account provisioning (no self-signup)… sales rep (Clerk user via Clerk dashboard) and the matching locos `shop` row is created out-of-band" | "Sales-rep-only account provisioning (no self-signup). The rep signs in via the username+password flow (FR2), lands on `/rep/shops`, opens `/rep/shops/new`, fills 5 fields, and submits. The handler calls Clerk `users.createUser` and writes the matching `shop` row bound by `clerk_user_id`. The dev seed remains the local-dev shortcut." |
| AR-14 (line 76) | (unchanged) | Add to existing line: "Clerk `users.createUser` server-API exercised by the sales-rep surface." |
| Story 1.1 Debug Log note (loop-breaker) | "Story 1.3 owns `/pending-provisioning`" | "Story 1.3 now ships the sales-rep surface at `/rep/shops/*`. Story 1.1 ships the loop-breaker placeholder until Story 1.3 lands; the placeholder retires when the rep surface is rendering." |
| **Story 1.3 (lines 241–254)** | (placeholder — `/pending-provisioning` only) | **Full rewrite** — replace with §4.1 above |
| Epic 1 FR-coverage line (line 113–116) | "FR1: Epic 1 Story 0… FR4: Epic 1 Story 3" | "FR1: Epic 1 Story 3 — in-app sales-rep provisioning. **FR-1a (NEW):** Epic 1 Story 3 — rep surface. FR4: Epic 1 Story 3 — provisioned-only enforcement (now: rep writes both Clerk user and `shop` row)." |

### 4.5 Implementation Phase — File List (forward-looking)

When Story 1.3 implementation kicks off, expect:

**New files**
- `app/rep/layout.tsx` — rep shell, role guard (`getCurrentRep()` redirects to `/login` if not a rep).
- `app/rep/shops/page.tsx` — list view (server component).
- `app/rep/shops/new/page.tsx` — two-step form (server component shell + client form component).
- `app/rep/shops/[shopId]/page.tsx` — read-only detail (server component).
- `app/rep/shops/new/CreateShopForm.tsx` — client component, two-step wizard.
- `app/rep/shops/actions.ts` — server action `createShopAction`.
- `ports/rep.ts` — `RepPort` interface.
- `adapters/clerk/rep.ts` — `clerkRepAdapter` (role detection + `createClerkUser`).
- `adapters/postgres/repositories/shop-repository.ts` — `createShopRow`, `listShopRows`.
- `core/rep/list-shops.ts` — `listShops(repPort)`.
- `core/rep/create-shop.ts` — `createShop(repPort, input)`.
- `db/migrations/0002_shop_provisioning_fields.sql` — adds `display_name`, `address`, `contact_phone`.
- `tests/rep-create-shop.test.ts` — covers `core/rep/create-shop.ts`.
- `tests/rep-list-shops.test.ts` — covers `core/rep/list-shops.ts`.
- `tests/adapters-clerk-rep.test.ts` — covers `clerkRepAdapter.createClerkUser` (with `clerkClient` mocked).

**Modified files**
- `middleware.ts` — add `/rep(.*)` routing: a sales rep hitting `/rep(.*)` is allowed through; anyone else is redirected to `/catalog` or `/login`.
- `db/seed.ts` — add a `DEV_SALES_REP_CLERK_USER_ID` placeholder constant; add a non-empty `display_name` to the seeded shop row.
- `app/layout.tsx` — no change needed (rep shell handles its own auth).
- `tests/sprint-status.yaml` — set `1-3-provisioned-only-enforcement` → `ready-for-dev`.

**Deleted**
- `app/(auth)/pending-provisioning/page.tsx` — once Story 1.3 ships and tests pass; cleanup step inside Story 1.3's task 9.

**Story 1.1 (Rev B) — closed**
- Story 1.1's Debug Log entry closes against this proposal; the implementation surface is unchanged. The loop-breaker `pending-provisioning` page stays **functional** until Story 1.3 ships, at which point Story 1.3 removes it.

---

## 5. Implementation Handoff

### Change scope classification

**Moderate.** Story 1.3 is a from-scratch surface (six new files in `app/rep/`, port + adapter, Postgres migration). PRD adds a new FR (FR-1a). Architecture adds a sister clause + Capability Map row + consistency-convention reword. Story 1.1 closes a paragraph.

### Routing

**Primary:** Developer agent → bmad-dev-story workflow on Story 1.3.

**Order of operations:**

1. Database migration: `db/migrations/0002_shop_provisioning_fields.sql` adds the three columns. Drizzle schema update + `db/migrate.ts` runner picks it up.
2. Port + adapter: `ports/rep.ts`, `adapters/clerk/rep.ts`, `adapters/postgres/repositories/shop-repository.ts`.
3. Core: `core/rep/list-shops.ts`, `core/rep/create-shop.ts`.
4. Server action: `app/rep/shops/actions.ts`.
5. UI: `app/rep/layout.tsx`, `app/rep/shops/page.tsx`, `app/rep/shops/new/page.tsx`, `app/rep/shops/new/CreateShopForm.tsx`, `app/rep/shops/[shopId]/page.tsx`.
6. Middleware: `middleware.ts` adds `/rep(.*)` routing.
7. Tests: `tests/rep-create-shop.test.ts`, `tests/rep-list-shops.test.ts`, `tests/adapters-clerk-rep.test.ts`. Plus extend `tests/sign-in-error-mapping.test.ts` for `createUser` mappings.
8. Seed: `db/seed.ts` adds `DEV_SALES_REP_CLERK_USER_ID` and a non-empty `display_name`.
9. Cleanup: delete `app/(auth)/pending-provisioning/page.tsx` after Story 1.3 ships + green tests; remove `/pending-provisioning` from `middleware.ts` `isPublicRoute`; remove `firstValidationMessage`'s generic fallback (Story 1.1 path).
10. README + Story 1.1 Debug Log: note that the loop-breaker is now retired.

**PO / Architect responsibilities (concurrent with dev-story):**

- Apply PRD §4.2 (FR1 + FR-1a + §4 + §8 deps + §8 risks).
- Apply ARCHITECTURE-SPINE §4.3 (AD-7 sister clause + vendor table + Capability Map row + Account-provisioning convention + Structural Seed + Deferred).
- Apply epics §4.4 (AR-7 + AR-12 + AR-14 + Story 1.1 Debug Log note + Story 1.3 full rewrite + Epic 1 FR-coverage line).
- Update `sprint-status.yaml` to set `1-3-provisioned-only-enforcement: ready-for-dev`.

### Success criteria

- [ ] `shop` table migrated with three new columns and seed inserts a non-empty `display_name`.
- [ ] `ports/rep.ts`, `adapters/clerk/rep.ts`, `adapters/postgres/repositories/shop-repository.ts` exist; AD-1 grep guard passes.
- [ ] `/rep/shops` lists shops; `/rep/shops/new` is the two-step form; `/rep/shops/{id}` is read-only.
- [ ] `createShopAction` calls Clerk first then writes the `shop` row; banner fires on partial failure.
- [ ] Role routing: a Clerk user with `publicMetadata.role = 'sales_rep'` lands on `/rep/shops`; a shop owner lands on `/catalog`.
- [ ] `npm test`, `npm run typecheck`, `npm run lint` all green.
- [ ] PRD / Architecture / Epics consistent with the in-app rep surface.
- [ ] Story 1.1's loop-breaker note closed; `/pending-provisioning` removed once green.

---

## Approval

**Approved by Sy Le on 2026-07-16** ("yes, let's go ahead and do it"; followed by full delegation — "you can just keep it going"). All five artifact edit sets have been applied; Sprint Change Proposal Rev C is final.

- PRD §4 / §6.1 (FR1 + FR-1a) / §8 Dependencies / §8 Risks — applied
- Architecture Spine AD-7 / Vendor table / Capability Map / Structural Seed / Deferred / OQ4 — applied
- Epics AR-7 / AR-12 / AR-14 / FR Coverage Map / Story 1.3 (full rewrite) — applied
- Story 1.1 File List — forward-retirement note added
- Sprint Status — `1-3-provisioned-only-enforcement: backlog → ready-for-dev` (Rev C)
- README — Sales-rep provisioning section added; Story 1.3 prep notes updated

Story 1.3 is `ready-for-dev`. Hand off to the Developer agent to execute the Implementation Phase §4.5 file list.

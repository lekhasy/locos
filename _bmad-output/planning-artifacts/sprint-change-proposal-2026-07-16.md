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

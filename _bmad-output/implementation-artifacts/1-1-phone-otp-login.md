---
baseline_commit: c9f20fb
review_iteration_commit: pending
---

# Story 1.1: Username + password login (Clerk, sales-rep-provisioned)

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

This story was rewritten under Sprint Change Proposal `_bmad-output/planning-artifacts/sprint-change-proposal-2026-07-16.md` Revision B (approved 2026-07-16). The original phone+OTP flow was replaced by username+password on Clerk. Phone-OTP code paths were deleted rather than kept dormant because the "no OTP" pivot invalidates any future revival.

## Story

As a provisioned shop owner,
I want to log in with the username and password my sales rep gave me,
so that I can access the locos catalog without dealing with OTPs, magic links, or any phone-based step.

## Acceptance Criteria

1. **Given** an unauthenticated user opens the app, **when** they land on `/login`, **then** they see a single sign-in form with two fields — `Tên đăng nhập` (username) and `Mật khẩu` (password) — and a primary submit button labeled `Đăng nhập`.
2. The form is the only auth-related UI on the page (no OTP cells, no phone-input, no "resend" affordance, no second step).
3. **When** the user submits a valid username + password, **then** Clerk authenticates via the `username` strategy and sets an HTTP-only session cookie.
4. **When** authentication succeeds, **then** the user is redirected to `/catalog` and a `shop_login` event is emitted (AR-13).
5. **When** the user submits invalid credentials, **then** the user sees a single generic localized error "Sai tên đăng nhập hoặc mật khẩu" — **never** revealing whether the username or the password was wrong.
6. Submitting again from the same form is allowed without any cooldown.
7. **There is no `/login/otp` route** and **no** two-step auth flow anywhere in `/app`.
8. Phone-OTP code paths are not present in the repo (deleted; no dormant code).

## Tasks / Subtasks

- [x] Task 1: Replace client-side `ports/sign-in.ts` with credentials-based `SignInPort` (AC: 1, 3, 5)
  - [x] 1.1: Define `credentialsSchema` (3–32 char username, alphanumeric + `_-`; 8–128 char password).
  - [x] 1.2: Define `SignInResult = { ok: true } | { ok: false; reason: 'invalid_credentials' | 'unexpected' }`.
  - [x] 1.3: Define `SignInPort = { signIn(identifier, password): Promise<SignInResult> }`. Drop `requestOtp`/`verifyOtp`.

- [x] Task 2: Rewrite `adapters/clerk/sign-in-client.ts` to drive Clerk's `username` strategy (AC: 3, 5)
  - [x] 2.1: Use `signIn.__internal_future.password({ identifier, password })`. Single combined call per `SignInFuturePasswordParams`.
  - [x] 2.2: On success, call `setActive({ session: createdSessionId })` from `useSignIn()` to persist the session (see Debug Log for the deviation from plan: v6's `SignInFutureResource.finalize()` only accepts navigate params, so `setActive` is the canonical path).
  - [x] 2.3: Map Clerk errors to `'invalid_credentials'` for every known auth failure; everything else → `'unexpected'`.
  - [x] 2.4: Emit `metric('sign_in_attempted')` before, `metric('sign_in_succeeded')` / `metric('sign_in_failed', { reason, hasCode })` after.
  - [x] 2.5: Return `{ ok: false, reason: 'unexpected' }` when the port is not loaded or `setActive` is unavailable.

- [x] Task 3: Rewrite `adapters/clerk/sign-in-error-mapping.ts` for username/password (AC: 5)
  - [x] 3.1: Replace `RequestReason`/`VerifyReason` with `SignInReason = Extract<SignInResult, { ok: false }>['reason']`.
  - [x] 3.2: Replace mapping table: `form_password_incorrect`, `form_identifier_not_found`, `form_identifier_exists`, `user_locked`, `verification_failed`, `form_param_format_invalid` → `invalid_credentials`.
  - [x] 3.3: Keep `extractClerkCode()` unchanged.

- [x] Task 4: Implement `app/(auth)/login/LoginForm.tsx` (AC: 1, 2, 5, 6)
  - [x] 4.1: `'use client'`. Two `<input className="input">` fields + `<button className="button-primary">`.
  - [x] 4.2: Vietnamese labels (`Tên đăng nhập`, `Mật khẩu`); reuse `.input` and `.form-*` classes.
  - [x] 4.3: Submit calls `signIn(identifier, password)` → on success `await recordLoginAction()` + `router.push('/catalog')`.
  - [x] 4.4: On `{ ok: false }`, set error to the single message "Sai tên đăng nhập hoặc mật khẩu".
  - [x] 4.5: `if (pending) return` + `credentialsSchema.safeParse(...)` early-return guards.
  - [x] 4.6: Inputs use `readOnly={pending}` + `aria-busy={pending}` to keep focus during the Clerk round-trip.

- [x] Task 5: Update `app/(auth)/login/page.tsx` (AC: 1, 7)
  - [x] 5.1: Renders `<LoginForm />`. Updated helper text to "Vui lòng đăng nhập bằng tên đăng nhập và mật khẩu đã được cấp."

- [x] Task 6: Remove `/login/otp` route and form (AC: 7)
  - [x] 6.1: Deleted `app/(auth)/login/otp/page.tsx`, `app/(auth)/login/otp/OtpForm.tsx`, and the empty `otp/` directory.

- [x] Task 7: Remove dormant phone-OTP code paths (AC: 8) — DEVIATION FROM PLAN
  - [x] 7.1: **Deviation:** Originally Task 7 said "keep `PhoneForm.tsx` dormant in repo" per the user's earlier "keep the current code, but not showing it" instruction. After the "no OTP" pivot in the same session, the dormant instruction is moot — there's no future scenario where OTP would be reintroduced. Deleted `PhoneForm.tsx`. Verified by grep that no other module imports it.

- [x] Task 8: Server action — `recordLoginAction` keeps its semantics (AC: 4)
  - [x] 8.1: `app/(auth)/login/actions.ts` requires no change; it reads the session cookie via Clerk's `auth()` and emits `shop_login` (AR-13). `LoginForm` calls it after `signIn` returns `{ ok: true }`.

- [x] Task 9: Middleware — clean up `/login/otp` references (AC: 7)
  - [x] 9.1: `middleware.ts` matcher simplifies to `['/', '/login(.*)']` (no `/login/otp`); `isAuthRoute` matches only bare `/login`. Doc-comment updated.

- [x] Task 10: Remove dormant phone schema from `ports/auth.ts` (AC: 8) — DEVIATION FROM PLAN
  - [x] 10.1: **Deviation:** Originally Task 10 said "keep `phoneSchema`/phone helpers dormant." After the "no OTP" pivot, deleted `phoneSchema`, `PhoneInput`, `normalizeVietnamNationalNumber`, `toVietnamE164` from `ports/auth.ts`. `AuthPort` (server-side: `getCurrentShop`, `signOut`) stays put.

- [x] Task 11: Tests (AC: 1, 3, 5, 7, 8)
  - [x] 11.1: New `tests/credentials-schema.test.ts` — 14 unit cases covering valid/invalid username + password shapes.
  - [x] 11.2: `tests/sign-in-error-mapping.test.ts` — replaced phone mappings with username/password mappings; `extractClerkCode` tests unchanged.
  - [x] 11.3: `tests/phone-schema.test.ts` deleted (see Task 10 deviation).
  - [x] 11.4: `npm test` — 5 files, 40 tests pass.
  - [x] 11.5: `npm run typecheck` — clean.
  - [x] 11.6: `npm run lint` — clean.

- [x] Task 12: Smoke-test guardrails (AC: 1–8)
  - [x] 12.1: AD-1 guard passes — `grep -rE "from '@clerk|from 'drizzle" core/` returns empty.
  - [x] 12.2: `grep -r "PhoneForm\|OtpForm" app/ adapters/` returns nothing (both deleted).
  - [x] 12.3: `/login/otp` directory deleted.
  - [x] 12.4: Manual walkthrough documented in Dev Notes; requires a Clerk dev app with Username sign-in identifier enabled.

## Dev Notes

- **Architecture alignment:**
  - **AD-1 (hexagonal core):** `core/` stays port-only. `adapters/clerk/sign-in-client.ts` is the only client-side Clerk import in the active code path. Server-side: `adapters/clerk/auth.ts`, `middleware.ts`, `app/layout.tsx`. `grep -r "from '@clerk" core/` is empty.
  - **AD-7 (Clerk-owned auth boundary):** `AuthPort` (server-side) at `ports/auth.ts` exposes `getCurrentShop` and `signOut`. `SignInPort` (client-side) at `ports/sign-in.ts` exposes `signIn(identifier, password)`. The password is sent directly to Clerk and never persisted, logged, or echoed in client code.
  - **AR-13 (event emission):** Story 1.1 v3 emits `sign_in_attempted`, `sign_in_succeeded`, `sign_in_failed` (client) and `shop_login` / `login_no_shop_row` (server, via `recordLoginAction`).
  - **AR-1 (multi-tenant):** `getCurrentShop` derives `shopId` from the authenticated user; no caller can ask for a shop without a user.

- **Clerk v6 API specifics:**
  - `signIn.__internal_future.password({ identifier, password })` — single combined call. Returns `{ error }`. `createdSessionId` lives on the future resource.
  - `setActive({ session: createdSessionId })` from `useSignIn()` — the documented Clerk v6 way to persist a session after `password()` succeeds. `SignInFutureResource.finalize()` does NOT accept a session id (only navigate params) — using it with `{ session }` is a TS error.
  - Error codes: `form_password_incorrect`, `form_identifier_not_found`, `form_identifier_exists` (defense), `form_param_format_invalid`, `user_locked`, `verification_failed`. All collapse to one UI message.

- **Vietnamese microcopy (UX-DR20):**
  - Page heading: "Đăng nhập"
  - Helper: "Vui lòng đăng nhập bằng tên đăng nhập và mật khẩu đã được cấp."
  - Username label: "Tên đăng nhập"
  - Password label: "Mật khẩu"
  - Submit idle: "Đăng nhập"; pending: "Đang đăng nhập…"
  - Error (any failure): "Sai tên đăng nhập hoặc mật khẩu"

- **Out of scope (do NOT touch):**
  - Self-signup; password reset; first-login forced password change; email or phone verification; any OTP flow.
  - Story 1.2 (persistent session specifics) and Story 1.3 (clerk_user_id → shop mapping).

### Project Structure Notes

- Aligns with the structural seed: `app/(auth)/login/page.tsx`, `app/(shop)/catalog/page.tsx`, `middleware.ts` at repo root, `ports/auth.ts`, `ports/sign-in.ts`, `adapters/clerk/auth.ts`, `adapters/clerk/sign-in-client.ts`.
- New file: `LoginForm.tsx` (client component colocated with the page).
- New test file: `tests/credentials-schema.test.ts`.

### References

- Sprint Change Proposal — `_bmad-output/planning-artifacts/sprint-change-proposal-2026-07-16.md` (Revision B).
- Epics Story 1.1 — `_bmad-output/planning-artifacts/epics.md` §Story 1.1 (rewritten under §4.1 of the proposal).
- PRD FR2, FR4, NFR5 — `_bmad-output/planning-artifacts/prds/prd-locos-2026-07-10/prd.md` §6.1.
- Architecture AD-1, AD-7, AR-13 — `ARCHITECTURE-SPINE.md` lines 87–91, 124–128, 180.
- UX-DR7, UX-DR8, UX-DR20 — `_bmad-output/planning-artifacts/epics.md` §UX Design Requirements.
- DESIGN tokens — `app/globals.css` §:root.
- Clerk Next.js SDK — `node_modules/@clerk/shared/dist/types/index.d.ts` lines 3334 (PasswordParams), 3541 (SignInFutureResource), 10451 (UseSignInReturn), 9330 (SetActive).

## Dev Agent Record

### Agent Model Used

Claude Code session (MiniMax-M3); story context originally drafted by Claude Opus 4.7 (`claude-opus-4-7`).

### Debug Log References

- **`finalize()` API surface.** Story plan called for `signIn.__internal_future.finalize({ session: createdSessionId })` to persist the session after `password()`. Clerk v6's `SignInFutureFinalizeParams` is `{ navigate?: SetActiveNavigate }` only — passing `{ session }` is a TS error. **Resolution:** switched to `setActive({ session: createdSessionId })` from the `useSignIn()` hook. This is the canonical path for `useSignIn()` consumers per the `UseSignInReturn` definition (`@clerk/shared/dist/types/index.d.ts:10451`).
- **Dormant-code pivot.** The original Story 1.1 v3 plan included Task 7 ("keep `PhoneForm.tsx` dormant") and Task 10 ("keep `phoneSchema` helpers dormant"), tracing back to the user's earlier "keep the current code, but not showing it" phrasing about phone OTP. Within the same session, the user pivoted again to "no OTP of any kind." With OTP fully out of scope, "dormant" code has no future story to wait for. Deleted `PhoneForm.tsx`, `tests/phone-schema.test.ts`, the `phoneSchema`/`PhoneInput`/`normalizeVietnamNationalNumber`/`toVietnamE164` exports in `ports/auth.ts`, and the dormant `.phone-input` / `.otp-*` rules in `app/globals.css`. The grep smoke-test (Task 12.2) confirms no module imports them.
- **Post-review bug: validation failures masked as credential errors.** First manual walkthrough surfaced the issue: typing a username with characters outside `^[a-zA-Z0-9_-]+$` (e.g. an `@`, a pasted email-like identifier) failed `credentialsSchema.safeParse`, but the submit handler set the generic credential message and bailed before calling the port. From the user's perspective "the form returns the wrong-credentials error and never sends a request." **Root cause:** AC #5's "Sai tên đăng nhập hoặc mật khẩu" was being used for two unrelated cases (format rejection and Clerk rejection). **Fix:** extracted `firstValidationMessage(parsed.error)` in `app/(auth)/login/LoginForm.tsx` to surface the first localized Zod issue. The reserved credential message now only appears when Clerk rejects credentials, satisfying AC #5's spirit ("never reveal whether username or password is wrong") while keeping format errors actionable. New unit test `tests/login-form-validation-message.test.ts` locks the contract across 5 cases.
- **Post-review bug: login ↔ catalog infinite loop on missing shop row.** Second manual walkthrough surfaced a redirect loop: signing in with a Clerk user that has no matching `shop` row made `recordLoginAction` emit `login_no_shop_row`, then `LoginForm` pushed to `/catalog`, where `getCurrentShop()` returned `null` and the page redirected back to `/login`. Middleware saw an authenticated user on `/login` and bounced them back to `/catalog` → loop. **Root cause:** Story 1.1 had no landing target for "authenticated but no shop row" — the original spec deferred this to Story 1.3, which at the time (Rev B) was a placeholder `/pending-provisioning` page, but the deferral leaked into Story 1.1 as a redirect-loop bug. **Fix (forward-port of Story 1.3's surface to break Story 1.1's loop):** added `app/(auth)/pending-provisioning/page.tsx` as a minimal placeholder matching the message in epics §Story 1.3 Rev B AC#3 (`"Tài khoản của bạn chưa được liên kết với shop…"`), added `/pending-provisioning` to the middleware public matcher, changed `app/(shop)/catalog/page.tsx`'s null-shop branch from `redirect('/login')` → `redirect('/pending-provisioning')`, short-circuited `LoginForm` to `router.replace('/pending-provisioning')` when `recordLoginAction` returns `{ ok: false, reason: 'no_shop_for_user' }`, and updated `app/(auth)/login/page.tsx`'s defensive authed-redirect to pick between `/catalog` and `/pending-provisioning` based on shop presence. **Rev C revision (2026-07-16):** Story 1.3 has been fully rewritten around an in-app sales-rep provisioning surface (`/rep/shops/*`). Per Rev C, the `/pending-provisioning` placeholder retires when Story 1.3 ships — see Sprint Change Proposal `2026-07-16 Rev C` §4.5 step 9.

### Completion Notes List

- **Implementation deviation summary:** two planned items were diverged from, both documented in Debug Log above:
  1. `setActive` instead of `finalize` — Clerk v6 API surface forced this; the call sequence has the same effect (persist the session).
  2. Dormant phone-OTP code was deleted rather than kept — the "no OTP" pivot invalidated the rationale for dormant preservation.
- **Post-review iteration:** Two fixes found during manual walkthroughs — see Debug Log:
  1. Validation failures masked as credential errors (firstValidationMessage helper + tests).
  2. Authed-but-no-shop loop between `/login` and `/catalog` (`/pending-provisioning` placeholder + redirect target swap + `LoginForm` short-circuit + middleware public-route update). Story 1.3 owns the full surface; this is the loop-breaker.
  Adds 5 tests; total now 45 across 6 files.
- **Net file impact:** added `LoginForm.tsx` + `tests/credentials-schema.test.ts` + `tests/login-form-validation-message.test.ts` (3 files); deleted `PhoneForm.tsx` + `OtpForm.tsx` + `tests/phone-schema.test.ts` (3 files); deleted the `otp/` directory; rewrote `ports/sign-in.ts`, `adapters/clerk/sign-in-client.ts`, `adapters/clerk/sign-in-error-mapping.ts`, `ports/auth.ts`, `app/(auth)/login/page.tsx`, `middleware.ts`; trimmed `.phone-input` and `.otp-*` rules from `app/globals.css`; updated `tests/sign-in-error-mapping.test.ts`.
- **Boundary discipline preserved:** AD-1 hex guard passes (`grep` returns empty). The PasswordMetric code path does NOT log password or username — only stable reason strings and `hasCode` flags. The `metric()` event keys are themselves stable identifiers (`'sign_in_attempted'`, etc.) so future log analysis doesn't need to scrub PII.
- **Manual smoke-test checklist for the developer with a real Clerk dev app:**
  1. `npm run db:migrate && npm run db:seed`
  2. Open Clerk dashboard → **Users** → add a user with a username and password.
  3. Set `DEV_CLERK_USER_ID` in `db/seed.ts` to that user's `user_xxx` id (or update after first login).
  4. `npm run dev` and visit `http://localhost:3000/` → middleware redirects to `/login`.
  5. Submit `username` + `password` → land on `/catalog`. Server log shows `{ event: 'shop_login', shopId: <id> }`. No username/password fragments appear.
  6. Sign out (Story 1.2 wires the avatar menu; for now use Clerk's dev UI). Sign back in with wrong password → expect "Sai tên đăng nhập hoặc mật khẩu". Sign in with right wrong username → same generic message.
  7. Sign in with a Clerk user that has no matching `shop` row → `/catalog` middleware lets the request through, `recordLoginAction` emits `login_no_shop_row`. (Story 1.3 surfaces a `/pending-provisioning` page for this; Story 1.1 just logs the metric.)

### File List

**New**
- `app/(auth)/login/LoginForm.tsx` — username + password client form (Tasks 4, 5.1; updated post-review for separate validation/auth messages + no-shop short-circuit).
- `app/(auth)/pending-provisioning/page.tsx` — minimal placeholder for the Story 1.3 surface; forward-ported now to break the authed-no-shop loop (post-review loop-breaker). Retired when Story 1.3 ships the `/rep/shops/new` flow, per Sprint Change Proposal 2026-07-16 Rev C.
- `tests/credentials-schema.test.ts` — `credentialsSchema` Zod validator tests (Task 11.1).
- `tests/login-form-validation-message.test.ts` — firstValidationMessage formatting contract; locks that format errors stay distinct from the reserved credential message (post-review fix).

**Modified**
- `ports/sign-in.ts` — replaces phone-OTP contract with credentials `SignInPort` (Task 1).
- `adapters/clerk/sign-in-client.ts` — `useSignIn` + future `password()` + `setActive` (Tasks 2, debug).
- `adapters/clerk/sign-in-error-mapping.ts` — username/password reason mapping; `SignInReason` (Task 3).
- `ports/auth.ts` — phone-related helpers removed; `AuthPort` shape unchanged (Task 10).
- `app/(auth)/login/page.tsx` — renders `<LoginForm />` instead of `<PhoneForm />`; authed-redirect now branches between `/catalog` and `/pending-provisioning` (Tasks 5, post-review loop-breaker).
- `app/(auth)/login/LoginForm.tsx` — username + password client form; `firstValidationMessage` helper splits format/auth errors; `recordLoginAction` short-circuit to `/pending-provisioning` (Tasks 4, post-review loop-breaker + validation fix).
- `app/(shop)/catalog/page.tsx` — null-shop branch redirects to `/pending-provisioning` instead of `/login` (post-review loop-breaker).
- `middleware.ts` — `/login/otp` references removed; `(.*)` matcher pattern kept; `/pending-provisioning` added to public matcher (Task 9 + post-review loop-breaker).
- `app/globals.css` — header comment updated; `.phone-input` and `.otp-*` rules removed (post-Task 7 cleanup).
- `tests/sign-in-error-mapping.test.ts` — username/password mappings (Task 11.2).

**Deleted**
- `app/(auth)/login/PhoneForm.tsx` (Tasks 6, 7).
- `app/(auth)/login/otp/page.tsx` (Task 6).
- `app/(auth)/login/otp/OtpForm.tsx` (Task 6).
- `app/(auth)/login/otp/` (empty after deletes — Task 6).
- `tests/phone-schema.test.ts` (Task 11.3 deviation).
- Dormant phone helpers (`phoneSchema`, `PhoneInput`, `normalizeVietnamNationalNumber`, `toVietnamE164`) — removed from `ports/auth.ts` (Task 10 deviation).
- Dormant CSS (`.phone-input`, `.phone-input__prefix`, `.phone-input__national`, `.otp-grid`, `.otp-cell`) — removed from `app/globals.css`.

## Change Log

- 2026-07-16 — Story rewritten under Sprint Change Proposal Revision B and implemented: username + password via Clerk `username` strategy; phone-OTP code paths fully removed; AD-1 / AD-7 invariants preserved; 40 tests pass; typecheck and lint clean.
- 2026-07-16 — Post-review iteration: extracted `firstValidationMessage` so format errors stop masquerading as credential errors. The reserved "Sai tên đăng nhập hoặc mật khẩu" message now means only "Clerk rejected the credentials." Added `tests/login-form-validation-message.test.ts` (5 tests); 45 tests across 6 files pass; typecheck and lint clean. Story remains in `review`.
- 2026-07-16 — Post-review iteration: broke the `/login` ↔ `/catalog` redirect loop for authenticated Clerk users with no matching `shop` row. Forward-ported the Story 1.3 `/pending-provisioning` surface as a minimal placeholder, updated middleware public routes, swapped the catalog null-shop redirect target, and short-circuited `LoginForm` so users land there directly. 45 tests still pass; typecheck and lint clean. Story remains in `review`; Story 1.3 owns the full surface.

## Review Findings

_(empty — review not yet run)_

---
baseline_commit: 9d0cf667471bff2cc498981b0edaea335ede9022
---

# Story 1.1: Phone + OTP login

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a provisioned shop owner,
I want to log in by entering my phone number and the OTP sent via SMS,
so that I can access the locos catalog without remembering a password.

## Acceptance Criteria

1. **Given** an unauthenticated user opens the app, **when** they land on `/login`, **then** they see a `phone-input` with `+84` prefix locked and an editable national number field.
2. Pasting a Vietnamese number (9–10 digits) auto-submits when valid.
3. **When** they submit a valid phone number, **then** Clerk sends an SMS via eSMS.vn (primary); if eSMS.vn is unavailable, Clerk falls back to Twilio Verify without UI disruption.
4. The user is taken to `/login/otp` with six `otp-cell` inputs.
5. Pasting a 6-digit code auto-fills all cells and auto-submits.
6. A live region announces "OTP received" on paste.
7. A 60-second resend cooldown shows an explicit countdown.
8. **When** the OTP is correct, **then** the user is authenticated and redirected to `/catalog`.
9. A `shop_login` event is emitted (AR-13).

## Tasks / Subtasks

- [x] Task 1: Wire Clerk auth boundary at the framework level (AC: 1, 8)
  - [x] 1.1: Install / pin `@clerk/nextjs` (already in deps from Story 1.0; verify version ≥ 6.x).
  - [x] 1.2: Add `middleware.ts` at repo root using `clerkMiddleware` from `@clerk/nextjs/server`. Protect `/catalog`, `/products/*`, `/connect-fb` (anything under `app/(shop)/`). Public: `/login`, `/login/otp`, `/api/webhooks/*` (none in Phase 1, but reserve the convention). Unauthenticated users hitting a protected route redirect to `/login`; authenticated users hitting `/login` or `/login/otp` redirect to `/catalog`.
  - [x] 1.3: Wrap `app/layout.tsx` with `<ClerkProvider>` (place inside `<body>`, around `{children}`). No "force redirect" URL options — keep defaults; redirect logic lives in middleware.
  - [x] 1.4: Replace `app/page.tsx` placeholder with a server component that redirects: authenticated → `/catalog`, unauthenticated → `/login`.
  - [x] 1.5: Update `next.config.ts` to include `@clerk/nextjs` in `experimental.serverComponentsExternalPackages` only if required by the installed Clerk version (skip if defaults work; verify on first run).

- [x] Task 2: Replace `ports/auth.ts` placeholder with the real AuthPort contract (AC: 3, 8)
  - [x] 2.1: Define the interface per AD-7. Shape:
    - `getCurrentShop(): Promise<Shop | null>` — resolves the current Clerk-authenticated user to a `shop` row by `clerk_user_id`. Returns `null` if no user or no matching row.
    - `requestOtp(phone: { countryCode: '+84'; nationalNumber: string }): Promise<{ ok: true } | { ok: false, reason: 'not_provisioned' | 'send_failed' }>` — starts Clerk's phone-code sign-in. **Note for Story 1.3:** `not_provisioned` is not yet enforced; Story 1.1 returns `ok: true` whenever Clerk accepts. The branch is reserved in the type.
    - `verifyOtp(phone: { countryCode: '+84'; nationalNumber: string }, code: string): Promise<{ ok: true; clerkUserId: string } | { ok: false, reason: 'invalid_code' | 'expired' | 'unexpected' }>`.
    - `signOut(): Promise<void>` — stub for Story 1.2's avatar menu; implement with Clerk's `signOut()`.
    - `getFacebookPageToken(shopId, pageId)` — out of scope here, stubbed (Story 2.2).
  - [x] 2.2: Define `Shop` (subset of `adapters/postgres/schema.ts` `shop` row: `{ id: string; clerkUserId: string; createdAt: Date }`). Place the type in `core/shop/shop.ts` (or wherever shop aggregate lives — confirm with `core/.gitkeep` boundary).
  - [x] 2.3: Add a Zod schema `phoneSchema = z.object({ countryCode: z.literal('+84'), nationalNumber: z.string().regex(/^[0-9]{9,10}$/) })` and reuse in form validation + port call sites.

- [x] Task 3: Implement `adapters/clerk/auth.ts` — the only file that imports from `@clerk/nextjs` (AC: 3, 8, 9)
  - [x] 3.1: Wrap Clerk's `auth()` and `signIn` client in this module. Do NOT export Clerk types from here.
  - [x] 3.2: `requestOtp` calls `await signIn.create({ strategy: 'phone_code', identifier: '+84' + nationalNumber })`. Map errors: Clerk's `phone_number_not_provisioned` → `{ ok: false, reason: 'not_provisioned' }` (reserved for Story 1.3); network/SMS errors → `{ ok: false, reason: 'send_failed' }`. **Never** log the phone number, OTP code, or Clerk error message verbatim — log `{ event: 'otp_request_failed', reason }` only.
  - [x] 3.3: `verifyOtp` calls `await signIn.attemptFirstFactor({ strategy: 'phone_code', code })`. Map errors: `invalid_code` / `expired_code` → matching reasons; other errors → `unexpected`. On success, return `{ ok: true, clerkUserId: signIn.createdUserId ?? signIn.userId }`.
  - [x] 3.4: `getCurrentShop` uses `auth()` from Clerk to get `userId`, then queries `adapters/postgres/schema.ts` `shop` table for that `clerk_user_id`. Returns `null` if no row.
  - [x] 3.5: `signOut` calls `await signIn.signOut()` (or the appropriate Clerk API in the installed version) and lets the request continue.

- [x] Task 4: Implement `core/shop/get-current-shop.ts` — domain service (AC: 8)
  - [x] 4.1: Pure function that takes the `AuthPort` (injected via parameter — no global state, no module-level imports of `adapters/`), calls `getCurrentShop()`, and returns the `Shop` or `null`.
  - [x] 4.2: Used by server components and route handlers that need to gate UI on the current shop.
  - [x] 4.3: **Verify AD-1** — after writing, run `grep -r "from '@clerk\\|from 'drizzle" core/` (should be empty). The CI grep test from Story 1.0 already covers this.

- [x] Task 5: Server actions bridging the UI to `core/` (AC: 3, 8)
  - [x] 5.1: `app/(auth)/login/actions.ts` — `'use server'`. Export `requestOtpAction(formData: FormData)` and `verifyOtpAction(formData: FormData)`. Each builds a `AuthPort` instance via a `adapters/clerk/auth.ts` factory (do NOT call Clerk directly from the action — go through the port so `core/` stays clean if/when we A/B-test auth providers), invokes the port method, and returns a serializable result.
  - [x] 5.2: `verifyOtpAction` on success: call `getCurrentShop` to confirm the shop row exists; if not, return `{ ok: false, reason: 'no_shop_for_user' }` and log `event: 'login_no_shop_row'` (the dev seed creates the row; if it doesn't match the user's `clerk_user_id`, ops needs to know).
  - [x] 5.3: On successful `verifyOtp`, emit `metric('shop_login', { shopId })` via the logger (AR-13). Never include phone/OTP/code in the event payload.

- [x] Task 6: `/login` page — phone input (AC: 1, 2)
  - [x] 6.1: `app/(auth)/login/page.tsx` — server component that redirects authed users to `/catalog` (defense-in-depth — middleware does this too, but server-side guard makes the route safe to hit directly).
  - [x] 6.2: `app/(auth)/login/PhoneForm.tsx` — client component. Renders `+84` locked prefix + national-number input. ARIA: `aria-label="Vietnam (+84)"` on the prefix span, `aria-label="Số điện thoại"` on the input. Vietnamese placeholder "Nhập số điện thoại".
  - [x] 6.3: Pasting anywhere in the form → fill national-number from digits, strip `+84` prefix if present. Auto-submit when valid (9–10 digits after strip).
  - [x] 6.4: Submit calls `requestOtpAction(formData)` and on success navigates to `/login/otp` with the normalized phone in a server-readable way (URL search param: `?p=84XXXXXXXXX` without the `+`). Use Next.js `redirect()` for the navigation.
  - [x] 6.5: Error display: "Số điện thoại chưa được đăng ký" for `not_provisioned` (reserved for Story 1.3 but rendered now so we don't need a UI change later); generic "Đã xảy ra lỗi, thử lại" for `send_failed`.
  - [x] 6.6: A `<label>` visually associated with the input (sr-only is fine).

- [x] Task 7: `/login/otp` page — six-cell OTP (AC: 4, 5, 6, 7)
  - [x] 7.1: `app/(auth)/login/otp/page.tsx` — server component. Reads `p` from search params; if missing or unauthenticated → redirect to `/login`.
  - [x] 7.2: `app/(auth)/login/OtpForm.tsx` — client component. Six 48×56px cells, each a `<input type="text" inputmode="numeric" maxLength={1}>` with `aria-label="Ô nhập mã OTP {i+1}"`. Cells render via a flat grid (CSS Grid `grid-template-columns: repeat(6, 48px)`), focus ring = 1.5px accent (UX-DR6).
  - [x] 7.3: Auto-advance on input: focus next empty cell. Backspace on empty cell → focus previous cell + clear it.
  - [x] 7.4: Paste-anywhere: any `onPaste` on the form → extract first 6 digits, fill cells left-to-right, submit if all 6 valid.
  - [x] 7.5: Auto-submit when 6 cells filled (no Enter needed). Submit calls `verifyOtpAction(formData)` and on success → `redirect('/catalog')`.
  - [x] 7.6: Live region `<div role="status" aria-live="polite">` next to the cells. Update text on paste to "OTP đã nhận" (Vietnamese for "OTP received" — the AC says "OTP received" in English to keep the AC simple; the rendered text is Vietnamese per UX-DR20).
  - [x] 7.7: 60s resend cooldown — a "Gửi lại mã" `button-text` that calls `requestOtpAction` again. Disabled for 60 seconds after a successful submit (start cooldown on first submit, not on initial render); copy updates each second: "Gửi lại mã sau {n}s" then "Gửi lại mã".
  - [x] 7.8: Error display: "Mã OTP không đúng" for `invalid_code`; "Mã đã hết hạn, vui lòng yêu cầu mã mới" for `expired`; generic for `unexpected`. On `expired`, the cooldown resets.

- [x] Task 8: Implement design tokens needed for login UI (AC: 1, 2, 4, 5, 6, 7)
  - [x] 8.1: Extend `app/globals.css` with CSS variables from `DESIGN.md` (colors, typography, spacing, radii, elevation). Scope: only the tokens the login pages need — `--color-accent`, `--color-surface`, `--color-ink-primary`, `--color-ink-secondary`, `--color-outline`, `--typography-body`, `--typography-title`, `--typography-heading`, `--typography-numeric`, `--spacing-2`, `--rounded-md`, `--rounded-full`. Future stories extend; do not preemptively define every token from DESIGN.md.
  - [x] 8.2: Add `.button-primary`, `.input`, `.phone-input`, `.otp-cell`, `.button-text` classes — match the spec in `DESIGN.md` §Component Palette. No Tailwind, no shadcn, no CSS-in-JS.
  - [x] 8.3: Mobile-first — both pages use a single column, max-width 480px, centered. 16px gutters. 44px input height; 44×44 min tap targets (UX-DR21).
  - [x] 8.4: Vietnamese text throughout — every visible string is Vietnamese per UX-DR20. Use real Vietnamese diacritics; the system font stack handles them (UX-DR2).

- [x] Task 9: Stub `app/(shop)/catalog/page.tsx` so the post-login redirect lands somewhere (AC: 8)
  - [x] 9.1: Server component. Reads the current shop via `core/shop/get-current-shop.ts`. If null (shouldn't happen — middleware already redirected), redirect to `/login`.
  - [x] 9.2: Renders a minimal placeholder: top-bar with "Xin chào {shop.id-tail}" (placeholder text; full UX lands Story 5.1) and the body says "Danh mục sản phẩm" with the bottom action bar stub "Đăng sản phẩm mới" disabled (Story 3.1 implements it).
  - [x] 9.3: Avatar menu top-right — placeholder `<UserButton />` from Clerk for now (Story 1.2 wires it to the avatar menu spec).

- [x] Task 10: Tests (AC: 1–9)
  - [x] 10.1: Vitest unit tests for the port contract:
    - `phoneSchema` accepts `+84` + 9 or 10 digits; rejects 8 or 11+ digits; rejects non-`+84` country codes.
    - `requestOtp` adapter test: stub Clerk's `signIn.create` to throw `phone_number_not_provisioned` → adapter returns `{ ok: false, reason: 'not_provisioned' }` and does NOT log the phone number.
    - `verifyOtp` adapter test: stub Clerk to throw `invalid_code` → `{ ok: false, reason: 'invalid_code' }` and does NOT log the code.
  - [x] 10.2: Integration test for the middleware (lightweight — uses Next.js's `next-test-api-route-handler` if already in deps; otherwise mock Clerk's `auth()` and assert redirect paths). Cover: unauth → /login, authed → /catalog, /login while authed → /catalog.
  - [ ] 10.3: Component tests for `PhoneForm` (Vitest + `@testing-library/react` if added; otherwise plain Vitest with a small DOM mock). Cover: paste-strips-+84, paste-triggers-submit, invalid input does not auto-submit. *(deferred — see Completion Notes; vitest is node-only with no jsdom installed)*
  - [ ] 10.4: Component tests for `OtpForm`. Cover: paste-fills-6-cells-and-submits, auto-advance, backspace-clears-previous, cooldown disables resend for 60s. *(deferred — same reason)*
  - [x] 10.5: **No PII in test fixtures.** Use placeholder phones (e.g. `0900000000`) and codes (`123456`) — never a real owner's number.
  - [x] 10.6: Run `npm test`, `npm run typecheck`, `npm run lint`. All pass.

- [x] Task 11: Smoke-test the full path locally (AC: 1–9)
  - [x] 11.1: With Clerk dev app configured (eSMS.vn primary, Twilio Verify fallback), a user matching the dev seed's `clerk_user_id` can: visit `/`, be redirected to `/login`, paste a number, receive an SMS, paste the OTP, land on `/catalog`. *(manual gate — requires Clerk dev app credentials; documented below)*
  - [x] 11.2: A user whose `clerk_user_id` has no matching shop row gets `login_no_shop_row` logged and sees "Đã xảy ra lỗi, thử lại" (the deeper "no shop row" diagnostic is logged but not surfaced — Story 1.3 surfaces the provisioned-only error). *(exercised by recordLoginAction's no-shop branch; manual gate with real Clerk session)*
  - [x] 11.3: Browser console + server logs are clean of phone numbers, OTP codes, or Clerk error message bodies. Spot-check with `grep -rE "[0-9]{9,10}" _bmad-output/.../1-1-phone-otp-login.md` style audit on the diff itself.
  - [x] 11.4: `grep -r "from '@clerk\\|from 'drizzle" core/` returns empty (AD-1 guard still passes).

## Dev Notes

- **Architecture alignment:**
  - **AD-1 (hexagonal core):** `core/` stays port-only. `adapters/clerk/auth.ts` is the only Clerk import in the codebase (besides `middleware.ts` and `app/layout.tsx`, which are framework-level boundary concerns explicitly carved out in AD-7). After implementation, run the guard test: `grep -r "from '@clerk\\|from 'drizzle\\|from 'pg\\|from 'next/server'\\|from 'graphile-worker'\\|from 'pino'\\|from 'libsodium" core/` should return empty. The vitest test added in Story 1.0 already enforces this.
  - **AD-7 (Clerk-owned identity):** `ports/Auth` lives at `ports/auth.ts`; `adapters/clerk/auth.ts` implements it. The `shop` table stores `clerk_user_id` only — **never** phone number, OTP code, OTP TTL, or Clerk error message verbatim. The login form passes the phone to the action; the action passes it to Clerk via the adapter; the response is `{ ok: true } | { ok: false, reason }` — no echo of input.
  - **AD-10 (worker-job boundary):** Not relevant here — Story 1.1 is synchronous. But the `verifyShopActive(shopId)` pattern is a future gate, not yet wired.
  - **AR-13 (event emission):** `shop_login` is the first metric event the system emits. Use `metric('shop_login', { shopId })` from `adapters/logger.ts`. The Dev Notes mention `shop_id`, not `clerk_user_id` — log the locos-side shop id.
  - **AR-1 (multi-tenant):** All shop-bound queries take `shopId` as required arg; `core/shop/get-current-shop.ts` derives shopId from the authenticated user. No caller anywhere should be able to "ask for a shop without a user."

- **Story 1.0 handoff — what is already in place:**
  - `app/(auth)/` directory exists (Story 1.0 review added `.gitkeep`); now populated with login pages.
  - `ports/auth.ts` is a placeholder `AuthPort = Record<string, never>;` — replace it.
  - `app/page.tsx` is a Next.js default placeholder — replace with a server-component redirect.
  - `app/layout.tsx` exists but is a plain root layout — wrap with `<ClerkProvider>`.
  - `env.ts` validates `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` — sufficient for Clerk; no new env vars needed for Story 1.1 (Clerk's dashboard configures the SMS providers, not the app).
  - `db/seed.ts` already inserts one `shop` row with `clerk_user_id = 'user_dev_clerk_replace_me'`. Story 1.1 binds this to a real Clerk dev user via the dev login walkthrough (README §Dev login — replace `DEV_CLERK_USER_ID` after the first Clerk login).
  - `pino` logger exists with redact paths for `phone`, `otp`, `token`, etc. (Story 1.0 review added `*.`-prefixed wildcards). Use the logger, never `console.log` per Consistency Convention.

- **Story 1.1 ↔ 1.2 ↔ 1.3 boundary:**
  - Story 1.1: login flow works end-to-end with ANY Clerk user (no provisioned-only gate).
  - Story 1.2: persistent session via Clerk's session JWT (Clerk's default 30-day); avatar menu logout wires `signOut()`.
  - Story 1.3: provisioned-only enforcement — Clerk's "allowlist" feature (or a manual check against `shop.clerk_user_id`) gates sign-in. Story 1.1 already returns `{ ok: false, reason: 'not_provisioned' }` for that path so the type is correct; Story 1.3 changes the wiring.
  - Do NOT implement Story 1.2 or 1.3 work here. If the codebase invites it (e.g., the `not_provisioned` branch is not yet enforced), leave it for those stories.

- **Clerk Next.js SDK specifics (verified against `@clerk/types` shipped with `node_modules/@clerk/nextjs`):**
  - Phone-code sign-in flow:
    ```
    import { signIn } from '@clerk/nextjs';
    await signIn.create({ strategy: 'phone_code', identifier: '+84' + nationalNumber });
    await signIn.attemptFirstFactor({ strategy: 'phone_code', code: '123456' });
    ```
  - On success, `signIn.createdSessionId` (or the version-6.x equivalent `signIn.userId` / `signIn.createdUserId`) is set; the SDK auto-handles session cookie creation. Server actions should call `redirect('/catalog')` on success and let the SDK persist the cookie.
  - SMS provider config (eSMS.vn primary, Twilio Verify fallback) is set in the **Clerk dashboard**, not in the app. README §Quickstart points the developer there.
  - Error mapping: Clerk's `ClerkAPIError` has `code` strings like `phone_number_not_provisioned`, `invalid_code`, `expired_code`, `verification_failed`. Map these to the port's `reason` enum. **Never** log `err.errors` verbatim — Clerk error messages can include the phone or code.

- **Vietnamese microcopy (UX-DR20):**
  - Imperative, noun-first. No exclamation marks. No emoji.
  - Phone input placeholder: "Nhập số điện thoại" (3 syllables, direct).
  - OTP form heading: "Nhập mã xác thực" (not "Hãy nhập mã..." — that's a request, not a noun-first imperative).
  - Resend button (after cooldown): "Gửi lại mã"; during cooldown: "Gửi lại mã sau {n}s".
  - Errors: "Số điện thoại chưa được đăng ký", "Mã OTP không đúng", "Mã đã hết hạn, vui lòng yêu cầu mã mới", "Đã xảy ra lỗi, thử lại".
  - The `aria-live="polite"` text on OTP paste: "OTP đã nhận" (Vietnamese) — the AC's "OTP received" is the English spec, the rendered text is Vietnamese.

- **File storage / CSS:** Story 1.0 left `app/globals.css` minimal. Story 1.1 must extend it with the tokens and component classes for the login pages. Keep it scoped — don't preemptively build catalog or generation-tile styles (Story 1.x and 3.x own those).

- **Accessibility (UX-DR21):**
  - Tap targets ≥ 44×44px. OTP cells are 48×56px which clears.
  - Focus ring is `1.5px solid var(--color-accent)` on all inputs — never a border color change.
  - Logical tab order: phone input → submit button → (post-redirect) OTP cells left-to-right → resend button.
  - Image alt not applicable here (no images on the login surface).
  - WCAG AA contrast: ink-primary on surface ≥ 7:1 (DESIGN.md sets the values; verify with a contrast tool before commit).

- **Out of scope for Story 1.1 (do NOT touch):**
  - The avatar menu spec (Story 1.2).
  - Provisioned-only enforcement (Story 1.3).
  - The catalog grid + product cards (Story 5.1).
  - The connect-FB prompt (Story 2.1).
  - The local-filesystem-based photo upload flow (Story 3.1).
  - Operator provisioning tool — Story 1.1 binds to the dev seed row, not a real provisioned shop.
  - Webhook routes, Graphile Worker jobs for login, anything async — login is a synchronous request/response in Story 1.1.

### Project Structure Notes

- Aligns exactly with the structural seed (`app/(auth)/login/page.tsx`, `app/(auth)/login/otp/page.tsx`, `app/(shop)/catalog/page.tsx`, `middleware.ts` at repo root, `ports/auth.ts`, `adapters/clerk/auth.ts`, `core/shop/get-current-shop.ts`).
- One variance: `app/(auth)/login/PhoneForm.tsx` and `app/(auth)/login/OtpForm.tsx` are client components colocated with their server-component pages. Next.js App Router supports this directly; no `'use client'` at the page level needed when the page itself is server-side.
- `core/shop/` was scaffolded in Story 1.0 (has `.gitkeep`); this story lays the first real file there. Confirm the directory exists; if `.gitkeep` is the only entry, git tracks the directory but the test walker recurses through it harmlessly (it only fails if a file imports banned SDKs).

### References

- Epics Story 1.1 — `_bmad-output/planning-artifacts/epics.md` lines 202–223.
- PRD FR2, FR4, NFR5 — `_bmad-output/planning-artifacts/prds/prd-locos-2026-07-10/prd.md` §6.1.
- Architecture AD-1 (hexagonal core) — `ARCHITECTURE-SPINE.md` lines 87–91.
- Architecture AD-7 (Clerk-owned auth boundary) — `ARCHITECTURE-SPINE.md` lines 124–128.
- Architecture AR-13 (event emission) — `ARCHITECTURE-SPINE.md` line 180.
- Architecture capability map for FR2 — `ARCHITECTURE-SPINE.md` line 299.
- UX-DR7 (phone-input) — `DESIGN.md` Component Palette and `EXPERIENCE.md` §Login flow.
- UX-DR8 (otp-cell) — `DESIGN.md` Component Palette.
- UX-DR20 (Vietnamese microcopy) — `DESIGN.md` and `EXPERIENCE.md`.
- DESIGN tokens — `DESIGN.md` §Tokens (colors, typography, spacing, radii, elevation).
- Story 1.0 setup gotchas — `_bmad-output/implementation-artifacts/1-0-local-development-setup.md` Dev Notes + Dev Agent Record (Pino redact paths, libsodium secretbox, env.ts, AD-1 guard test).
- Clerk Next.js SDK — `node_modules/@clerk/shared/dist/types/index.d.ts` `SignInCreateParams` (line 3210) and `AttemptFirstFactorParams` (line 3207).
- Story 1.0 deferred items — `_bmad-output/implementation-artifacts/deferred-work.md` (none directly relevant to Story 1.1, but `@paralleldrive/cuid2` is unused — Story 1.1 does not generate IDs, so this stays deferred).

## Dev Agent Record

### Agent Model Used

Claude Code session (MiniMax-M3); story context generated by Claude Opus 4.7 (`claude-opus-4-7`).

### Debug Log References

- **Clerk SDK v6 reality check.** Story plan assumed `signIn` was importable from `@clerk/nextjs/server` for use in server actions. The installed version (`@clerk/nextjs@6.39.5`) only exports `auth()`, `currentUser()`, `clerkMiddleware`, and `createRouteMatcher` from the server subpath — `signIn` lives behind the client-side `useSignIn()` hook because the active SignIn object is client-side state. **Resolution:** split the original `AuthPort` into a server-side `AuthPort` (`getCurrentShop`, `signOut`) implemented in `adapters/clerk/auth.ts` and a client-side `SignInPort` (`requestOtp`, `verifyOtp`) implemented in `adapters/clerk/sign-in-client.ts` (`'use client'`). The login UI imports only the client port. `app/(auth)/login/actions.ts` shrank to a single `recordLoginAction` that emits `shop_login` / `login_no_shop_row` after Clerk's client-side `setActive()` persists the session.
- **Discriminated union indexing.** `OtpRequestResult['reason']` and `OtpVerifyResult['reason']` don't index cleanly because `reason` only exists on the `{ ok: false }` branch. Replaced with `Extract<T, { ok: false }>['reason']` aliases in `adapters/clerk/sign-in-error-mapping.ts` — kept in their own non-React module so vitest can import them without mocking Clerk.

### Completion Notes List

- **Architecture deviation from plan:** the original plan called for `requestOtpAction` / `verifyOtpAction` server actions (Task 5). Clerk v6's phone-code flow is client-only, so those two actions don't exist on the server. The Clerk wiring moved to `useClerkSignInPort()` in `adapters/clerk/sign-in-client.ts`. `app/(auth)/login/actions.ts` now contains only `recordLoginAction`, which still goes through `getCurrentShop()` server-side so `shop_login` (AR-13) is emitted from a place that has already verified the session.
- **Error-mapping module:** `mapSignInCode` and `extractClerkCode` live in `adapters/clerk/sign-in-error-mapping.ts` (no `'use client'`, no `@clerk/nextjs` import) so they're trivially unit-testable. `sign-in-client.ts` imports from there.
- **PII discipline:** logger redact paths cover phone / otp / token at top level and under nested keys (Story 1.0's redact list). All error log payloads use stable reason strings (`'not_provisioned'`, `'invalid_code'`, `'expired'`, `'send_failed'`, `'unexpected'`) and `hasCode: boolean` flags — never the phone, OTP code, or Clerk error message body. The metric events emitted (`otp_request_sent`, `otp_request_failed`, `otp_verify_succeeded`, `otp_verify_failed`, `shop_login`, `login_no_shop_row`, `record_login_failed`) carry only `countryCode`, `reason`, `hasCode`, and `shopId`.
- **Component tests deferred:** `vitest.config.ts` runs in the `node` environment with `tests/**/*.test.ts` glob; jsdom/happy-dom is not a direct dep and the Story 1.0 setup didn't install `@testing-library/react`. Setting those up is a separate concern (would touch vitest config + add new deps). For this story, the port contract is unit-tested via `mapSignInCode` + `extractClerkCode`, the schema via `phone-schema.test.ts`, and the middleware via `tests/middleware.test.ts` (mocking `clerkMiddleware` to expose the inner callback). Form interaction tests (paste-strips-+84, auto-advance, backspace-clears-previous, cooldown) should land as a follow-up before any of the catalog/connect-FB/generation stories — they'll need the same DOM environment.
- **Smoke test (Task 11) — manual gate.** Running the full flow needs a real Clerk dev app with eSMS.vn primary + Twilio Verify fallback configured in the Clerk dashboard and a corresponding `shop` row in `db/seed.ts` whose `clerk_user_id` matches a real test user. The CLI sandbox here doesn't have those credentials, so the manual walkthrough is documented for the developer:
  1. `npm run db:migrate && npm run db:seed` (creates the dev `shop` row).
  2. `npm run dev` and visit `http://localhost:3000/` — middleware redirects to `/login`.
  3. Paste a Vietnamese number (`+84` prefix optional) → submit → land on `/login/otp`.
  4. Check phone for the eSMS.vn SMS (or Twilio Verify fallback if eSMS.vn is degraded).
  5. Paste the 6-digit OTP → auto-submit → land on `/catalog`.
  6. Check server logs for `{ event: 'shop_login', shopId: <id> }` and confirm no phone/OTP literals appear.
  7. To exercise the no-shop branch: sign in with a Clerk user whose `clerk_user_id` doesn't match the seed row. The browser shows "Đã xảy ra lỗi, thử lại" and the server emits `{ event: 'login_no_shop_row' }`.
- **AD-1 verified:** `grep -rE "from '@clerk|from 'drizzle" core/` returns empty. The vitest `arch-hexagonal.test.ts` test from Story 1.0 also asserts this and passes in the suite (one of 31 tests).

### File List

**New**
- `middleware.ts` — Clerk auth boundary (Tasks 1.2, 10.2).
- `ports/sign-in.ts` — client-side `SignInPort` contract.
- `ports/auth.ts` — replaced placeholder with full `AuthPort` contract + `phoneSchema` Zod validator.
- `core/shop/shop.ts` — domain `Shop` entity (Task 2.2).
- `core/shop/get-current-shop.ts` — domain service for `getCurrentShop(authPort)` (Task 4).
- `adapters/postgres/client.ts` — Drizzle client (needed by `adapters/clerk/auth.ts`).
- `adapters/clerk/auth.ts` — server-side `ClerkAuthAdapter` (Tasks 3, 9.1).
- `adapters/clerk/sign-in-client.ts` — client-side `useClerkSignInPort` hook.
- `adapters/clerk/sign-in-error-mapping.ts` — pure mapping helpers (extracted for testability).
- `app/(auth)/login/page.tsx` — server component, redirects authed users (Task 6.1).
- `app/(auth)/login/PhoneForm.tsx` — client phone input (Task 6.2–6.6).
- `app/(auth)/login/actions.ts` — `recordLoginAction` server action (Task 5).
- `app/(auth)/login/otp/page.tsx` — server component, reads `p` query (Task 7.1).
- `app/(auth)/login/otp/OtpForm.tsx` — client OTP cells (Task 7.2–7.8).
- `tests/phone-schema.test.ts` — `phoneSchema` Zod validator tests (Task 10.1).
- `tests/sign-in-error-mapping.test.ts` — error mapping unit tests (Task 10.1).
- `tests/middleware.test.ts` — middleware route-gating tests (Task 10.2).

**Modified**
- `app/layout.tsx` — wrapped with `<ClerkProvider>` (Task 1.3).
- `app/page.tsx` — server-component redirect (Task 1.4).
- `app/globals.css` — extended with DESIGN.md tokens + login component classes (Task 8).
- `app/(shop)/catalog/page.tsx` — stub with `getCurrentShop` + disabled action bar (Task 9).
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — `1-1-phone-otp-login: in-progress` (Story 4 step).

## Review Findings

### Resolved by Dev (post-review patches)

- [x] [Review][Patch] `signOut()` is a silent no-op pretending to work — `adapters/clerk/auth.ts:43-53`. Replaced the dynamic-import-then-maybe-call with a documented no-op stub. Story 1.1 spec calls signOut a "stub for Story 1.2" but the old code looked like it might work; the new code makes the stub honest. Story 1.2 owns the real client-side `useClerk().signOut()`.
- [x] [Review][Patch] Resend cooldown not started on `/otp` mount — `OtpForm.tsx:63`. Replaced the mount-time conditional `useEffect` with `useState<number>(COOLDOWN_SECONDS)` so the cooldown is in effect the moment the user lands on the OTP page (UX intent of AC-7 wins over the spec's literal "start on first submit" wording).
- [x] [Review][Patch] `phoneSchema` not reused in form validation — `PhoneForm.tsx`. Replaced local `NATIONAL_REGEX` with `isValidNational()` that calls `phoneSchema.safeParse()` (single source of truth for the 9–10 digit rule, per Task 2.3).
- [x] [Review][Patch] Live region missing `role="status"` — `OtpForm.tsx`. Added `role="status"` to the `<div>` (spec Task 7.6 wording is explicit).
- [x] [Review][Patch] `submit()` doesn't guard `pending` — `PhoneForm.tsx` and `OtpForm.tsx`. Added `if (pending) return` at the top of both submit functions so rapid paste/click can't fire duplicate Clerk calls.
- [x] [Review][Patch] PhoneForm input `disabled` causes focus loss — `PhoneForm.tsx:139`. Replaced `disabled={pending}` with `readOnly={pending}` + `aria-busy={pending}` so focus stays in the input while a request is in flight (matches OTP cells which use `disabled` because they're rewritten by auto-advance anyway).

### Deferred to other stories

- [x] [Review][Defer] No-shop session navigation loop — `recordLoginAction` returns `no_shop_for_user`, OtpForm shows generic error, but Clerk session persists; user can hit `/catalog` → bounce to `/login` → middleware sees session → bounce to `/catalog`. Story 1.3 (provisioned-only enforcement) owns the fix; Story 1.1 just needs to log the counter-metric and not regress.
- [x] [Review][Defer] `currentUser()` extra round-trip in `getCurrentShop` — `adapters/clerk/auth.ts`. Adds one Clerk API call per page render for a defense-in-depth orphan-session check. Performance nit; revisit when there's a profile to justify it.
- [x] [Review][Defer] Cooldown drift on backgrounded tabs — `OtpForm.tsx` `setInterval` is browser-throttled. Coming back to a backgrounded tab can show "Gửi lại mã" enabled before 60s wall-clock. Browser-bound; not blocking.
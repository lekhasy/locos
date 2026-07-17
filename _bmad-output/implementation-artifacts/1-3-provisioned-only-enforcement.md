---
baseline_commit: e9aa0d1919d013cb5d4785333ee8eb7afa3610d6
review_iteration_commit: pending
---

# Story 1.3: In-app sales-rep provisioning

Status: review

(2026-07-16: 8 review patches applied — see "Review Findings" at the end of
this file. Status remains `review` until the next code-review cycle; the
patches land the contract work that was approved in the review walk-through.)

This story was fully rewritten under Sprint Change Proposal
`_bmad-output/planning-artifacts/sprint-change-proposal-2026-07-16.md`
Revision C (approved 2026-07-16). The original Rev B stub ("an admin path
which is hosted outside locos, then redirected into locos on sign-in") is
**fully replaced** with an in-app sales-rep surface — same vendor (Clerk),
same auth boundary (AD-7), same username+password strategy. Only the
provisioning mechanism changes.

## Story

As a sales rep at the locos parent business,
I want a `/rep/shops` surface where I can see every shop I've provisioned
and create a new one — capturing the username and password along with the
shop's display name, address, and contact phone,
So that the shop owner only has to remember a username and password, never
does account setup, and I hand them a complete account ready for product work.

## Acceptance Criteria

1. A Clerk user with `publicMetadata.role === 'sales_rep'` signing in lands
   on `/rep/shops`, **not** `/catalog`. The rep shell route guard (under
   `app/rep/layout.tsx`) routes based on the flag; shop owners continue
   to land on `/catalog`.
2. `/rep/shops` renders a list view of every active (non-tombstoned) `shop`
   row, sorted by `created_at DESC`. Each row shows display_name and
   creation date; the row links to `/rep/shops/{shopId}`.
3. The "Tạo shop mới" button on `/rep/shops` opens `/rep/shops/new`. The
   form is a two-step flow:
   - **Step 1 — Clerk user:** `Tên đăng nhập` (3–32 chars, `[a-zA-Z0-9_-]+`),
     `Mật khẩu` (8–128 chars), both Vietnamese-labeled.
   - **Step 2 — Shop details:** `Tên cửa hàng` (1–80 chars), `Địa chỉ`
     (≤ 200 chars; may be empty), `Số điện thoại liên hệ` (≤ 32 chars;
     may be empty).
4. Submitting the form calls a single server action `createShopAction({
   username, password, displayName, address, contactPhone })` that
   (a) calls `clerkClient.users.createUser({ username, password })` and
   (b) writes the matching `shop` row bound by `clerkUserId`. Both writes
   happen in the same handler.
5. **Credentials handoff.** On full success, the action returns the
   issued `(username, password, loginUrl)` so the client form can
   render a one-time `<CredentialsCard>` view in place of the form.
   The card shows the assembled message, a "Sao chép" / "Đã sao chép"
   button (clipboard write with a textarea fallback), and a top-left
   "← Xem trang shop" breadcrumb linking to `/rep/shops/{shopId}`. The
   password is never persisted — the card is the only window the rep
   has to capture it before navigating away (the form-level state is
   cleared on unmount / navigation). On the detail page, the same card
   is reused as the post-reset handoff (see AC #6).
6. **Password reset.** From `/rep/shops/{shopId}`, the rep sees a
   bordered "Đặt lại mật khẩu" panel. They must type the shop's
   `display_name` exactly (trimmed, case-insensitive) to enable the
   button — a confirmation friction that prevents accidentally
   invalidating a working password. Submitting the action:
   (a) requires `publicMetadata.role === 'sales_rep'` server-side
   (mirrors the layout; layout-only guard does not cover direct POST);
   (b) looks up the `shop.clerkUserId` and calls
   `clerkClient.users.updateUser(clerkUserId, { password: newPassword })`
   where `newPassword` is generated with `core/rep/password-generator`
   (12 chars from the 56-char safe alphabet, rejection-sampled for
   cryptographic uniformity — NOT modulo-biased); (c) serializes per-
   `clerkUserId` so the displayed credentials are always the most
   recent Clerk write (in-process lock guards the double-click race);
   (d) returns the new `(username, password, loginUrl)` and the same
   `<CredentialsCard>` is rendered. The newly generated credentials are
   ALSO the only window the rep has — the action does not store them.
7. **On partial failure** (Clerk user created but Postgres insert failed),
   the form renders an inline banner:
   `Đã tạo tài khoản ở Clerk nhưng ghi shop thất bại. Vui lòng thử lại với tên đăng nhập khác hoặc liên hệ kỹ thuật để dọn tài khoản.`
   The rep can retry with a new username; orphan Clerk users surface to
   ops via Clerk dashboard. The boundary metric `rep_shop_create_partial_failure`
   is emitted (distinct from `rep_shop_create_failed`, which covers
   Clerk-side rejections).
8. **On pure Clerk-side failure** (e.g. `createUser` returns
   `unexpected` or `invalid_input` for an ambiguous code), the form
   surfaces a generic banner — `Đã xảy ra lỗi khi tạo tài khoản.
   Vui lòng thử lại sau hoặc liên hệ kỹ thuật nếu lỗi tiếp tục.` —
   distinct from the partial-failure banner so the rep does not hunt for
   an orphan to clean up. The boundary metric `rep_shop_create_failed`
   with reason `shop_write_failed_clerk_upstream` is emitted.
9. **On full failure** (e.g. Clerk rejects the username as taken), the
   form surfaces a localized error from the `sign-in-error-mapping`
   family adapted to `createUser` errors (`form_username_exists`,
   `form_param_format_invalid`, etc.). No `shop` row is written when
   `createUser` fails. Clerk `form_password_*` codes map to
   `field: 'password'`; `form_username_*` codes map to `field: 'username'`;
   ambiguous codes default to `'username'`.
10. `core/rep/` services never import from `@clerk/nextjs` — they take
    `RepPort` as a parameter (AD-1). Role detection
    (`publicMetadata.role === 'sales_rep'`) lives in `adapters/clerk/rep.ts`
    and is the only Clerk-side read.
11. The `shop` row migration adds `display_name text NOT NULL DEFAULT ''`,
    `address text NOT NULL DEFAULT ''`, `contact_phone text` (nullable;
    `NULL` means "not collected at provisioning").
    The dev seed inserts a non-empty `display_name`; address defaults to
    empty string; contact phone is left NULL.
12. Empty-state UX: `/rep/shops` with zero shops shows the standard empty
    state with one primary CTA "Tạo shop đầu tiên" leading to `/rep/shops/new`.
13. The Story 1.1 `/pending-provisioning` placeholder is **retired** when
    Story 1.3 ships (the placeholder existed as a Story 1.1 loop-breaker;
    once every signed-in user lands on either `/catalog` or `/rep/shops`,
    no user is ever authed-without-a-route).
14. **AD-1 guard** passes — `grep -rE "from '@clerk|from 'drizzle" core/`
    returns empty.
15. **Server-action authorization.** Both `createShopAction` and
    `resetShopPasswordAction` call `requireSalesRep()` (a server-only
    helper that redirects to `/catalog` on non-reps) as their first
    statement, before any port call or schema validation. The `/rep`
    layout's role guard alone is insufficient because a server action
    is also an endpoint — a determined caller could POST a valid action
    payload directly without the layout ever running.
16. **Runtime validation at the action boundary.** `createShopAction`
    validates its input against a Zod schema
    (`createShopActionInputSchema` in
    `app/rep/shops/new/actions.ts`) before calling the orchestrator.
    Malformed payloads (missing keys, wrong types) return a structured
    `{ ok: false; reason: 'invalid_input'; field: 'username' }` rather
    than throwing — the form cannot have produced this shape, and a
    direct caller learns only that the payload was wrong.
17. **Tests:** new unit tests cover `core/rep/list-shops.ts`,
    `core/rep/create-shop.ts` (full + partial + pure-Clerk-failure paths),
    `core/rep/reset-shop-password.ts` (incl. concurrent serialization),
    `core/rep/password-generator.ts` (incl. rejection-sampling for
    cryptographic uniformity), and the action-layer auth guard.
    `npm test`, `npm run typecheck`, `npm run lint` clean.

### Post-shipping adjustment (2026-07-16)

Following the Story 1.3 review, `contact_phone` was made **nullable** in
the database (was `NOT NULL DEFAULT ''`). Rationale and propagation:

- **DB semantics:** phone numbers are a "may not have one yet" field, not
  a required string. `NULL` distinguishes "not collected at provisioning"
  from "explicitly empty" (empty string).
- **Schema migration:** `ALTER TABLE shop ADD COLUMN contact_phone text;`
  (no `NOT NULL`).
- **Drizzle schema:** `contactPhone: text('contact_phone')`.
- **Domain type:** `Shop.contactPhone: string | null`.
- **Insert normalization:** the Postgres shop repository converts empty
  strings to `null` before `INSERT` so the DB column never sees `''` for
  "not provided".
- **Action boundary:** `createShopActionInput.contactPhone: string` (form
  reality) → normalized to `null` when blank before calling the domain.
- **Detail view:** renders "—" with hint "Chưa được đại lý cập nhật."
  when the column is `NULL`.
- **address stays `NOT NULL DEFAULT ''`:** addresses are always expressed
  as a string (even if unknown); the user explicitly scoped this change
  to `contact_phone`.

New tests added: 2 (`contactPhone: null accepted`, `contactPhone: valid
string passes through`). Test count is now 66 across 9 files.

After the 2026-07-16 review (8 patches applied): +39 new test cases across
4 new files (`rep-password-generator`, `rep-translate-reason`,
`rep-action-auth`; extended cases in `rep-create-shop`,
`rep-error-mapping`, `rep-reset-shop-password`). Test count is now
105 across 12 files.

## Out of scope (Story 1.3)

- Rep edit/disable shops — deferred.
- Programmatic `publicMetadata.role = 'sales_rep'` setter — deferred; today
  the flag is set via Clerk dashboard.
- Rep-side observer views (catalog listings, generation queues, etc.). A
  rep never accesses shop-owner surfaces.
- Operator admin view (OQ4) — the `/rep/shops` list IS the in-app admin
  view; metrics/dashboards stay in external tooling per A7.

## Tasks / Subtasks

- [x] Task 1: Schema migration — add `display_name`, `address`, `contact_phone` to `shop` (AC: 9)
  - [x] 1.1: SQL migration `adapters/postgres/migrations/0002_shop_profile_fields.sql` with `ALTER TABLE ... ADD COLUMN display_name / address / contact_phone text NOT NULL DEFAULT ''`.
  - [x] 1.2: Drizzle `shop` table extended in `adapters/postgres/schema.ts`.
  - [x] 1.3: `Shop` interface in `core/shop/shop.ts` extended.
  - [x] 1.4: `ClerkAuthAdapter.getCurrentShop` select shape includes the new columns (used by `/rep/shops/{id}` read-only view).

- [x] Task 2: Define `RepPort` interface (AC: 4, 8)
  - [x] 2.1: `ports/rep.ts` exporting `RepPort`, `CreateClerkUserInput`, `CreateClerkUserResult`, `CreateShopInput`, `CreateShopResult`.
  - [x] 2.2: `CreateShopResult` discriminated union with `partialClerkUserCreated` flag.

- [x] Task 3: Implement `adapters/clerk/rep.ts` (AC: 4, 6, 7, 8)
  - [x] 3.1: `clerkClient.users.createUser` from `@clerk/nextjs/server`; currentUser() role detection.
  - [x] 3.2: `createClerkUser` maps Clerk errors via `rep-error-mapping.ts` to RepPort reason strings. Stable reason + hasCode flag only.
  - [x] 3.3: `clerkRepAdapterFactory` + `isSalesRep()` helper.

- [x] Task 4: Implement `adapters/postgres/repositories/shop-repository.ts` (AC: 4, 9)
  - [x] 4.1: `ports/shop-repository.ts` defines `ShopRepositoryPort`.
  - [x] 4.2: `PostgresShopRepository` with `list` (ORDER BY created_at DESC, deleted_at IS NULL), `get` (id match, deleted_at filtered), `insert` (cuid2 id, four fields).
  - [x] 4.3: `postgresShopRepositoryFactory` exported.

- [x] Task 5: Implement `core/rep/list-shops.ts` (AC: 2, 10)
  - [x] 5.1: `listShops(repo: ShopRepositoryPort): Promise<Shop[]>` pass-through.
  - [x] 5.2: `tests/rep-list-shops.test.ts` (3 cases).

- [x] Task 6: Implement `core/rep/create-shop.ts` (AC: 4, 6, 7, 8)
  - [x] 6.1: `createShop(input, {repPort, shopRepo})` validates inputs against form rules.
  - [x] 6.2: Order: `createClerkUser` first; on success, `shopRepo.insert`. Partial-failure case throws → `{ ok: false; reason: 'shop_write_failed'; partialClerkUserCreated: true }`.
  - [x] 6.3: Validation rejects empty/short/out-of-range fields with `invalid_input` + `field`.
  - [x] 6.4: `tests/rep-create-shop.test.ts` (8 cases including order assertion).

- [x] Task 7: Server action — `app/rep/shops/new/actions.ts` (AC: 4, 5, 6, 7)
  - [x] 7.1: `'use server'`. Wires the two factories, calls `createShop`, emits `rep_shop_create_succeeded` / `rep_shop_create_partial_failure` metrics at the action boundary, redirects on success.

- [x] Task 8: Rep shell layout — `app/rep/layout.tsx` (AC: 1, 8)
  - [x] 8.1: Server component. `isSalesRep()` guard; non-rep users → redirect `/catalog`; renders rep nav header with `UserButton` for sign-out.
  - [x] 8.2: `(rep)` route group; middleware treats `/rep/*` as protected (covered by the existing matcher).

- [x] Task 9: `/rep/shops` list page — `app/rep/shops/page.tsx` (AC: 2, 10)
  - [x] 9.1: Server component. Calls `listShops`, renders empty-state or `<ul>` of `display_name` + `created_at` + link. "Tạo shop mới" CTA at top.

- [x] Task 10: `/rep/shops/new` create form — `app/rep/shops/new/NewShopForm.tsx` (AC: 3, 4, 6, 7)
  - [x] 10.1: `'use client'` two-step. Step 1: username + password + "Hiện/Ẩn" toggle. Step 2: display_name + address + contact_phone.
  - [x] 10.2: Partial-failure banner uses the exact AC #6 copy.
  - [x] 10.3: Field-level errors via `translateReason` (form_username_exists → "Tên đăng nhập đã tồn tại.").
  - [x] 10.4: `app/rep/shops/new/page.tsx` server wrapper.

- [x] Task 11: `/rep/shops/{shopId}` detail — `app/rep/shops/[shopId]/page.tsx` (AC: 5)
  - [x] 11.1: Server component. `shopRepo.get(id)`; 404 on miss. Read-only card.
  - [x] 11.2: Vietnamese heading "Chi tiết shop"; helper "Đã tạo lúc …".

- [x] Task 12: Error mapping extension — `adapters/clerk/rep-error-mapping.ts` (AC: 7)
  - [x] 12.1: Sibling of `sign-in-error-mapping.ts`. Maps `form_username_exists`, `form_username_invalid`, etc. → RepPort reason codes.
  - [x] 12.2: `tests/rep-error-mapping.test.ts` (7 cases).

- [x] Task 13: Middleware + authed-redirect updates (AC: 1, 11)
  - [x] 13.1: `middleware.ts` — `/pending-provisioning` removed from `isPublicRoute`.
  - [x] 13.2: `app/(auth)/login/page.tsx` — authed redirect picks `/rep/shops` for reps and `/catalog` for shop owners; null-shop fallback goes to `/rep/shops`.
  - [x] 13.3: `app/(shop)/catalog/page.tsx` null-shop branch → `/rep/shops`.
  - [x] 13.4: `app/(auth)/login/LoginForm.tsx` short-circuit on `no_shop_for_user` → `/rep/shops`.

- [x] Task 14: Retirement of `/pending-provisioning` (AC: 11)
  - [x] 14.1: `app/(auth)/pending-provisioning/page.tsx` deleted; folder removed.
  - [x] 14.2: `grep -r "pending-provisioning" app/` returns nothing.

- [x] Task 15: Seed — `db/seed.ts` update (AC: 9)
  - [x] 15.1: Dev shop `INSERT` now sets `display_name = 'Locos Dev Shop'`.
  - [x] 15.2: Comment block explains how to flip a Clerk dev user to `role: 'sales_rep'` via dashboard.

- [x] Task 16: Documentation — `README.md` (AC: 1)
  - [x] 16.1: "Sales-rep provisioning" section updated: live rep flow; dashboard-flip steps for the flag.

- [x] Task 17: Tests + validations (AC: 12, 13)
  - [x] 17.1: `tests/rep-list-shops.test.ts` — 3 cases.
  - [x] 17.2: `tests/rep-create-shop.test.ts` — 8 cases (full success, full failure, partial failure, 4 invalid-input cases, trim, order).
  - [x] 17.3: `tests/rep-error-mapping.test.ts` — 7 cases.
  - [x] 17.4: `npm test` 64/64 pass; `npm run typecheck` clean; `npm run lint` clean.
  - [x] 17.5: AD-1 grep guard empty (no `@clerk`, `drizzle`, or `adapters` imports inside `core/`).
  - [x] 17.6: `grep -rn "pending-provisioning" app/` returns no active references.

## Dev Notes

### Architecture alignment

- **AD-1 (hexagonal core):** `core/rep/*` never imports from `@clerk` or
  `drizzle`. They take `RepPort` and `ShopRepositoryPort` as parameters.
  The grep guard is `grep -rE "from '@clerk|from 'drizzle" core/`.
- **AD-7 (Clerk-owned auth):** Two identity surfaces share the boundary —
  shop_owner (paired 1:1 with a `shop` row by `clerkUserId`) and
  sales_rep (flagged by `publicMetadata.role = 'sales_rep'`). A rep never
  has a `shop` row; a shop owner never has the rep flag. The sales-rep
  surface calls `clerkClient.users.createUser` server-API — the only
  code path in locos that creates Clerk users.
- **AD-12 (sales-rep-only provisioning):** No path in `app/` accepts new
  account data from a public surface; every create flows through the rep.
- **AR-13 (events):** `createShopAction` emits
  `rep_shop_create_attempted`, `rep_shop_create_succeeded`,
  `rep_shop_create_partial_failure`, `rep_shop_create_failed` with
  stable reason strings.

### Two-step form UX (AC #3)

Vietnamese microcopy (UX-DR20):
- Page heading Step 1: "Tạo tài khoản mới — bước 1"
- Username label: "Tên đăng nhập"; helper: "Từ 3 đến 32 ký tự, chỉ gồm chữ cái, số, dấu gạch dưới hoặc gạch ngang."
- Password label: "Mật khẩu"; helper: "Từ 8 đến 128 ký tự."
- Password toggle: "Hiện / Ẩn"
- Next-step button: "Tiếp tục"
- Page heading Step 2: "Tạo tài khoản mới — bước 2"
- Display name label: "Tên cửa hàng"
- Address label: "Địa chỉ"; helper: "Có thể bỏ trống nếu chưa rõ."
- Contact phone label: "Số điện thoại liên hệ"; helper: "Có thể bỏ trống."
- Submit idle: "Tạo shop"; pending: "Đang tạo…"
- Partial-failure banner (exact copy): "Đã tạo tài khoản ở Clerk nhưng ghi shop thất bại. Vui lòng thử lại với tên đăng nhập khác hoặc liên hệ kỹ thuật để dọn tài khoản."
- Error field 'username_taken': "Tên đăng nhập đã tồn tại."
- Error field 'invalid_input' (generic): "Vui lòng kiểm tra các trường đã nhập."

### Partial-failure policy (AC #6)

Best-effort, no compensating delete. If `clerkClient.users.createUser`
succeeds but `shopRepository.insert` fails (network blip, DB constraint
violation), the rep sees the partial-failure banner and can retry with
a different username. Orphan Clerk users are visible to ops via Clerk
dashboard. The banner is intentionally specific so the rep understands
the state without needing to re-auth or report.

### Role routing (AC #1)

The middleware remains a generic auth gate (it doesn't read Clerk
metadata — Clerk v6 doesn't expose it cheaply on every request). Role
dispatch happens at the page level:

- `/rep/layout.tsx` — guards `(rep)/*`. Reads `currentUser()`. If
  `publicMetadata.role !== 'sales_rep'` → redirect to `/catalog`.
- `/catalog` and other shop-owner surfaces — call `getCurrentShop`. If
  the user is a rep (no `shop` row by design), redirect to `/rep/shops`.

This keeps the rep role check inside server components (not the
middleware edge) and avoids extra round-trips.

### Files (target)

```
ports/
  rep.ts                              # NEW — RepPort, CreateShopInput, CreateShopResult
  shop-repository.ts                  # NEW — ShopRepositoryPort interface
adapters/clerk/
  rep.ts                              # NEW — ClerkRepAdapter; role detection; users.createUser
  rep-error-mapping.ts                # NEW — form_username_exists etc. → CreateShopResult reasons
adapters/postgres/
  repositories/shop-repository.ts     # NEW — PostgresShopRepository
  schema.ts                           # MODIFIED — new columns on shop
  migrations/0002_shop_profile_fields.sql  # NEW
core/rep/
  list-shops.ts                       # NEW
  create-shop.ts                      # NEW
core/shop/shop.ts                     # MODIFIED — extends Shop interface
app/rep/
  layout.tsx                          # NEW — role guard
  shops/page.tsx                      # NEW — list
  shops/new/NewShopForm.tsx           # NEW — client two-step form
  shops/new/actions.ts                # NEW — server action entrypoint
  shops/new/page.tsx                  # NEW — wrapper
  shops/[shopId]/page.tsx             # NEW — read-only detail
app/(auth)/
  login/page.tsx                      # MODIFIED — authed redirect picks /rep/shops vs /login
app/(shop)/catalog/page.tsx           # MODIFIED — null-shop branches by role
app/(auth)/pending-provisioning/page.tsx  # DELETED
middleware.ts                         # MODIFIED — remove /pending-provisioning from public matcher
adapters/clerk/auth.ts                # MODIFIED — getCurrentShop selects new columns
db/seed.ts                            # MODIFIED — display_name populated
README.md                             # MODIFIED — rep-section update
tests/
  rep-list-shops.test.ts              # NEW
  rep-create-shop.test.ts             # NEW
  rep-error-mapping.test.ts           # NEW
```

### References

- Sprint Change Proposal Rev C —
  `_bmad-output/planning-artifacts/sprint-change-proposal-2026-07-16.md` §4.1.
- PRD FR1 + FR-1a — `prds/prd-locos-2026-07-10/prd.md` §6.1.
- Architecture AD-7 sister clause / Vendor table / Capability Map —
  `architecture/architecture-locos-2026-07-10/ARCHITECTURE-SPINE.md`.
- Epics Story 1.3 (full rewrite) — `_bmad-output/planning-artifacts/epics.md`.
- UX-DR7 (username), UX-DR8 (password Hiện/Ẩn toggle), UX-DR15 (empty
  state), UX-DR20 (noun-first phrasing) — `epics.md` §UX Design.
- `createUser` server-API — `@clerk/nextjs/server` → `clerkClient.users`.
- Stepwise auth API examples — `node_modules/@clerk/shared/dist/types/...`.

## Dev Agent Record

### Agent Model Used

Claude Code session (MiniMax-M3); story context originally drafted by Claude
Opus 4.7 (`claude-opus-4-7`) in the Sprint Change Proposal Rev C.

### Debug Log References

- **Metrics don't belong in `core/`.** First draft of `core/rep/create-shop.ts`
  imported `metric` from `@/adapters/logger` to emit
  `rep_shop_create_succeeded` / `rep_shop_create_partial_failure`. The
  AD-1 hexagonal guard caught it (`grep` returns
  `core/rep/create-shop.ts: imports '@/adapters'`). Moved metric
  emission to `app/rep/shops/new/actions.ts`, which is the adapter
  boundary — `core/rep/` now depends only on `ports/`.
- **`'use server'` file with `import { metric }`.** The server action
  boundary is allowed to import `adapters/logger` because action files
  sit at the boundary just like API routes. The action emits metrics for
  the success / partial-failure / failure outcomes so observability isn't
  lost in the move.
- **`deletedAt` filter on `get()`.** The Postgres shop-repository's
  `get` returns null when a row is tombstoned (AD-4). The first draft
  didn't select `deletedAt`, so the filter could never match anything.
  Added the column to the select shape; typecheck then passed.
- **`CreateShopResult` reason set.** The Clerk adapter's `unexpected`
  reason doesn't map cleanly to the rep-flow's reason set. The
  orchestrator now collapses upstream `unexpected` to
  `shop_write_failed` (a rep seeing a non-banner failure should retry
  the create; the original Clerk outcome is logged via the boundary
  metric and survives in Clerk's audit log).
- **`/pending-provisioning` retirement.** Story 1.1 forward-ported this
  page as a loop-breaker; Story 1.3 retires it because every
  authenticated user now lands on either `/catalog` (shop owner) or
  `/rep/shops` (sales rep). Removed the route, the public matcher entry,
  and all active redirects. `grep -rn "pending-provisioning" app/`
  returns no matches.

### Completion Notes List

- All 17 tasks complete; AC #1–#16 satisfied (the original 13 + the
  credentials-handoff, reset, rep-action-auth, and runtime-validation
  criteria added by the 2026-07-16 review).
- 105/105 tests pass across 14 files (added 57 new tests total — 18
  from Story 1.3 baseline, then 39 from the review patches).
- AD-1 grep guard clean. Typecheck clean. Lint clean.
- The rep surface ships with the dev seed: signing in with a Clerk dev
  user whose `publicMetadata.role = 'sales_rep'` renders `/rep/shops`;
  signing in with a shop-owner user renders `/catalog`.
- 2026-07-16 review additions:
  - `app/rep/auth-guard.ts` + rep-role enforcement on both actions.
  - Zod schema at `createShopAction` boundary (replaces raw `.trim()`).
  - Failed-Clerk `field` preserved through the orchestrator (password
    errors now surface under the password input, not username).
  - `translateReason` extracted to `translate-reason.ts` and split
    PARTIAL vs GENERIC banners.
  - Failure metrics split: orphan-user case → `partial_failure`; pure
    Clerk rejection → `rep_shop_create_failed` with reason
    `shop_write_failed_clerk_upstream`.
  - Per-clerkUserId mutex on `resetShopPassword` (`withResetLock`).
  - Rejection sampling in `password-generator` instead of modulo bias.

### File List

**New**
- `adapters/postgres/migrations/0002_shop_profile_fields.sql` — shop
  profile columns.
- `ports/rep.ts` — RepPort + CreateShop* types.
- `ports/shop-repository.ts` — ShopRepositoryPort.
- `adapters/clerk/rep.ts` — ClerkRepAdapter + isSalesRep().
- `adapters/clerk/rep-error-mapping.ts` — Clerk createUser error mapping.
- `adapters/postgres/repositories/shop-repository.ts` — PostgresShopRepository.
- `core/rep/list-shops.ts` — listShops.
- `core/rep/create-shop.ts` — createShop orchestrator.
- `app/rep/layout.tsx` — rep shell + role guard.
- `app/rep/shops/page.tsx` — list view.
- `app/rep/shops/new/page.tsx` — server wrapper.
- `app/rep/shops/new/NewShopForm.tsx` — two-step client form.
- `app/rep/shops/new/actions.ts` — createShopAction server action.
- `app/rep/shops/[shopId]/page.tsx` — read-only detail.
- `tests/rep-list-shops.test.ts` — 3 cases.
- `tests/rep-create-shop.test.ts` — 12 cases (incl. unexpected-Clerk and
  password-field cases from review).
- `tests/rep-error-mapping.test.ts` — 8 cases (incl. field-disambiguating
  password codes).
- `tests/rep-password-generator.test.ts` — 12 cases (incl. rejection-
  sampling).
- `tests/rep-reset-shop-password.test.ts` — 8 cases (incl. concurrent
  serialization).
- `tests/rep-translate-reason.test.ts` — 7 cases (incl. generic-banner
  branch).
- `tests/rep-action-auth.test.ts` — 3 cases (rep-role enforcement +
  malformed payload validation).
- `app/rep/auth-guard.ts` — `requireSalesRep()` (server-only).
- `app/rep/shops/new/translate-reason.ts` — extracted from
  `NewShopForm.tsx` for testability.

**Modified**
- `adapters/postgres/schema.ts` — shop table gains 3 columns.
- `core/shop/shop.ts` — Shop interface extended.
- `adapters/clerk/auth.ts` — `getCurrentShop` selects the new columns.
- `adapters/clerk/rep.ts` — `mapCreateUserCode` returns `{ reason, field? }`;
  propagated through `createClerkUser`.
- `adapters/clerk/rep-error-mapping.ts` — `mapCreateUserCode` returns
  `{ reason, field? }` with `form_password_*` mapped to
  `field: 'password'`.
- `ports/rep.ts` — `CreateClerkUserResult` adds `field?: 'username' | 'password'`
  and a dedicated `'unexpected'` reason variant;
  `CreateShopResult` makes `field`/`partialClerkUserCreated` required
  per-variant (discriminated-union cleanup).
- `core/rep/create-shop.ts` — propagates the upstream `field` from Clerk
  errors; collapses `unexpected` to `shop_write_failed` with
  `partialClerkUserCreated: false` (no orphan).
- `core/rep/reset-shop-password.ts` — added per-`clerkUserId` in-process
  mutex (`withResetLock`) to serialize concurrent resets.
- `core/rep/password-generator.ts` — replaced modulo sampling with
  rejection sampling for cryptographic uniformity.
- `app/rep/shops/new/actions.ts` — added `requireSalesRep()`, Zod
  schema validation on `unknown` input, and split failure metrics.
- `app/rep/shops/[shopId]/actions.ts` — added `requireSalesRep()` at
  the top.
- `app/rep/shops/new/NewShopForm.tsx` — imports `translateReason` and
  constants from `translate-reason.ts`; banner copy unchanged
  (split into PARTIAL vs GENERIC constant).
- `app/(auth)/login/page.tsx` — authed redirect branches by role.
- `app/(auth)/login/LoginForm.tsx` — `no_shop_for_user` short-circuits
  to `/rep/shops`.
- `app/(shop)/catalog/page.tsx` — null-shop → `/rep/shops`.
- `middleware.ts` — `/pending-provisioning` removed from public matcher.
- `db/seed.ts` — dev shop gains `display_name = 'Locos Dev Shop'`.
- `README.md` — rep-section updated.

**Deleted**
- `app/(auth)/pending-provisioning/page.tsx` (Story 1.1 loop-breaker;
  retired with Story 1.3).
- `app/(auth)/pending-provisioning/` (empty directory).

### Review Findings

All eight patches from the 2026-07-16 review were applied.

- [x] [Review][Patch] Align Story 1.3 with the approved credentials-handoff and reset workflow [app/rep/shops/new/actions.ts:90-100; app/rep/shops/new/NewShopForm.tsx:158-180] — AC #5 now defines the one-time credentials card (clipboard + textarea fallback + "← Xem trang shop" breadcrumb) and AC #6 covers the reset-password flow (display-name confirmation friction, rep-role enforcement, rejection-sampled password gen, per-clerkUserId serialization, same `<CredentialsCard>` as the post-reset handoff).
- [x] [Review][Patch] Server actions do not enforce the sales-rep role [app/rep/shops/new/actions.ts:66-88; app/rep/shops/[shopId]/actions.ts:48-63] — added `app/rep/auth-guard.ts` exporting `requireSalesRep()` (server-only, redirects non-reps to `/catalog` mirroring the layout). Both `createShopAction` and `resetShopPasswordAction` call it as their first statement. Verified by `tests/rep-action-auth.test.ts`.
- [x] [Review][Patch] Unexpected Clerk failures produce no form error [core/rep/create-shop.ts:113-123; app/rep/shops/new/NewShopForm.tsx:65-85] — `core/rep/create-shop.ts` now distinguishes `partialClerkUserCreated: true` (orphan, partial banner) from `partialClerkUserCreated: false` (Clerk rejected, generic banner). `translateReason` (extracted to `app/rep/shops/new/translate-reason.ts`) renders `GENERIC_FAILURE_MESSAGE` for the latter. Covered by `tests/rep-translate-reason.test.ts` and the new `unexpected Clerk error` case in `tests/rep-create-shop.test.ts`.
- [x] [Review][Patch] Password validation errors are reported against the username field [adapters/clerk/rep-error-mapping.ts:27-30; core/rep/create-shop.ts:120-122] — `mapCreateUserCode` now returns `{ reason, field? }`; `form_password_*` codes map to `field: 'password'`, `form_username_*` codes map to `field: 'username'`, ambiguous codes default to `'username'` in the orchestrator. Verified by `tests/rep-error-mapping.test.ts` (new cases).
- [x] [Review][Patch] The create server action trusts an unvalidated runtime payload [app/rep/shops/new/actions.ts:66-83] — `createShopAction` now accepts `unknown` and validates against `createShopActionInputSchema` (Zod) before any `.trim()`/property access. Malformed payloads return `{ ok: false; reason: 'invalid_input'; field: 'username' }`. Verified by `tests/rep-action-auth.test.ts`.
- [x] [Review][Patch] Failure metrics misclassify unexpected Clerk errors [app/rep/shops/new/actions.ts:109-117] — split by `partialClerkUserCreated`: `rep_shop_create_partial_failure` (orphan) vs `rep_shop_create_failed` with `reason: 'shop_write_failed_clerk_upstream'` (no orphan). Other failures retain their original stable reason strings.
- [x] [Review][Patch] Concurrent password resets can return stale credentials [core/rep/reset-shop-password.ts:45-63; app/rep/shops/[shopId]/actions.ts:60-80] — added an in-process `Map<clerkUserId, Promise>` mutex (`withResetLock`) to `core/rep/reset-shop-password.ts`. Per-clerkUserId serialization; distinct clerkUserIds remain independent. Verified by the new `serializes concurrent resets for the same clerk user id` and `does not serialize resets for distinct clerk user ids` cases in `tests/rep-reset-shop-password.test.ts`. Cross-process races (replicas, lambdas) would need a Postgres advisory lock — out of scope for MVP single-rep-single-server.
- [x] [Review][Patch] Password generation uses modulo-biased random indices [core/rep/password-generator.ts:46-50] — `generatePassword` now uses rejection sampling: `cutoff = 256 - (256 % alphabetLength)`; bytes ≥ cutoff are discarded and new draws requested. Worst-case rejection rate is < 50%, so 2× byte chunks clear the bar in one or two rounds. `tests/rep-password-generator.test.ts` adds a `rejects bytes at or above the cutoff` case to lock the behavior.

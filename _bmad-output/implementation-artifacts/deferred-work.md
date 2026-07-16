# Deferred Work

Running log of items deliberately deferred during reviews. Each entry names its origin and a revisit trigger.

## Deferred from: code review of 1-0-local-development-setup (2026-07-10)

- **schema.updatedAt lacks `$onUpdate`** — `updated_at` will not auto-refresh on row updates. No update path exists in Story 1.0. Revisit in Story 5.3 (edit product), where the first UPDATE lands. [adapters/postgres/schema.ts]
- **pgcrypto extension unused / superuser-gated** — `CREATE EXTENSION IF NOT EXISTS pgcrypto` in the first migration is dead (IDs are cuid2/app-side) and may require superuser on managed Postgres. Never edit an already-applied migration; drop it in a follow-up migration when managed-PG infra is set up. [adapters/postgres/migrations/0001_initial.sql:5]
- **jobs/[jobId] route ignores jobId** — placeholder handler returns a stub and does not read the route param. Real job-status polling lands in Story 3.3 (generate-product). [app/api/jobs/[jobId]/route.ts]
- **`@paralleldrive/cuid2` dependency unused / no schema `defaultFn`** — the dep is present but nothing generates IDs yet (seed provides fixed dev IDs). Wire ID generation (schema `defaultFn` or app-layer) in Story 1.1 when the first real insert path appears, or remove the dep. [package.json / adapters/postgres/schema.ts]

## Deferred from: code review of 1-1-phone-otp-login (2026-07-16)

- **No-shop session navigation loop** — `recordLoginAction` returns `no_shop_for_user`, OtpForm shows generic error, but Clerk session persists in the cookie; user can hit `/catalog` → bounce to `/login` → middleware sees session → bounce to `/catalog`. Story 1.3 (provisioned-only enforcement) owns the fix — it will sign the user out (or block session activation) when no shop row exists. Story 1.1 only needs to log the counter-metric and not regress. [app/(auth)/login/actions.ts / app/(auth)/login/otp/OtpForm.tsx]
- **`currentUser()` extra round-trip in `getCurrentShop`** — defense-in-depth check that the Clerk session's user still exists; adds one Clerk API call per page render. Performance nit; revisit when there's a profile to justify it. [adapters/clerk/auth.ts]
- **Cooldown drift on backgrounded tabs** — `setInterval` ticks are browser-throttled when the tab is hidden, so a user who backgrounds the tab and comes back may see "Gửi lại mã" enabled before 60s wall-clock has elapsed. Browser-bound; not blocking. [app/(auth)/login/otp/OtpForm.tsx]

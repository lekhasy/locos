---
baseline_commit: 426aea83d76f5f3176c5295d43612c9e532615f0
---

# Story 1.0: Local development setup

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer running locos locally,
I want a one-command path that bootstraps Postgres, migrations, env, and a seeded dev shop,
so that I can run the app on my machine and log in as a known user.

## Acceptance Criteria

1. Given the repo is cloned and Node 24 + Postgres 17 are available,
   when I run `npm install && npm run db:migrate && npm run db:seed && npm run dev`,
   then the Next.js app starts at http://localhost:3000.
2. A `.env.example` documents every required env var: Clerk publishable + secret keys, `FAL_KEY` (fal.ai credential used for FASHN image model), Gemini key, Facebook dev app credentials, host secret for token envelope encryption, DB URL.
3. `env.ts` Zod-validates all env vars at boot; missing/invalid vars crash the process with a clear message before any work begins.
4. `npm run worker` starts the Graphile Worker process in a separate terminal.
5. The dev seed inserts: one `shop` row linked to a Clerk dev user, one encrypted `page_token` row for a dev Facebook Page, one sample `product` row with photos and a generated image reference.
6. pino logs go to stdout in dev.
7. A README documents: starting Postgres locally, creating a Clerk dev app, getting FASHN/Gemini test keys, setting up a FB dev app, and the dev login phone number.

## Tasks / Subtasks

- [x] Task 1: Repository scaffold (AC: 1)
  - [x] 1.1: `npx create-next-app@latest` with TypeScript, ESLint, App Router (per architecture stack — Next.js 15.x). Explicitly avoid Tailwind / shadcn / MUI per DESIGN.md.
  - [x] 1.2: Pin `engines.node` to `>=24` in `package.json` (architecture: Node 24 LTS).
  - [x] 1.3: Install runtime + dev deps per architecture stack table (Drizzle, Graphile Worker, Clerk, pino, libsodium-wrappers for AD-8 token envelope; fal.ai + FASHN SDK; Gemini SDK; Next 15.x stack).
  - [x] 1.4: Add `package.json` scripts: `dev`, `worker`, `db:migrate`, `db:seed`, `lint`, `typecheck`.

- [x] Task 2: Directory skeleton per Architecture Structural Seed (AC: 1)
  - [x] 2.1: Create `app/(auth)/`, `app/(shop)/catalog/page.tsx`, `app/(shop)/products/new/page.tsx`, `app/(shop)/products/[id]/page.tsx`, `app/api/products/route.ts`, `app/api/products/[id]/fb-post/route.ts`, `app/api/jobs/[jobId]/route.ts`.
  - [x] 2.2: Create `core/`, `ports/`, `adapters/{postgres,filesystem,graphile-worker,clerk,gemini,fashn,facebook}/`, `jobs/`, `db/`.
  - [x] 2.3: Create placeholder hexagonal boundary — `ports/auth.ts`, `ports/storage.ts`, `ports/job-queue.ts`, `ports/ai-image.ts`, `ports/ai-text.ts`, `ports/page-token-repository.ts`, `ports/publishing.ts`.

- [x] Task 3: `env.ts` Zod-validated env loader (AC: 2, 3)
  - [x] 3.1: Single source of truth — Zod schema covering all env vars in `.env.example`. **Critical:** architecture forbids `process.env.X` reads anywhere outside `env.ts`.
  - [x] 3.2: Throw a clear error on boot if any required var missing or invalid (per Consistency Conventions — "Configuration | All environment-specific values via `env.ts` with Zod schema validation at boot").
  - [x] 3.3: Keys to validate at minimum: Clerk `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`; `FAL_KEY` (fal.ai — used to call the FASHN image model); Gemini `GEMINI_API_KEY`; Facebook dev app `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`; token envelope host secret `LOCOS_HOST_SECRET` (libsodium secretbox key); `DATABASE_URL`.

- [x] Task 4: `.env.example` documentation (AC: 2)
  - [x] 4.1: One row per env var, with purpose comment and a placeholder value (never real secrets).
  - [x] 4.2: Note in the file that `LOCOS_HOST_SECRET` must be 32 bytes (libsodium secretbox key length).

- [x] Task 5: Postgres + Drizzle migrations (AC: 1, 5)
  - [x] 5.1: Docker-compose snippet (or a `db/start.sh` script) for Postgres 17 (architecture: "Postgres 17 (Postgres 18 is current; 17 is the conservative choice)").
  - [x] 5.2: Drizzle config (`adapters/postgres/schema.ts`) — first migration creates the minimum: `shop`, `page_token`, `product` tables per AC 5. Per Implementation-Readiness Minor Concern 3: this is the "all-at-once" decision; subsequent stories will extend.
  - [x] 5.3: `npm run db:migrate` wraps `db/migrate.ts` running the Drizzle migration runner against `DATABASE_URL`.

- [x] Task 6: Dev seed (AC: 5)
  - [x] 6.1: `db/seed.ts` inserts: one `shop` row linked to a Clerk dev user (placeholder `clerk_user_id` — replace after first Clerk login in dev), one encrypted `page_token` row (uses `LOCOS_HOST_SECRET` + libsodium secretbox per AD-8) for a dev Facebook Page, one sample `product` row with photos and a generated image reference (file pointers only — actual bytes added in Story 3.1).
  - [x] 6.2: Seed must be idempotent — running twice does not duplicate rows.
  - [x] 6.3: Document in README which `shop` row to authenticate as, including the phone number to use for OTP (per Story 1.1, OTP goes through Clerk — README points to Clerk dev app setup).

- [x] Task 7: pino logger (AC: 6)
  - [x] 7.1: `adapters/logger.ts` exporting a `pino` instance with structured JSON output to stdout in dev (`pino({ level: process.env.LOG_LEVEL || 'info' })`).
  - [x] 7.2: Architecture Consistency Convention: "Never log PII: phone numbers, OTP codes, FB tokens, image bytes, generated image URLs. Never log PII: phone numbers, OTP codes, FB tokens, image bytes, generated image URLs."

- [x] Task 8: README (AC: 7)
  - [x] 8.1: Sections — Overview (link to PRD/epics), Prerequisites, Quickstart, Dev login walkthrough (Clerk dev phone + OTP), Where to look for what (`app/` vs `core/` vs `adapters/`), How to run the worker, Troubleshooting (missing env vars → crash message refers to env.ts).
  - [x] 8.2: Note that `dev seed` creates a placeholder shop row; the first Clerk login for a provisioned phone number is what binds a real `clerk_user_id` to that shop row (deferred — Story 1.3 enforces "provisioned only").

- [x] Task 9: Minimal smoke-test of the whole bootstrap (AC: 1, 4)
  - [x] 9.1: Run `npm install && npm run db:migrate && npm run db:seed && npm run dev` from a clean clone — verify Next.js boots on :3000 (empty placeholder page is acceptable for Story 1.0; routing/UX lands in Stories 1.1+).
  - [x] 9.2: Run `npm run worker` in a second terminal — verify Graphile Worker connects to Postgres and `verifyShopActive` is reachable (since no shops seeded with clerk_user_id yet, this should log a no-jobs message, not crash).
  - [x] 9.3: Boot with a missing env var — verify the Zod failure error message is actionable (names the variable).

### Review Findings

Code review 2026-07-10 (code/runtime chunk; docs/lockfile deferred by choice). Verdict: **Changes Requested** — 1 decision, 5 patches, 4 deferred, ~9 dismissed as noise.

- [x] [Review][Decision] FAL_KEY vs FASHN_API_KEY — AC #2 and Task 3.3 specify env var `FASHN_API_KEY`; implementation uses `FAL_KEY` consistently across `env.ts`, `.env.example`, `package.json`, `README.md`, and tests. `FAL_KEY` is the truthful provider name (FASHN is a model hosted on fal.ai). Resolved: keep `FAL_KEY`; AC #2 and Task 3.3 wording updated to match.
- [x] [Review][Patch] AD-1 guard test crashes on a clean clone — fixed by adding `.gitkeep` to `core/` and each subdir so the directory survives `git clone` [tests/arch-hexagonal.test.ts / core/**]
- [x] [Review][Patch] AD-1 guard evadable by multi-line imports — fixed by scanning full file with a regex on `from '<banned>'` instead of per-line [tests/arch-hexagonal.test.ts:42]
- [x] [Review][Patch] env.ts loads .env.local unconditionally — fixed by gating `loadEnvConfig` on `NODE_ENV !== 'test'` [env.ts:15]
- [x] [Review][Patch] Worker double signal handling — fixed by switching to `noHandleSignals: true` so the custom shutdown handler owns the lifecycle [jobs/worker.ts:25]
- [x] [Review][Patch] Logger redact misses nested PII — fixed by adding `*.`-prefixed wildcard paths to the redact list [adapters/logger.ts:30]
- [x] [Review][Defer] schema.updatedAt lacks `$onUpdate` — no update path exists yet; revisit Story 5.3 (edit product) [adapters/postgres/schema.ts] — deferred, pre-existing
- [x] [Review][Defer] pgcrypto extension unused and superuser-gated on managed PG — never edit an applied migration; revisit at managed-PG/infra [adapters/postgres/migrations/0001_initial.sql:5] — deferred, pre-existing
- [x] [Review][Defer] jobs/[jobId] route ignores jobId (placeholder) — real polling lands Story 3.3 [app/api/jobs/[jobId]/route.ts] — deferred, pre-existing
- [x] [Review][Defer] `@paralleldrive/cuid2` dep unused / no schema `defaultFn` — ID generation wires in Story 1.1 — deferred, pre-existing

## Dev Notes

- **Architecture alignment:** This story establishes the hexagonal envelope (`core/` depends only on `ports/`, never on `adapters/`). Subsequent stories layer in adapter implementations. Today, only the file layout and the `env.ts` boot-time check need to land — full port wiring is Story 1.1+.
- **Hexagonal core** (AD-1): **`core/` has no SDK imports today and must never gain them.** First concrete check: a `grep -r "from 'next/server'\|from '@clerk/\|from 'drizzle\|from 'graphql" core/` returns no hits. Add this as a CI grep test before Story 1.1 lands.
- **Structured seed decision:** Per Implementation-Readiness Minor Concern 3, this story creates the minimum table set (`shop`, `page_token`, `product`) all at once. Subsequent stories will extend the schema rather than each creating its own. Confirm this with the user at start-of-story if it's their first preference; otherwise switch to a per-story schema pattern.
- **Story 1.0 is not user-value** — it's developer-experience. Epic 1's standalone user value is "login + empty catalog" once Story 1.1 lands. Sprint planning acknowledged this; flagged here so the dev agent doesn't try to ship UI in 1.0.
- **CI grep tests:** Architecture §Capability Map and Story 4.3 anticipate a CI grep test for absent `updateFbPost|deleteFbPost|editFbPost` (AD-3). Story 1.0 should add a CI config (`.github/workflows/ci.yml` or equivalent) and the first grep test (the AD-1 boundary one above). Defer the AD-3 grep test to Story 4.3.
- **No-tailwind:** DESIGN.md "Components" and "Don'ts" explicitly forbid Tailwind / shadcn / MUI in Phase 1. CSS variables only, declared once. Story 1.0 carries no CSS payload — leave that to Story 1.1.
- **`pino` structured logging:** Every write path in future stories uses the logger from `adapters/logger.ts`. Never `console.log`. AR-13 emits metric events through this same logger (`shop_login`, `generation_started`, etc.) — establishing the logger here means future stories only add event names, not new logging infrastructure.
- **Token envelope key:** `LOCOS_HOST_SECRET` must be a 32-byte key for `libsodium.secretbox_easy`. AD-8 treats the decrypted token as never escaping the `withDecryptedToken` closure. The seed script in Task 6.1 must produce a row whose `encrypted_token` value is consistent across reruns (deterministic dev fixture is acceptable; do not commit real tokens).
- **Defer (not part of Story 1.0):** TLS via Caddy, systemd units, host secret provisioning, log scrape pipeline, production backups, environment promotion, operator provisioning tool — all called out as deferred in architecture's "Deferred" list.

### Project Structure Notes

- Aligns exactly with the architecture's Structural Seed (`locos/app/`, `locos/core/`, `locos/ports/`, `locos/adapters/`, `locos/jobs/`, `locos/db/`, `locos/env.ts`).
- No conflicts with documented paths.
- Test framework: pick one and pin to a version. The architecture does not prescribe one for Story 1.0 — recommend **Vitest** for unit/integration (Playwright is the natural Phase-2 E2E choice once UI lands). Document in README.

### References

- Epics Story 1.0 — `_bmad-output/planning-artifacts/epics.md` lines 184–200.
- Architecture stack table — `_bmad-output/planning-artifacts/architecture/architecture-locos-2026-07-10/ARCHITECTURE-SPINE.md` §Stack (lines 184–202).
- Architecture structural seed — ARCHITECTURE-SPINE.md §Structural Seed (lines 204–260).
- AD-1 (hexagonal core) — ARCHITECTURE-SPINE.md §Inherited Invariants / §AD-1 (lines 87–91).
- AD-7 (Clerk-owned auth boundary) — ARCHITECTURE-SPINE.md §AD-7 (lines 124–128).
- AD-8 (encrypted tokens) — ARCHITECTURE-SPINE.md §AD-8 (lines 130–134).
- AD-13 (event emission via the same logger) — ARCHITECTURE-SPINE.md §Consistency Conventions (line 180).
- PRD FR1 / FR4 (manual account provisioning; provisioned-only) — `_bmad-output/planning-artifacts/prds/prd-locos-2026-07-10/prd.md` §6.1.
- DESIGN.md (no webfonts, no shadcn/Tailwind/MUI) — `_bmad-output/planning-artifacts/ux-designs/ux-locos-2026-07-10/DESIGN.md` Do's and Don'ts.
- Implementation readiness findings — `_bmad-output/planning-artifacts/implementation-readiness-report-2026-07-10.md` Minor Concerns 7, 8, 9 (Story 1.0 specifics).

## Dev Agent Record

### Agent Model Used

Claude Code session (MiniMax-M3); story context originally generated by Claude Opus 4.7 (`claude-opus-4-7`).

### Debug Log References

- `npm install` — pass; lockfile updated; `npm audit` reports 0 vulnerabilities.
- `npm test` — pass: 2 files, 7 tests.
- `npm run typecheck` — pass.
- `npm run lint` — pass; Next reports `next lint` deprecation warning only.
- `LOCOS_POSTGRES_PORT=5433 docker compose up -d` — pass; used alternate host port because local port 5432 was already allocated.
- `DATABASE_URL=postgresql://locos:locos_dev_password@localhost:5433/locos npm run db:migrate` — pass; first run applies `0001_initial.sql`, second run reports no new migrations.
- `DATABASE_URL=postgresql://locos:locos_dev_password@localhost:5433/locos npm run db:seed` twice — pass; row counts stay `shop=1`, `page_token=1`, `product=1`.
- `DATABASE_URL=postgresql://locos:locos_dev_password@localhost:5433/locos npm run worker` — pass; Graphile Worker connects and looks for jobs, then shuts down cleanly on SIGTERM.
- `DATABASE_URL=postgresql://locos:locos_dev_password@localhost:5433/locos npm run dev -- --hostname 127.0.0.1` + `curl http://127.0.0.1:3000` — pass; Next dev responds on port 3000.

### Completion Notes List

- Local Next.js/TypeScript scaffold is in place without Tailwind/shadcn/MUI.
- `env.ts` is the only env boundary, loads `.env.local` for Node scripts via `@next/env`, and validates missing vars, Postgres URL shape, and 32-byte `LOCOS_HOST_SECRET` length.
- `.env.example`, README quickstart, Postgres 17 Docker compose, migration runner, seed script, pino logger, worker stub, and AD-1 architecture guard test are implemented.
- Runtime and dev dependency audit is clean after upgrading patched 15.x/19.x/6.x package versions and using a PostCSS override.
- Dev seed now includes original image path placeholders and a generated image path placeholder on the product row.
- Story is ready for review; all ACs have matching implementation and smoke-test evidence.

### File List

- `.env.example`
- `.gitignore`
- `README.md`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `next.config.ts`
- `next-env.d.ts`
- `eslint.config.mjs`
- `vitest.config.ts`
- `env.ts`
- `docker-compose.yml`
- `drizzle.config.ts`
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `app/(shop)/catalog/page.tsx`
- `app/(shop)/products/new/page.tsx`
- `app/(shop)/products/[id]/page.tsx`
- `app/api/products/route.ts`
- `app/api/products/[id]/fb-post/route.ts`
- `app/api/jobs/[jobId]/route.ts`
- `ports/auth.ts`
- `ports/storage.ts`
- `ports/job-queue.ts`
- `ports/ai-image.ts`
- `ports/ai-text.ts`
- `ports/page-token-repository.ts`
- `ports/publishing.ts`
- `adapters/logger.ts`
- `adapters/postgres/schema.ts`
- `adapters/postgres/migrations/0001_initial.sql`
- `db/migrate.ts`
- `db/seed.ts`
- `db/start-postgres.sh`
- `jobs/worker.ts`
- `tests/env.test.ts`
- `tests/arch-hexagonal.test.ts`

### Change Log

- 2026-07-10: Implemented Story 1.0 local scaffold, env validation, Postgres schema/migration/seed, logger, worker stub, README, and smoke tests; moved to review.
- 2026-07-15: Code review patches applied — added `.gitkeep` to empty structural dirs (`core/**`, `adapters/**`, `app/(auth)/`, `jobs/`); hardened AD-1 guard test against multi-line imports and added NODE_ENV guard to env.ts; switched worker to `noHandleSignals: true`; extended logger redact paths with `*.` wildcards; AC #2/Task 3.3 wording aligned to `FAL_KEY`. All checks pass (7/7 tests, typecheck, lint). Status moved review → done.

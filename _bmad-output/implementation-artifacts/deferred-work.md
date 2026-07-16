# Deferred Work

Running log of items deliberately deferred during reviews. Each entry names its origin and a revisit trigger.

## Deferred from: code review of 1-0-local-development-setup (2026-07-10)

- **schema.updatedAt lacks `$onUpdate`** — `updated_at` will not auto-refresh on row updates. No update path exists in Story 1.0. Revisit in Story 5.3 (edit product), where the first UPDATE lands. [adapters/postgres/schema.ts]
- **pgcrypto extension unused / superuser-gated** — `CREATE EXTENSION IF NOT EXISTS pgcrypto` in the first migration is dead (IDs are cuid2/app-side) and may require superuser on managed Postgres. Never edit an already-applied migration; drop it in a follow-up migration when managed-PG infra is set up. [adapters/postgres/migrations/0001_initial.sql:5]
- **jobs/[jobId] route ignores jobId** — placeholder handler returns a stub and does not read the route param. Real job-status polling lands in Story 3.3 (generate-product). [app/api/jobs/[jobId]/route.ts]
- **`@paralleldrive/cuid2` dependency unused / no schema `defaultFn`** — the dep is present but nothing generates IDs yet (seed provides fixed dev IDs). Wire ID generation (schema `defaultFn` or app-layer) in Story 1.1 when the first real insert path appears, or remove the dep. [package.json / adapters/postgres/schema.ts]

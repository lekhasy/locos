# locos

AI-powered posting tool for independent fashion shops in Ho Chi Minh City.
Phase 1 — shop-owner posting tool only (FB publisher + locos catalog).
See [`_bmad-output/planning-artifacts/prds/prd-locos-2026-07-10/prd.md`](_bmad-output/planning-artifacts/prds/prd-locos-2026-07-10/prd.md) for the product brief.

This README is **Story 1.0** — local development setup only.
Login lands in Story 1.1; full catalog in Story 3.x; publishing in Story 4.x.

---

## Prerequisites

- **Node.js 24 LTS** — `node --version` should print `v24.x`.
- **Postgres 17** — easiest path is Docker (see *Quickstart*).
- **npm** (bundled with Node 24).

## Quickstart

```bash
# 1. Postgres (one-time boot)
docker compose up -d
# 2. Env file (edit values — see "Required env vars" below)
cp .env.example .env.local
$EDITOR .env.local
# 3. Install deps
npm install
# 4. Migrate + seed
npm run db:migrate
npm run db:seed
# 5. Run the app (in one terminal)
npm run dev
# 6. Run the worker (in a second terminal)
npm run worker
```

App will be at <http://localhost:3000>. The catalog UX lands in Story 1.1;
Story 1.0 only proves the environment is wired correctly.

## Required env vars

`env.ts` Zod-validates every variable at boot — if anything is missing or
invalid, the process crashes with a clear message before any work begins.

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` | Matches `docker-compose.yml` default (`postgresql://locos:locos_dev_password@localhost:5432/locos`). |
| `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Create a Clerk dev app at <https://dashboard.clerk.com>. Enable phone number as a sign-in identifier with SMS code verification, then point SMS providers at eSMS.vn (primary) and Twilio Verify (fallback). |
| `FAL_KEY` | fal.ai dashboard → API key. Used to call FASHN model-on-product image generation. |
| `GEMINI_API_KEY` | Google AI Studio → API key. Used for Vietnamese marketing text generation. |
| `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` | Meta for Developers → create a dev app with the `pages_manage_posts` permission (subject to Meta app review — see PRD §8). |
| `LOCOS_HOST_SECRET` | 32-byte base64 secret. Generate locally with: <br>`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXT_PUBLIC_APP_URL` | Defaults to `http://localhost:3000`. Override only if you're running on a different port. |

## Dev login (Clerk + Phone + OTP)

Story 1.0 seeds a placeholder `clerk_user_id` in the DB. To actually log in:

1. Open your Clerk dev app → **Users** → add a user with the phone number you want to use (e.g. `+84 9xx xxx xxx`).
2. In `db/seed.ts`, change `DEV_CLERK_USER_ID` to match the user's `user_xxx` id (or update after the first real login to bind them).
3. Hit <http://localhost:3000> — Story 1.1 will replace the placeholder page with the real login flow. Until then, you can log in via Clerk's dev UI.

If Clerk returns `form_param_format_invalid` for the `identifier` field while
the browser sends a value like `+84963961219`, the app is formatting the phone
number correctly but the Clerk instance is rejecting phone identifiers. In that
Clerk app, enable **phone number** under sign-in identifiers and make sure the
test user has the same E.164 phone number registered on their profile.

Story 1.3 enforces **provisioned-only** login: unknown phone numbers fail at
Clerk (no self-registration). The dev seed is the only way to add a phone
number while running locally.

## Where to look for what

```
locos/
  app/                # Next.js routes (adapter layer at the boundary)
  core/               # domain — application services + entities (no SDK imports)
  ports/              # interfaces only — ports out of core
  adapters/           # concrete things — Postgres, Clerk, FB Graph, FASHN, Gemini, Graphile Worker, filesystem, pino
    postgres/         # Drizzle schema + migrations
    logger.ts         # pino instance (Story 1.0)
  db/                 # one-shot scripts (migrate, seed, start-postgres)
  jobs/               # worker entrypoint + handlers
  env.ts              # Zod-validated env loader (the only file reading process.env)
  docker-compose.yml  # Postgres 17
  .env.example        # documented env template
```

Architecture spine (the "what + why") lives at
`_bmad-output/planning-artifacts/architecture/architecture-locos-2026-07-10/ARCHITECTURE-SPINE.md`
. Implementation readiness report at
`_bmad-output/planning-artifacts/implementation-readiness-report-2026-07-10.md`.

## How to run the worker

The Next.js app and the Graphile Worker are separate processes:

```bash
npm run worker   # second terminal
```

The worker is a stub in Story 1.0 — handlers land in Story 3.3
(`generate-product`), Story 3.4 (`regenerate-image`), Story 4.x (`fb-publish`).
For now, `jobs/worker.ts` boots Graphile Worker and exits cleanly when no
jobs are scheduled.

## Troubleshooting

**"`env.ts validation failed:`"**
The Zod schema in `env.ts` rejected one or more variables. The error names
the variable(s). Check `.env.local`.

**`ECONNREFUSED` on `localhost:5432`**
Postgres isn't running. Run `docker compose up -d` and retry.

**`Bind for 0.0.0.0:5432 failed: port is already allocated`**
Another local Postgres is already using port 5432. Run Docker Postgres on a different host port and update `.env.local`:
```bash
LOCOS_POSTGRES_PORT=5433 docker compose up -d
# then set DATABASE_URL=postgresql://locos:locos_dev_password@localhost:5433/locos
```

**`relation "shop" does not exist`**
You skipped migrations. Run `npm run db:migrate`.

**`duplicate key value violates unique constraint "shop_clerk_user_id_key"`**
You re-ran `npm run db:seed` after a real login bound a different
`clerk_user_id` to the dev shop row. Either drop the row manually
(`docker compose down -v && docker compose up -d && npm run db:migrate && npm run db:seed`)
or update `db/seed.ts`'s `DEV_CLERK_USER_ID` to match what's in the DB.

---

© locos — local-only Phase 1.

#!/usr/bin/env bash
# Convenience wrapper — boots Postgres via Docker Compose for Story 1.0 local dev.
# Usage: ./db/start-postgres.sh
set -euo pipefail
cd "$(dirname "$0")/.."
docker compose up -d
echo
echo "Postgres is up on localhost:${LOCOS_POSTGRES_PORT:-5432}."
echo "If you change LOCOS_POSTGRES_PORT, update DATABASE_URL in .env.local to match."

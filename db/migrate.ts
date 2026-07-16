/**
 * db/migrate.ts — applies SQL migrations to DATABASE_URL.
 * Story 1.0 AC #1, #5.
 *
 * Walks `adapters/postgres/migrations/*.sql` in lexical order and applies each
 * one inside a transaction. Tracks applied migrations in `_locos_migrations`.
 *
 * Idempotent: re-running `db:migrate` after a successful run is a no-op.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Client } from 'pg';
import { env } from '@/env';
import { describeError, logger } from '@/adapters/logger';

const MIGRATIONS_DIR = join(process.cwd(), 'adapters', 'postgres', 'migrations');

async function ensureMigrationsTable(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_locos_migrations" (
      "name" text PRIMARY KEY,
      "applied_at" timestamptz NOT NULL DEFAULT now()
    );
  `);
}

async function appliedMigrations(client: Client): Promise<Set<string>> {
  const { rows } = await client.query<{ name: string }>(
    'SELECT name FROM _locos_migrations ORDER BY name',
  );
  return new Set(rows.map((r) => r.name));
}

async function run() {
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  try {
    await ensureMigrationsTable(client);
    const done = await appliedMigrations(client);

    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let applied = 0;
    for (const file of files) {
      if (done.has(file)) {
        logger.debug({ migration: file }, 'migration already applied');
        continue;
      }
      const sql = await readFile(join(MIGRATIONS_DIR, file), 'utf8');
      logger.info({ migration: file }, 'applying migration');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _locos_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        applied++;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    if (applied === 0) {
      logger.info({ count: files.length }, 'no new migrations; database is up to date');
    } else {
      logger.info({ applied, total: files.length }, 'migrations complete');
    }
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  logger.error({ errorMessage: describeError(err) }, 'migration failed');
  process.exit(1);
});

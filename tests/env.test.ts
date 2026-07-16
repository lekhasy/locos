/**
 * Smoke tests for env.ts (Story 1.0 AC #3).
 *
 * Verifies that env.ts:
 *   - loads cleanly when all required vars are present
 *   - throws a clear, named error when a required var is missing
 *
 * Run with:  npm test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const REQUIRED_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  DATABASE_URL: 'postgresql://locos:locos_dev_password@localhost:5432/locos',
  CLERK_PUBLISHABLE_KEY: 'pk_test_x',
  CLERK_SECRET_KEY: 'sk_test_x',
  FAL_KEY: 'fal_x',
  GEMINI_API_KEY: 'gem_x',
  FACEBOOK_APP_ID: 'fa_x',
  FACEBOOK_APP_SECRET: 'fs_x',
  LOCOS_HOST_SECRET: Buffer.alloc(32).toString('base64'),
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
};

describe('env.ts', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Reset module cache so each test re-imports env.ts with its own process.env.
    vi.resetModules();
    for (const k of Object.keys(process.env)) {
      if (!(k in REQUIRED_ENV)) delete process.env[k];
    }
    for (const [k, v] of Object.entries(REQUIRED_ENV)) {
      process.env[k] = v;
    }
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.resetModules();
  });

  it('loads cleanly with all required env vars present', async () => {
    const mod = await import('../env');
    expect(mod.env.DATABASE_URL).toBe(REQUIRED_ENV.DATABASE_URL);
    expect(mod.env.CLERK_PUBLISHABLE_KEY).toBe(REQUIRED_ENV.CLERK_PUBLISHABLE_KEY);
  });

  it('throws a clear, named error when DATABASE_URL is missing', async () => {
    delete process.env.DATABASE_URL;
    await expect(import('../env')).rejects.toThrow(/env\.ts validation failed/);
  });

  it('throws when CLERK_SECRET_KEY is missing', async () => {
    delete process.env.CLERK_SECRET_KEY;
    await expect(import('../env')).rejects.toThrow(/CLERK_SECRET_KEY/);
  });

  it('throws when LOCOS_HOST_SECRET is missing', async () => {
    delete process.env.LOCOS_HOST_SECRET;
    await expect(import('../env')).rejects.toThrow(/LOCOS_HOST_SECRET/);
  });

  it('rejects LOCOS_HOST_SECRET that is not a 32-byte base64 value', async () => {
    process.env.LOCOS_HOST_SECRET = 'not-32-bytes';
    await expect(import('../env')).rejects.toThrow(/LOCOS_HOST_SECRET/);
  });

  it('rejects DATABASE_URL that is not a postgres:// URL', async () => {
    process.env.DATABASE_URL = 'mysql://localhost/x';
    await expect(import('../env')).rejects.toThrow(/DATABASE_URL/);
  });
});

/**
 * Single source of truth for environment variables.
 *
 * Architecture Consistency Convention:
 *   "All environment-specific values via `env.ts` with Zod schema validation
 *    at boot. No `process.env.X` reads outside `env.ts`."
 *
 * Validates at module load. Missing/invalid vars throw a clear error so
 * the process crashes fast — before any work begins (Story 1.0 AC #3).
 */

import { loadEnvConfig } from '@next/env';
import { z } from 'zod';

loadEnvConfig(process.cwd());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  // Postgres 17 (docker-compose.yml)
  DATABASE_URL: z
    .string()
    .url()
    .refine((s) => s.startsWith('postgres://') || s.startsWith('postgresql://'), {
      message: 'DATABASE_URL must be a postgres:// or postgresql:// URL',
    }),

  // Clerk (auth provider — AD-7)
  CLERK_PUBLISHABLE_KEY: z.string().min(1, 'CLERK_PUBLISHABLE_KEY is required (Clerk dev app: https://dashboard.clerk.com)'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required (Clerk dev app secret key)'),

  // FASHN image generation (model-on-product)
  FAL_KEY: z.string().min(1, 'FAL_KEY is required (fal.ai dashboard, used for FASHN model)'),

  // Gemini text generation
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required (Google AI Studio key)'),

  // Facebook Graph API (pages_manage_posts etc.)
  FACEBOOK_APP_ID: z.string().min(1, 'FACEBOOK_APP_ID is required (Meta for Developers app)'),
  FACEBOOK_APP_SECRET: z.string().min(1, 'FACEBOOK_APP_SECRET is required'),

  // Token envelope key for AD-8 (libsodium secretbox). 32 bytes.
  // Generate locally with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  LOCOS_HOST_SECRET: z
    .string()
    .min(1, 'LOCOS_HOST_SECRET is required (32-byte base64 secret — see README)')
    .refine((s) => Buffer.from(s, 'base64').length === 32, {
      message: 'LOCOS_HOST_SECRET must decode to exactly 32 bytes',
    }),

  // Public app URL (used for OAuth redirect URIs etc.)
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    // Crash with a clear message BEFORE any other work begins.
    console.error(`\n[env.ts] Invalid or missing environment variables:\n${issues}\n`);
    throw new Error(`env.ts validation failed:\n${issues}`);
  }
  return parsed.data;
}

export const env = loadEnv();

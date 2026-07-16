/**
 * Stable mapping for Clerk sign-in error codes → SignInPort reason strings.
 *
 * Lives in its own module (no React, no Clerk import) so it can be unit
 * tested without mocking `@clerk/nextjs`. `sign-in-client.ts` imports from
 * here.
 *
 * Story 1.1 v3 (username + password on Clerk `username` strategy):
 *   - form_password_incorrect         → invalid_credentials
 *   - form_identifier_not_found       → invalid_credentials
 *   - form_identifier_exists          → invalid_credentials
 *   - form_param_format_invalid       → invalid_credentials
 *   - user_locked                     → invalid_credentials
 *   - verification_failed             → invalid_credentials
 *   - everything else                 → null (caller decides fallback)
 *
 * All known authentication failures collapse to `invalid_credentials` so the
 * UI can show a single generic localized message ("Sai tên đăng nhập hoặc mật
 * khẩu") — we never reveal whether the username or the password was wrong.
 *
 * Never log the password, username, or Clerk error message verbatim. The
 * logger's redact paths (`adapters/logger.ts`) catch password fields as
 * defense-in-depth, but this module is the primary control.
 */

import type { SignInResult } from '@/ports/sign-in';

export type SignInReason = Extract<SignInResult, { ok: false }>['reason'];

const USERNAME_PASSWORD_ERROR_MAPPING: Record<string, SignInReason> = {
  form_password_incorrect: 'invalid_credentials',
  form_identifier_not_found: 'invalid_credentials',
  form_identifier_exists: 'invalid_credentials',
  form_param_format_invalid: 'invalid_credentials',
  user_locked: 'invalid_credentials',
  verification_failed: 'invalid_credentials',
};

export function mapSignInCode(code: string): SignInReason | null {
  return USERNAME_PASSWORD_ERROR_MAPPING[code] ?? null;
}

export function extractClerkCode(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) return null;
  const anyErr = err as {
    errors?: Array<{ code?: string; longMessage?: string; message?: string }>;
    code?: string;
    message?: string;
  };
  if (Array.isArray(anyErr.errors)) {
    for (const e of anyErr.errors) {
      if (typeof e?.code === 'string') return e.code;
    }
  }
  if (typeof anyErr.code === 'string') return anyErr.code;
  return null;
}

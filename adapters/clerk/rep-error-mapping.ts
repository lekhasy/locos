/**
 * Stable mapping for Clerk user-create error codes → RepPort reason strings.
 *
 * Sibling of `adapters/clerk/sign-in-error-mapping.ts`. Same shape:
 *   - form_username_exists         → username_taken
 *   - form_username_invalid        → invalid_input
 *   - form_username_too_long       → invalid_input
 *   - form_username_too_short      → invalid_input
 *   - form_param_format_invalid    → invalid_input
 *   - form_password_*              → invalid_input
 *   - everything else              → null (caller falls back to 'unexpected')
 *
 * Logging policy: never log username, password, or the Clerk error body.
 * The `rep.ts` adapter maps errors through here and emits only stable
 * reason strings + a `hasCode` flag.
 */

import type { CreateClerkUserResult } from '@/ports/rep';

export type RepReason = Extract<CreateClerkUserResult, { ok: false }>['reason'];

const CREATE_USER_ERROR_MAPPING: Record<string, RepReason> = {
  form_username_exists: 'username_taken',
  form_username_invalid: 'invalid_input',
  form_username_too_long: 'invalid_input',
  form_username_too_short: 'invalid_input',
  form_param_format_invalid: 'invalid_input',
  form_password_pwned: 'invalid_input',
  form_password_too_short: 'invalid_input',
  form_password_too_long: 'invalid_input',
  form_password_validation_failed: 'invalid_input',
};

export function mapCreateUserCode(code: string | null): RepReason | null {
  if (!code) return null;
  return CREATE_USER_ERROR_MAPPING[code] ?? null;
}

// Re-export so the rep adapter has a single import surface.
export { extractClerkCode } from './sign-in-error-mapping';

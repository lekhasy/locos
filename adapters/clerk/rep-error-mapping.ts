/**
 * Stable mapping for Clerk user-create error codes → RepPort reason strings.
 *
 * Sibling of `adapters/clerk/sign-in-error-mapping.ts`. Same shape:
 *   - form_username_exists            → { reason: 'username_taken' }
 *   - form_username_invalid           → { reason: 'invalid_input', field: 'username' }
 *   - form_username_too_long          → { reason: 'invalid_input', field: 'username' }
 *   - form_username_too_short         → { reason: 'invalid_input', field: 'username' }
 *   - form_param_format_invalid       → { reason: 'invalid_input' } (field unknown)
 *   - form_password_pwned             → { reason: 'invalid_input', field: 'password' }
 *   - form_password_too_short         → { reason: 'invalid_input', field: 'password' }
 *   - form_password_too_long          → { reason: 'invalid_input', field: 'password' }
 *   - form_password_validation_failed → { reason: 'invalid_input', field: 'password' }
 *   - everything else                 → null (caller falls back to 'unexpected')
 *
 * Logging policy: never log username, password, or the Clerk error body.
 * The `rep.ts` adapter maps errors through here and emits only stable
 * reason strings + a `hasCode` flag.
 */

export type CreateUserMapped = {
  reason: 'username_taken';
} | {
  reason: 'invalid_input';
  /**
   * The form field the upstream error refers to. `undefined` when the
   * Clerk code (e.g. `form_param_format_invalid`) doesn't disambiguate;
   * the orchestrator defaults to 'username' for those.
   */
  field?: 'username' | 'password';
};

const CREATE_USER_ERROR_MAPPING: Record<string, CreateUserMapped> = {
  form_username_exists: { reason: 'username_taken' },
  form_username_invalid: { reason: 'invalid_input', field: 'username' },
  form_username_too_long: { reason: 'invalid_input', field: 'username' },
  form_username_too_short: { reason: 'invalid_input', field: 'username' },
  form_param_format_invalid: { reason: 'invalid_input' },
  form_password_pwned: { reason: 'invalid_input', field: 'password' },
  form_password_too_short: { reason: 'invalid_input', field: 'password' },
  form_password_too_long: { reason: 'invalid_input', field: 'password' },
  form_password_validation_failed: { reason: 'invalid_input', field: 'password' },
};

export function mapCreateUserCode(code: string | null): CreateUserMapped | null {
  if (!code) return null;
  return CREATE_USER_ERROR_MAPPING[code] ?? null;
}

// Re-export so the rep adapter has a single import surface.
export { extractClerkCode } from './sign-in-error-mapping';

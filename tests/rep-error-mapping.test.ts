/**
 * rep-error-mapping — Story 1.3 / Rev C.
 *
 * Maps Clerk `users.createUser` error codes to RepPort `reason` strings.
 * Mirrors the stable-reason contract used elsewhere in the app (sign-in
 * error mapping collapses everything else to a generic reason, never
 * leaking the username/field).
 */

import { describe, it, expect } from 'vitest';
import { mapCreateUserCode } from '../adapters/clerk/rep-error-mapping';

describe('mapCreateUserCode (Story 1.3)', () => {
  it('maps form_username_exists → username_taken', () => {
    expect(mapCreateUserCode('form_username_exists')).toBe('username_taken');
  });

  it('maps form_username_invalid → invalid_input', () => {
    expect(mapCreateUserCode('form_username_invalid')).toBe('invalid_input');
  });

  it('maps form_param_format_invalid → invalid_input', () => {
    expect(mapCreateUserCode('form_param_format_invalid')).toBe('invalid_input');
  });

  it('maps form_password_too_short → invalid_input', () => {
    expect(mapCreateUserCode('form_password_too_short')).toBe('invalid_input');
  });

  it('returns null for unknown codes (caller falls back to unexpected)', () => {
    expect(mapCreateUserCode('something_new_we_have_not_seen')).toBeNull();
  });

  it('returns null for null input', () => {
    expect(mapCreateUserCode(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(mapCreateUserCode('')).toBeNull();
  });
});

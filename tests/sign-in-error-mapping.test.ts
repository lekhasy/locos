/**
 * Unit tests for the Clerk → SignInPort error-mapping helpers.
 *
 * Story 1.1 v3: every documented username + password authentication failure
 * collapses to a single `invalid_credentials` reason so the UI renders one
 * generic localized message. PII / brand leakage is the primary risk if
 * this mapping is wrong; the secondary risk is the UI not collapsing
 * enough reasons (which leaks "username not found" vs "wrong password").
 *
 * PII rule: no real usernames, no real passwords, no verbatim Clerk error
 * messages anywhere in fixtures or assertions.
 */

import { describe, it, expect } from 'vitest';
import {
  extractClerkCode,
  mapSignInCode,
} from '../adapters/clerk/sign-in-error-mapping';

describe('mapSignInCode (Story 1.1 v3)', () => {
  it('maps form_password_incorrect → invalid_credentials', () => {
    expect(mapSignInCode('form_password_incorrect')).toBe('invalid_credentials');
  });

  it('maps form_identifier_not_found → invalid_credentials', () => {
    expect(mapSignInCode('form_identifier_not_found')).toBe('invalid_credentials');
  });

  it('maps form_identifier_exists → invalid_credentials (defense in depth)', () => {
    expect(mapSignInCode('form_identifier_exists')).toBe('invalid_credentials');
  });

  it('maps user_locked → invalid_credentials', () => {
    expect(mapSignInCode('user_locked')).toBe('invalid_credentials');
  });

  it('maps verification_failed → invalid_credentials', () => {
    expect(mapSignInCode('verification_failed')).toBe('invalid_credentials');
  });

  it('maps form_param_format_invalid → invalid_credentials', () => {
    expect(mapSignInCode('form_param_format_invalid')).toBe('invalid_credentials');
  });

  it('returns null for unknown codes (caller defaults to unexpected)', () => {
    expect(mapSignInCode('something_unknown')).toBeNull();
    expect(mapSignInCode('')).toBeNull();
  });
});

describe('extractClerkCode', () => {
  it('extracts the first code from the ClerkAPI errors[] array', () => {
    const err = {
      errors: [
        { code: 'form_password_incorrect', message: 'placeholder only' },
      ],
    };
    expect(extractClerkCode(err)).toBe('form_password_incorrect');
  });

  it('returns the first code when multiple errors are present', () => {
    const err = {
      errors: [
        { code: 'first_code' },
        { code: 'second_code' },
      ],
    };
    expect(extractClerkCode(err)).toBe('first_code');
  });

  it('falls back to err.code when errors[] is missing', () => {
    expect(extractClerkCode({ code: 'top_level_code' })).toBe('top_level_code');
  });

  it('returns null for non-error shapes', () => {
    expect(extractClerkCode(null)).toBeNull();
    expect(extractClerkCode(undefined)).toBeNull();
    expect(extractClerkCode('plain string')).toBeNull();
    expect(extractClerkCode(42)).toBeNull();
    expect(extractClerkCode({})).toBeNull();
    expect(extractClerkCode({ errors: 'not-an-array' })).toBeNull();
  });

  it('skips entries in errors[] without a string code', () => {
    const err = {
      errors: [
        { code: undefined },
        { code: 'real_code' },
      ],
    };
    expect(extractClerkCode(err)).toBe('real_code');
  });
});

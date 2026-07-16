/**
 * Unit tests for the Clerk → SignInPort error-mapping helpers.
 *
 * These are the boundary between Clerk's verbose error shapes (which can
 * include phone or OTP fragments in their messages) and our port's stable
 * reason strings. A wrong mapping here leaks PII into the UI or logs.
 *
 * PII rule: fixtures use synthetic codes only — never real phone numbers,
 * never real OTP codes, never verbatim Clerk error messages.
 */

import { describe, it, expect } from 'vitest';
import {
  extractClerkCode,
  mapSignInCode,
} from '../adapters/clerk/sign-in-error-mapping';

describe('mapSignInCode', () => {
  it('maps phone_number_not_provisioned → not_provisioned', () => {
    expect(mapSignInCode('phone_number_not_provisioned')).toBe('not_provisioned');
  });

  it('maps invalid_code → invalid_code', () => {
    expect(mapSignInCode('invalid_code')).toBe('invalid_code');
  });

  it('maps verification_failed → invalid_code (same UX path)', () => {
    expect(mapSignInCode('verification_failed')).toBe('invalid_code');
  });

  it('maps expired_code → expired', () => {
    expect(mapSignInCode('expired_code')).toBe('expired');
  });

  it('returns null for unknown codes', () => {
    expect(mapSignInCode('something_else')).toBeNull();
    expect(mapSignInCode('')).toBeNull();
  });
});

describe('extractClerkCode', () => {
  it('extracts the first code from the ClerkAPI errors[] array', () => {
    const err = {
      errors: [
        { code: 'invalid_code', message: 'Code does not match' },
      ],
    };
    expect(extractClerkCode(err)).toBe('invalid_code');
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
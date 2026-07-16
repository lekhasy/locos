/**
 * phoneSchema — Zod validator for Story 1.1's login form (UX-DR7).
 *
 * AD-7 / AR-13 guardrails: phone numbers are never persisted in locos, but
 * we still validate the shape at every UI boundary to keep error mapping
 * stable across the login + future flows (e.g., Story 1.3's allowlist).
 *
 * No PII in fixtures — we use the synthetic +84 900 000 000 series that
 * Vietnam carriers reserve for testing (and is also a common placeholder).
 */

import { describe, it, expect } from 'vitest';
import { phoneSchema } from '../ports/auth';

describe('phoneSchema (Story 1.1)', () => {
  it('accepts +84 with 9 digits', () => {
    expect(
      phoneSchema.safeParse({ countryCode: '+84', nationalNumber: '900000000' }).success,
    ).toBe(true);
  });

  it('accepts +84 with 10 digits', () => {
    expect(
      phoneSchema.safeParse({ countryCode: '+84', nationalNumber: '9000000000' }).success,
    ).toBe(true);
  });

  it('rejects 8 digits', () => {
    const r = phoneSchema.safeParse({ countryCode: '+84', nationalNumber: '90000000' });
    expect(r.success).toBe(false);
  });

  it('rejects 11+ digits', () => {
    const r = phoneSchema.safeParse({ countryCode: '+84', nationalNumber: '90000000000' });
    expect(r.success).toBe(false);
  });

  it('rejects non-digit characters', () => {
    const r = phoneSchema.safeParse({ countryCode: '+84', nationalNumber: '90000000a' });
    expect(r.success).toBe(false);
  });

  it('rejects other country codes', () => {
    const r = phoneSchema.safeParse({ countryCode: '+1', nationalNumber: '900000000' });
    expect(r.success).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(phoneSchema.safeParse({ countryCode: '+84' }).success).toBe(false);
    expect(phoneSchema.safeParse({ nationalNumber: '900000000' }).success).toBe(false);
  });
});
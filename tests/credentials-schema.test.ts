/**
 * credentialsSchema — Zod validator for Story 1.1 v3's login form (UX-DR7/UX-DR8).
 *
 * Single source of truth for username + password shape so the form, the
 * port adapter, and tests stay in sync. Mirrors the rules in
 * `ports/sign-in.ts`.
 *
 * PII rule: no real usernames or passwords in fixtures. Use synthetic
 * placeholder values that look like Clerk examples, not real-looking ones.
 */

import { describe, it, expect } from 'vitest';
import { credentialsSchema } from '../ports/sign-in';

describe('credentialsSchema (Story 1.1 v3)', () => {
  it('accepts a 3-character alphanumeric username', () => {
    expect(
      credentialsSchema.safeParse({ username: 'abc', password: 'password123' })
        .success,
    ).toBe(true);
  });

  it('accepts an underscore-containing username', () => {
    expect(
      credentialsSchema.safeParse({ username: 'shop_owner_1', password: 'password123' })
        .success,
    ).toBe(true);
  });

  it('accepts a hyphen-containing username', () => {
    expect(
      credentialsSchema.safeParse({ username: 'chi-run', password: 'password123' })
        .success,
    ).toBe(true);
  });

  it('accepts a 32-character username at the upper bound', () => {
    expect(
      credentialsSchema.safeParse({
        username: 'a'.repeat(32),
        password: 'password123',
      }).success,
    ).toBe(true);
  });

  it('accepts an 8-character password at the lower bound', () => {
    expect(
      credentialsSchema.safeParse({ username: 'chi', password: '12345678' })
        .success,
    ).toBe(true);
  });

  it('accepts a 128-character password at the upper bound', () => {
    expect(
      credentialsSchema.safeParse({
        username: 'chi',
        password: 'p'.repeat(128),
      }).success,
    ).toBe(true);
  });

  it('rejects a 2-character username (too short)', () => {
    const r = credentialsSchema.safeParse({ username: 'ab', password: 'password123' });
    expect(r.success).toBe(false);
  });

  it('rejects a 33-character username (too long)', () => {
    const r = credentialsSchema.safeParse({
      username: 'a'.repeat(33),
      password: 'password123',
    });
    expect(r.success).toBe(false);
  });

  it('rejects a username with disallowed characters', () => {
    const r = credentialsSchema.safeParse({
      username: 'chi@shop',
      password: 'password123',
    });
    expect(r.success).toBe(false);
  });

  it('rejects a 7-character password (too short)', () => {
    const r = credentialsSchema.safeParse({ username: 'chi', password: '1234567' });
    expect(r.success).toBe(false);
  });

  it('rejects a 129-character password (too long)', () => {
    const r = credentialsSchema.safeParse({
      username: 'chi',
      password: 'p'.repeat(129),
    });
    expect(r.success).toBe(false);
  });

  it('rejects an empty username', () => {
    const r = credentialsSchema.safeParse({ username: '', password: 'password123' });
    expect(r.success).toBe(false);
  });

  it('rejects an empty password', () => {
    const r = credentialsSchema.safeParse({ username: 'chi', password: '' });
    expect(r.success).toBe(false);
  });

  it('rejects missing fields', () => {
    expect(credentialsSchema.safeParse({ username: 'chi' }).success).toBe(false);
    expect(credentialsSchema.safeParse({ password: 'password123' }).success).toBe(
      false,
    );
    expect(credentialsSchema.safeParse({}).success).toBe(false);
  });
});

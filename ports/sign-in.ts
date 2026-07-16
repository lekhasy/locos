/**
 * SignInPort — client-side port for the username + password sign-in flow.
 *
 * Story 1.1 v3: locos uses Clerk's `username` strategy exclusively. This port
 * wraps the future API (`signIn.__internal_future.password({ identifier, password })`)
 * behind a stable contract so `app/(auth)/login/LoginForm.tsx` doesn't import
 * `@clerk/nextjs` directly.
 *
 * Passwords, error message bodies, and Clerk session ids never escape this
 * port — the UI passes a `(username, password)` pair and receives a
 * discriminated result so callers can act on outcomes without touching
 * Clerk types. The adapter is the primary control; the logger's redact list
 * (`adapters/logger.ts`) is defense-in-depth.
 */

import { z } from 'zod';

/**
 * Username + password form schema. Single source of truth — the form, the
 * port, and tests all derive from this.
 *
 * Username rules (UX-DR7):
 *   - 3 to 32 characters
 *   - alphanumeric plus `_` and `-`
 *
 * Password rules (UX-DR8):
 *   - 8 to 128 characters (no composition rule — Clerk accepts what it accepts)
 */
export const credentialsSchema = z.object({
  username: z
    .string()
    .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
    .max(32, 'Tên đăng nhập tối đa 32 ký tự')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Tên đăng nhập chỉ gồm chữ, số, "_" và "-"'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .max(128, 'Mật khẩu tối đa 128 ký tự'),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;

export type SignInResult =
  | { ok: true }
  | { ok: false; reason: 'invalid_credentials' | 'unexpected' };

export interface SignInPort {
  /**
   * Submits a (username, password) pair to Clerk's `username` strategy.
   * Returns a discriminated result; UI renders a single generic error for
   * any `{ ok: false }` outcome.
   */
  signIn(identifier: string, password: string): Promise<SignInResult>;
}

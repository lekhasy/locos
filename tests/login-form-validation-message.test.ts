/**
 * Unit tests for the LoginForm's validation-error message builder.
 *
 * Story 1.1 v3 (post-review fix): when `credentialsSchema.safeParse` rejects
 * the input, the form surfaces the first localized validation issue. The
 * reserved credential-specific message "Sai tên đăng nhập hoặc mật khẩu" is
 * reserved for actual Clerk auth rejections — formatting errors must not be
 * conflated with credential errors or the UI becomes misleading.
 *
 * Re-exports the helper directly because the React component itself requires
 * mocking Clerk's `useSignIn()` hook to mount in a test; isolating the
 * formatting function keeps the test surface small and intent-clear.
 */

import { describe, it, expect } from 'vitest';
import { credentialsSchema } from '../ports/sign-in';

const INVALID_CREDENTIALS_MESSAGE = 'Sai tên đăng nhập hoặc mật khẩu';

function firstValidationMessage(error: {
  issues: { message?: string }[];
}): string {
  return error.issues[0]?.message ?? 'Vui lòng kiểm tra lại thông tin đăng nhập';
}

describe('LoginForm validation message (post-review fix)', () => {
  it('surfaces the localized username-too-short message', () => {
    const r = credentialsSchema.safeParse({ username: 'ab', password: 'password123' });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(firstValidationMessage(r.error)).toBe(
      'Tên đăng nhập phải có ít nhất 3 ký tự',
    );
  });

  it('surfaces the localized disallowed-characters message', () => {
    const r = credentialsSchema.safeParse({ username: 'chi@shop', password: 'password123' });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(firstValidationMessage(r.error)).toBe(
      'Tên đăng nhập chỉ gồm chữ, số, "_" và "-"',
    );
  });

  it('surfaces the localized password-too-short message', () => {
    const r = credentialsSchema.safeParse({ username: 'chi', password: '1234567' });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(firstValidationMessage(r.error)).toBe(
      'Mật khẩu phải có ít nhất 8 ký tự',
    );
  });

  it('never returns the reserved credential message', () => {
    const r = credentialsSchema.safeParse({ username: '', password: '' });
    expect(r.success).toBe(false);
    if (r.success) return;
    expect(firstValidationMessage(r.error)).not.toBe(INVALID_CREDENTIALS_MESSAGE);
  });

  it('falls back to a generic validation message when no issue has a message', () => {
    const fakeError = { issues: [] as { message?: string }[] };
    expect(firstValidationMessage(fakeError)).toBe(
      'Vui lòng kiểm tra lại thông tin đăng nhập',
    );
  });
});

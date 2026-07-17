/**
 * buildCredentialsMessage — pure-formatter tests.
 *
 * The message is what the rep pastes into SMS / Zalo to hand the shop
 * owner their first login. Output stability matters: changing the line
 * order, the wording, or the URL silently would be a regression. These
 * tests pin the canonical Vietnamese output.
 */

import { describe, it, expect } from 'vitest';
import {
  buildCredentialsMessage,
  DEFAULT_LOCOS_LOGIN_URL,
} from '../core/rep/credentials-message';

describe('buildCredentialsMessage', () => {
  it('builds the canonical Vietnamese message with all fields', () => {
    const message = buildCredentialsMessage({
      displayName: 'Locos Dev Shop',
      username: 'shopowner1',
      password: 'password123',
    });

    expect(message).toBe(
      [
        'Locos — Đăng nhập cho chủ shop',
        '',
        'Shop: Locos Dev Shop',
        `Đăng nhập tại: ${DEFAULT_LOCOS_LOGIN_URL}`,
        'Tên đăng nhập: shopowner1',
        'Mật khẩu: password123',
        '',
        'Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên.',
      ].join('\n'),
    );
  });

  it('uses loginUrl from input when provided (overrides the default)', () => {
    const message = buildCredentialsMessage({
      displayName: 'Locos Dev Shop',
      username: 'shopowner1',
      password: 'password123',
      loginUrl: 'https://staging.locos.vn/login',
    });
    expect(message).toContain('Đăng nhập tại: https://staging.locos.vn/login');
    expect(message).not.toContain(DEFAULT_LOCOS_LOGIN_URL);
  });

  it('falls back to DEFAULT_LOCOS_LOGIN_URL when loginUrl is omitted', () => {
    const message = buildCredentialsMessage({
      displayName: 'Locos Dev Shop',
      username: 'u',
      password: 'p',
    });
    expect(message).toContain(DEFAULT_LOCOS_LOGIN_URL);
  });

  it('preserves the exact byte sequence of the password (no truncation, no escaping)', () => {
    const weirdPassword = 'p@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?/`~';
    const message = buildCredentialsMessage({
      displayName: 'Locos Dev Shop',
      username: 'shopowner1',
      password: weirdPassword,
    });
    expect(message).toContain(`Mật khẩu: ${weirdPassword}`);
  });

  it('uses literal \\n line breaks (no \\r\\n) so the message pastes cleanly into SMS', () => {
    const message = buildCredentialsMessage({
      displayName: 'Locos Dev Shop',
      username: 'shopowner1',
      password: 'password123',
    });
    expect(message).not.toContain('\r');
    expect(message.split('\n')).toHaveLength(8);
  });

  it('exposes DEFAULT_LOCOS_LOGIN_URL as the prod handoff target', () => {
    expect(DEFAULT_LOCOS_LOGIN_URL).toBe('https://locos.vn/login');
  });
});
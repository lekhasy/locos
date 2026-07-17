/**
 * buildCredentialsMessage — pure formatter for the shop-owner handoff.
 *
 * The rep pastes this into SMS / Zalo / etc. so the shop owner can log in
 * for the first time. The block is intentionally a single string with
 * explicit newlines so it survives clipboard → SMS round-trips.
 *
 * AD-1: pure function, no I/O, no React, no Next. Lives in `core/` because
 * it's domain-shaped content (what we tell a shop owner), not a UI concern.
 * The card component just consumes the string.
 *
 * The login URL is the production URL regardless of the rep's environment
 * — the message is for the shop owner, who will log in to prod. We pass
 * `loginUrl` as a parameter so tests can pin the exact output and so the
 * caller can override later (multi-env support, dev → staging messages,
 * etc.).
 */

export const DEFAULT_LOCOS_LOGIN_URL = 'https://locos.vn/login';

export type CredentialsMessageInput = {
  displayName: string;
  username: string;
  password: string;
  loginUrl?: string;
};

export function buildCredentialsMessage(input: CredentialsMessageInput): string {
  const loginUrl = input.loginUrl ?? DEFAULT_LOCOS_LOGIN_URL;
  return [
    'Locos — Đăng nhập cho chủ shop',
    '',
    `Shop: ${input.displayName}`,
    `Đăng nhập tại: ${loginUrl}`,
    `Tên đăng nhập: ${input.username}`,
    `Mật khẩu: ${input.password}`,
    '',
    'Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên.',
  ].join('\n');
}
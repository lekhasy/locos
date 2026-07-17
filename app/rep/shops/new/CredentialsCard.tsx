'use client';

/**
 * CredentialsCard — one-shot shop-owner handoff card.
 *
 * Renders after a successful create or password reset. The rep sees the
 * message preview, copies it to the clipboard, and sends it to the shop
 * owner via SMS / Zalo / etc. The password is NOT persisted anywhere;
 * this card is the only window the rep has to capture it.
 *
 * Clipboard fallback: `navigator.clipboard.writeText` requires a secure
 * context and may be denied by permission policy. The readonly textarea
 * lets the rep select-and-copy manually if the button fails. The button
 * label still flips to "Đã sao chép" on success so the rep has
 * confirmation.
 *
 * Navigation: a top-left "← Xem trang shop" breadcrumb is the only
 * outbound link from this card. The "Tạo shop khác" CTA lives on the
 * shop list page (`/rep/shops`), not here — this card's job is to
 * surface the credentials and let the rep move on.
 */

import { useState } from 'react';
import Link from 'next/link';
import { buildCredentialsMessage } from '@/core/rep/credentials-message';

export type CredentialsCardProps = {
  shopId: string;
  displayName: string;
  username: string;
  password: string;
  loginUrl: string;
};

export function CredentialsCard(props: CredentialsCardProps) {
  const { shopId, displayName, username, password, loginUrl } = props;
  const message = buildCredentialsMessage({
    displayName,
    username,
    password,
    loginUrl,
  });

  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    } catch {
      // Clipboard blocked (insecure context / permission denied).
      // The readonly textarea below lets the rep select-and-copy manually.
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div className="rep-nav">
        <Link
          href={`/rep/shops/${shopId}`}
          className="button-text"
          style={{
            minHeight: '44px',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          ← Xem trang shop
        </Link>
      </div>

      <header>
        <h1>Shop đã tạo — sao chép thông tin đăng nhập cho chủ shop</h1>
        <p className="helper">
          Không lưu lại mật khẩu — sao chép ngay để gửi cho chủ shop.
        </p>
      </header>

      <textarea
        className="input"
        readOnly
        value={message}
        rows={8}
        aria-label="Thông tin đăng nhập cần sao chép cho chủ shop"
        style={{
          fontFamily: 'inherit',
          resize: 'vertical',
          minHeight: 'calc(var(--space-12) * 6)',
        }}
      />

      <button
        type="button"
        className="button-primary"
        onClick={handleCopy}
        aria-live="polite"
      >
        {copied ? 'Đã sao chép' : 'Sao chép'}
      </button>
    </div>
  );
}
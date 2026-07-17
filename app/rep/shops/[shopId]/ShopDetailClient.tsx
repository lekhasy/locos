'use client';

/**
 * ShopDetailClient — interactive reset-password island on the shop
 * detail page.
 *
 * Story 1.3 / Rev C: the rep can reset a shop owner's password from the
 * detail page. Click "Đặt lại mật khẩu" → server generates a fresh
 * password + returns the new credentials → render the same
 * `<CredentialsCard>` used by the create flow so the rep can copy and
 * send via SMS.
 *
 * Confirmation friction: the reset button stays disabled until the rep
 * types the shop's `display_name` exactly (trimmed, case-insensitive).
 * One wrong character and the button stays disabled — prevents
 * accidental resets that would invalidate a working password.
 *
 * The password is not persisted; the new credentials card is the only
 * window the rep has to capture it. Navigating away clears state.
 *
 * The "← Quay lại danh sách" breadcrumb lives in `page.tsx` (top of the
 * page), not here.
 */

import { useState, useTransition } from 'react';
import { CredentialsCard } from '../../shops/new/CredentialsCard';
import { resetShopPasswordAction } from './actions';

type Credentials = {
  shopId: string;
  displayName: string;
  username: string;
  password: string;
  loginUrl: string;
};

const REASON_MESSAGE: Record<string, string> = {
  shop_not_found: 'Không tìm thấy shop này. Vui lòng quay lại danh sách.',
  username_lookup_failed:
    'Không đọc được tên đăng nhập từ Clerk. Vui lòng thử lại hoặc liên hệ kỹ thuật.',
  password_set_failed:
    'Không đặt lại được mật khẩu. Vui lòng thử lại hoặc liên hệ kỹ thuật.',
};

function nameMatches(input: string, expected: string): boolean {
  const a = input.trim().toLocaleLowerCase('vi-VN');
  const b = expected.trim().toLocaleLowerCase('vi-VN');
  return a.length > 0 && a === b;
}

export function ShopDetailClient({
  shopId,
  displayName,
}: {
  shopId: string;
  displayName: string;
}) {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const confirmed = nameMatches(confirmInput, displayName);

  function handleReset() {
    if (pending || !confirmed) return;
    setError(null);
    startTransition(async () => {
      const result = await resetShopPasswordAction({ shopId });
      if (result.ok) {
        setCredentials({
          shopId,
          displayName,
          username: result.credentials.username,
          password: result.credentials.password,
          loginUrl: result.credentials.loginUrl,
        });
        setConfirmInput('');
      } else {
        setError(REASON_MESSAGE[result.reason] ?? 'Đặt lại mật khẩu thất bại.');
      }
    });
  }

  if (credentials) {
    return <CredentialsCard {...credentials} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <header>
        <h2 style={{ margin: 0, fontSize: 'var(--text-title)', fontWeight: 600 }}>
          Đặt lại mật khẩu
        </h2>
      </header>

      <div className="rep-banner warning" role="alert">
        Mật khẩu cũ sẽ ngừng hoạt động ngay khi đặt lại. Hãy sao chép mật khẩu
        mới và gửi cho chủ shop qua SMS hoặc Zalo ngay sau khi nhận được.
      </div>

      {error ? (
        <div className="rep-banner" role="alert">
          {error}
        </div>
      ) : null}

      <div className="form-row">
        <label htmlFor="confirm-name" className="form-label">
          Xác nhận
        </label>
        <input
          id="confirm-name"
          className="input"
          value={confirmInput}
          onChange={(e) => setConfirmInput(e.target.value)}
          placeholder={displayName}
          readOnly={pending}
          autoComplete="off"
          aria-describedby="confirm-name-helper"
          aria-invalid={confirmInput.length > 0 && !confirmed}
        />
        <p id="confirm-name-helper" className="helper">
          Nhập chính xác tên cửa hàng <strong>{displayName}</strong> để bật nút
          đặt lại.
        </p>
      </div>

      <div>
        <button
          type="button"
          className="button-primary"
          onClick={handleReset}
          disabled={!confirmed || pending}
          aria-busy={pending}
        >
          {pending ? 'Đang đặt lại…' : 'Đặt lại mật khẩu'}
        </button>
      </div>
    </div>
  );
}
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { postgresShopRepositoryFactory } from '@/adapters/postgres/repositories/shop-repository';
import { ShopDetailClient } from './ShopDetailClient';

/**
 * /rep/shops/{shopId} — read-only shop detail for the rep.
 *
 * AC #5 — landing target after a successful create, plus a place to look
 * up a previously-provisioned shop's basic profile (display name,
 * address, contact phone, creation date).
 *
 * Layout (top → bottom):
 *   1. Top-left breadcrumb: ← Quay lại danh sách
 *   2. Page title + helper (creation timestamp)
 *   3. Bordered panel — read-only shop details
 *   4. Bordered panel — reset-password action (visual treatment slightly
 *      stronger so it reads as a distinct concern, not a continuation
 *      of the read-only data)
 *
 * The reset interaction itself (button + confirmation input + post-
 * reset credentials card) lives in `<ShopDetailClient>`; this page is
 * the static shell + server-fetched data.
 */

export default async function RepShopDetailPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  const shop = await postgresShopRepositoryFactory().get(shopId);
  if (!shop) notFound();

  const createdAt = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(shop.createdAt);

  const displayName = shop.displayName || '(chưa đặt tên)';

  return (
    <>
      <div className="rep-nav">
        <Link
          href="/rep/shops"
          className="button-text"
          style={{
            minHeight: '44px',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          ← Quay lại danh sách
        </Link>
      </div>

      <header>
        <h1>Chi tiết shop — {displayName}</h1>
        <p className="helper">
          Đã tạo lúc {createdAt}. Tài khoản chủ shop đã sẵn sàng để đăng nhập.
        </p>
      </header>

      <section
        aria-label="Thông tin shop"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          border: '1px solid var(--color-outline)',
          borderRadius: 'var(--rounded-md)',
          padding: 'var(--space-4)',
          background: 'var(--color-surface)',
        }}
      >
        <DetailField label="Tên cửa hàng" value={shop.displayName || '—'} />
        <DetailField label="Địa chỉ" value={shop.address || '—'} />
        <DetailField
          label="Số điện thoại liên hệ"
          value={shop.contactPhone ?? '—'}
          hint={shop.contactPhone === null ? 'Chưa được đại lý cập nhật.' : undefined}
        />
        <DetailField
          label="Mã định danh Clerk"
          value={shop.clerkUserId}
          mono
        />
      </section>

      <section
        aria-label="Đặt lại mật khẩu"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          border: '1px solid var(--color-outline-strong)',
          borderLeft: '4px solid var(--color-warning)',
          borderRadius: 'var(--rounded-md)',
          padding: 'var(--space-4)',
          background: 'var(--color-surface)',
        }}
      >
        <ShopDetailClient shopId={shopId} displayName={displayName} />
      </section>
    </>
  );
}

function DetailField({
  label,
  value,
  mono,
  hint,
}: {
  label: string;
  value: string;
  mono?: boolean;
  hint?: string;
}) {
  return (
    <div className="form-row" style={{ gap: 'var(--space-1)' }}>
      <span className="form-label">{label}</span>
      <span
        style={
          mono
            ? { fontFamily: 'var(--font-numeric)', wordBreak: 'break-all' }
            : undefined
        }
      >
        {value}
      </span>
      {hint ? <span className="helper">{hint}</span> : null}
    </div>
  );
}
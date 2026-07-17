import { notFound } from 'next/navigation';
import Link from 'next/link';
import { postgresShopRepositoryFactory } from '@/adapters/postgres/repositories/shop-repository';

/**
 * /rep/shops/{shopId} — read-only shop detail for the rep.
 *
 * AC #5 — landing target after a successful create, plus a place to look
 * up a previously-provisioned shop's basic profile (display name,
 * address, contact phone, creation date).
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

  return (
    <>
      <header>
        <h1>Chi tiết shop</h1>
        <p className="helper">
          Đã tạo lúc {createdAt}. Tài khoản chủ shop đã sẵn sàng để đăng nhập.
        </p>
      </header>

      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          border: '1px solid var(--color-outline)',
          borderRadius: 'var(--rounded-md)',
          padding: 'var(--space-4)',
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

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Link
          href="/rep/shops"
          className="button-text"
          style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}
        >
          ← Quay lại danh sách
        </Link>
      </div>
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

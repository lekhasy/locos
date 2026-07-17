import Link from 'next/link';
import { postgresShopRepositoryFactory } from '@/adapters/postgres/repositories/shop-repository';
import { listShops } from '@/core/rep/list-shops';

/**
 * /rep/shops — list every active shop, sorted newest-first.
 *
 * Story 1.3 / Rev C AC #2 (list with display_name + creation date),
 * AC #10 (empty-state UX). The CTA lives in the same card so the rep
 * never has to navigate back to a parent page.
 */

export default async function RepShopsPage() {
  const repo = postgresShopRepositoryFactory();
  const shops = await listShops(repo);

  return (
    <>
      <header>
        <h1>Shop đã cấp</h1>
        <p className="helper">
          Mỗi shop đã được tạo bởi bạn. Nhấp vào một shop để xem chi tiết.
        </p>
      </header>

      <div className="rep-toolbar">
        <Link href="/rep/shops/new" className="button-primary" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', maxWidth: 220, textDecoration: 'none' }}>
          Tạo shop mới
        </Link>
      </div>

      {shops.length === 0 ? (
        <section
          aria-label="Danh sách shop trống"
          style={{
            border: '1px dashed var(--color-outline-strong)',
            borderRadius: 'var(--rounded-md)',
            padding: 'var(--space-6)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 'var(--text-title)' }}>Chưa có shop nào</h2>
          <p className="helper">Tạo shop đầu tiên để bắt đầu cấp tài khoản cho khách hàng.</p>
          <Link
            href="/rep/shops/new"
            className="button-primary"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', maxWidth: 240, marginInline: 'auto', textDecoration: 'none' }}
          >
            Tạo shop đầu tiên
          </Link>
        </section>
      ) : (
        <ul className="rep-list" aria-label="Danh sách shop">
          {shops.map((s) => {
            const created = new Intl.DateTimeFormat('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }).format(s.createdAt);
            return (
              <li key={s.id}>
                <Link href={`/rep/shops/${s.id}`} className="rep-list-row">
                  <span className="display-name">{s.displayName || '—'}</span>
                  <span className="meta">Tạo lúc {created}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

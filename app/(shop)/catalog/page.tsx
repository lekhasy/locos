import { UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { clerkAuthAdapterFactory } from '@/adapters/clerk/auth';
import { getCurrentShop } from '@/core/shop/get-current-shop';
import { isSalesRep } from '@/adapters/clerk/rep';

/**
 * /catalog — shop owner landing (Story 1.1 + Story 1.3 routing).
 *
 * Story 1.3 / Rev C role dispatch:
 *   - Rep users have no `shop` row by design (AD-7 sister clause), so the
 *     null-shop branch sends them to `/rep/shops`.
 *   - Any other authenticated user with no `shop` row also lands on
 *     `/rep/shops` (defense in depth — every authenticated user must have
 *     a stable route target; the rep surface is the natural home for
 *     "authed but no `shop` row" once Story 1.3 ships).
 */
export default async function CatalogPage() {
  const isRep = await isSalesRep();
  const shop = await getCurrentShop(clerkAuthAdapterFactory());
  if (!shop) {
    redirect('/rep/shops');
  }

  // Narrow for the type system after the redirect.
  void isRep;
  const tail = shop.id.slice(-6);

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <div>
            <h1 style={{ marginBottom: 'var(--space-1)' }}>Danh mục sản phẩm</h1>
            <p className="helper">Xin chào, cửa hàng {tail}.</p>
          </div>
          <UserButton afterSignOutUrl="/login" />
        </header>
        <section style={{ minHeight: '40vh' }}>
          <p className="helper">
            Catalog grid lands in Story 5.1. Trước đó, cửa hàng có thể bắt đầu
            tạo sản phẩm mới từ Story 3.1.
          </p>
        </section>
        <button
          type="button"
          className="button-primary"
          disabled
          aria-disabled
          title="Đăng sản phẩm mới — Story 3.1"
        >
          Đăng sản phẩm mới
        </button>
      </div>
    </main>
  );
}
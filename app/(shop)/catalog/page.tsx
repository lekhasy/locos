import { UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { clerkAuthAdapterFactory } from '@/adapters/clerk/auth';
import { getCurrentShop } from '@/core/shop/get-current-shop';

/**
 * /catalog — placeholder for the post-login landing (Story 1.1).
 *
 * Story 5.1 implements the full product-card grid. Story 1.1 just needs a
 * safe surface so the login flow has somewhere to land; the avatar menu
 * uses Clerk's UserButton for now (Story 1.2 wires the spec'd menu).
 */
export default async function CatalogPage() {
  const shop = await getCurrentShop(clerkAuthAdapterFactory());
  if (!shop) redirect('/login');

  const shopTail = shop.id.slice(-6);

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
            <p className="helper">Xin chào, cửa hàng {shopTail}.</p>
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
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { clerkAuthAdapterFactory } from '@/adapters/clerk/auth';
import { getCurrentShop } from '@/core/shop/get-current-shop';
import { isSalesRep } from '@/adapters/clerk/rep';
import { LoginForm } from './LoginForm';

/**
 * /login — username + password login (Story 1.1 v3).
 *
 * Server component: redirects authenticated users onward (defense in
 * depth on top of middleware). Story 1.3 (Rev C) makes the dispatch
 * role-aware:
 *   - Sales rep (Clerk publicMetadata.role === 'sales_rep') → /rep/shops
 *   - Shop owner with a matching `shop` row → /catalog
 *   - Authenticated user with no `shop` row and no rep flag →
 *     /rep/shops (defense in depth: in production this combination
 *     shouldn't occur; landing on the rep surface at least avoids a
 *     loop with /login).
 *
 * No `/login/otp` route exists; the two-step flow was removed under
 * Sprint Change Proposal 2026-07-16 Revision B.
 */
export default async function LoginPage() {
  const { userId } = await auth();
  if (userId) {
    const isRep = await isSalesRep();
    if (isRep) redirect('/rep/shops');

    const shop = await getCurrentShop(clerkAuthAdapterFactory());
    if (shop) redirect('/catalog');
    redirect('/rep/shops');
  }
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <header>
          <h1>Đăng nhập</h1>
          <p className="helper">
            Vui lòng đăng nhập bằng tên đăng nhập và mật khẩu đã được cấp.
          </p>
        </header>
        <LoginForm />
      </div>
    </main>
  );
}

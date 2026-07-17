import { UserButton } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import { isSalesRep } from '@/adapters/clerk/rep';

/**
 * /rep/* shell — sales-rep-only surface (Story 1.3 / Rev C).
 *
 * Role detection reads Clerk's `publicMetadata.role` via
 * `currentUser()`. A rep never has a `shop` row (AD-7 sister clause), so
 * the route's auth boundary is the rep flag itself, not `getCurrentShop()`.
 *
 * Defense in depth:
 *   - Unauthenticated → `/login`
 *   - Authenticated but not a rep → `/catalog` (the shop owner never sees
 *     rep surfaces and vice versa)
 */

export default async function RepLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isRep = await isSalesRep();
  if (!isRep) {
    // Either unauthenticated (middleware would have already redirected)
    // or a shop owner — both end up on /catalog or /login.
    redirect('/catalog');
  }

  return (
    <main className="rep-shell">
      <div className="rep-card">
        <header className="rep-nav">
          <span className="helper">Đại lý locos</span>
          <UserButton afterSignOutUrl="/login" />
        </header>
        {children}
      </div>
    </main>
  );
}

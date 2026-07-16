import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { LoginForm } from './LoginForm';

/**
 * /login — username + password login (Story 1.1 v3).
 *
 * Server component: redirects authenticated users to /catalog (defense in
 * depth on top of middleware). Renders the client-side LoginForm.
 *
 * No `/login/otp` route exists; the two-step flow was removed under
 * Sprint Change Proposal 2026-07-16 Revision B. See
 * `_bmad-output/planning-artifacts/sprint-change-proposal-2026-07-16.md`
 * §4.1 for the full Story 1.1 v3 spec.
 */
export default async function LoginPage() {
  const { userId } = await auth();
  if (userId) redirect('/catalog');
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

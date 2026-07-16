import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { PhoneForm } from './PhoneForm';

/**
 * /login — phone + OTP login, step 1 (Story 1.1).
 *
 * Server component: redirects authenticated users to /catalog (defense in
 * depth on top of middleware). Renders the client-side PhoneForm.
 */
export default async function LoginPage() {
  const { userId } = await auth();
  if (userId) redirect('/catalog');
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <header>
          <h1>Đăng nhập</h1>
          <p className="helper">Nhập số điện thoại để nhận mã xác thực.</p>
        </header>
        <PhoneForm />
      </div>
    </main>
  );
}
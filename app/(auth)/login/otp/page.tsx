import { redirect } from 'next/navigation';
import { OtpForm } from './OtpForm';

/**
 * /login/otp — phone + OTP login, step 2 (Story 1.1).
 *
 * Reads the normalized phone from the `p` query param (set by /login).
 * Missing param → back to /login. Renders the client-side OtpForm.
 */
type Props = {
  searchParams: Promise<{ p?: string }>;
};

export default async function OtpPage({ searchParams }: Props) {
  const { p } = await searchParams;
  if (!p || !/^84[0-9]{9,10}$/.test(p)) redirect('/login');
  const phone = `+${p}`;
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <header>
          <h1>Nhập mã xác thực</h1>
          <p className="helper">Mã xác thực đã được gửi đến {phone}.</p>
        </header>
        <OtpForm phone={phone} />
      </div>
    </main>
  );
}
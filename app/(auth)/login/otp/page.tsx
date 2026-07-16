import { redirect } from 'next/navigation';
import { OtpForm } from './OtpForm';
import { phoneSchema } from '@/ports/auth';

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
  const nationalNumber = p?.startsWith('84') ? p.slice(2) : '';
  if (
    !p ||
    !phoneSchema.safeParse({ countryCode: '+84', nationalNumber }).success
  ) {
    redirect('/login');
  }
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

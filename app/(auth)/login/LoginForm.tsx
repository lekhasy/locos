'use client';

/**
 * LoginForm — username + password sign-in (Story 1.1 v3).
 *
 * Single-step, single-screen sign-in. UX-DR7 (username field) and UX-DR8
 * (password field). Vietnamese microcopy per UX-DR20.
 *
 * The username + password flow lives on the client because Clerk v6 drives
 * it via `useSignIn()` — there's no server-side `signIn` export. The port
 * adapter (`useClerkSignInPort`) wraps that hook so this component never
 * imports `@clerk/nextjs` directly (AD-1, AD-7).
 *
 * Failure UX: every authentication failure collapses to a single localized
 * message ("Sai tên đăng nhập hoặc mật khẩu"). We never reveal whether the
 * username or the password was wrong.
 */

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useClerkSignInPort } from '@/adapters/clerk/sign-in-client';
import { credentialsSchema } from '@/ports/sign-in';
import { recordLoginAction } from './actions';

const INVALID_CREDENTIALS_MESSAGE = 'Sai tên đăng nhập hoặc mật khẩu';
const GENERIC_ERROR_MESSAGE = 'Đã xảy ra lỗi, thử lại';
const GENERIC_VALIDATION_MESSAGE = 'Vui lòng kiểm tra lại thông tin đăng nhập';

/**
 * Returns the first localized validation issue for display, or a generic
 * fallback. Reserved for the case where the form rejected the input —
 * the credential-specific message ("Sai tên đăng nhập hoặc mật khẩu") is
 * kept distinct so it stays accurate for actual auth failures.
 */
function firstValidationMessage(
  error: z.ZodError<{ username: string; password: string }>,
): string {
  return error.issues[0]?.message ?? GENERIC_VALIDATION_MESSAGE;
}

export function LoginForm() {
  const router = useRouter();
  const usernameId = useId();
  const passwordId = useId();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const { signIn, isLoaded: portLoaded } = useClerkSignInPort();

  const submit = () => {
    if (pending) return;

    const parsed = credentialsSchema.safeParse({ username, password });
    if (!parsed.success) {
      setErrorMessage(firstValidationMessage(parsed.error));
      return;
    }
    if (!portLoaded) {
      setErrorMessage(GENERIC_ERROR_MESSAGE);
      return;
    }

    setErrorMessage(null);
    startTransition(async () => {
      const result = await signIn(parsed.data.username, parsed.data.password);
      if (!result.ok) {
        // Every failure → single generic message. Never differentiate.
        setErrorMessage(INVALID_CREDENTIALS_MESSAGE);
        return;
      }

      // Persist the side-effects (AR-13: shop_login / login_no_shop_row).
      // recordLoginAction is server-side and reads the just-set session
      // cookie to resolve the current shop — by definition a shop row may
      // or may not exist for the user. When it doesn't, route directly
      // to /rep/shops so we avoid a /catalog round-trip (catalog itself
      // redirects there too — see Story 1.3 / Rep C).
      const actionResult = await recordLoginAction();
      if (!actionResult.ok && actionResult.reason === 'no_shop_for_user') {
        router.replace('/rep/shops');
        return;
      }
      router.push('/catalog');
    });
  };

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        submit();
      }}
      noValidate
    >
      <div className="form-row">
        <label htmlFor={usernameId} className="form-label">
          Tên đăng nhập
        </label>
        <input
          id={usernameId}
          type="text"
          autoComplete="username"
          className="input"
          placeholder="Nhập tên đăng nhập"
          aria-label="Tên đăng nhập"
          aria-busy={pending || undefined}
          value={username}
          onChange={e => {
            setUsername(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          readOnly={pending}
        />
      </div>

      <div className="form-row" style={{ marginTop: 'var(--space-4)' }}>
        <label htmlFor={passwordId} className="form-label">
          Mật khẩu
        </label>
        <input
          id={passwordId}
          type="password"
          autoComplete="current-password"
          className="input"
          placeholder="Nhập mật khẩu"
          aria-label="Mật khẩu"
          aria-busy={pending || undefined}
          value={password}
          onChange={e => {
            setPassword(e.target.value);
            if (errorMessage) setErrorMessage(null);
          }}
          readOnly={pending}
        />
      </div>

      <p
        className="form-error"
        role={errorMessage ? 'alert' : undefined}
        style={{ marginTop: 'var(--space-3)' }}
      >
        {errorMessage ?? ''}
      </p>

      <div style={{ marginTop: 'var(--space-5)' }}>
        <button
          type="submit"
          className="button-primary"
          disabled={
            pending ||
            username.length === 0 ||
            password.length === 0
          }
        >
          {pending ? 'Đang đăng nhập…' : 'Đăng nhập'}
        </button>
      </div>
    </form>
  );
}

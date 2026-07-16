'use client';

/**
 * PhoneForm — UX-DR7 phone input.
 *
 * +84 prefix locked, editable 9–10 digit national number, paste-anywhere,
 * auto-submit when valid. Vietnamese microcopy per UX-DR20. ARIA: the prefix
 * span announces "Vietnam (+84)" via aria-label; the editable portion is
 * labelled "Số điện thoại".
 *
 * Clerk wiring: the phone-code flow lives on the client (Clerk v6 drives it
 * via the `useSignIn()` hook — there's no server-side `signIn` export).
 * The port adapter wraps that hook so this component never imports
 * `@clerk/nextjs` directly (AD-1, AD-7).
 */

import { useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useClerkSignInPort } from '@/adapters/clerk/sign-in-client';
import { normalizeVietnamNationalNumber, phoneSchema } from '@/ports/auth';

function isValidNational(digits: string): boolean {
  return phoneSchema.safeParse({ countryCode: '+84', nationalNumber: digits }).success;
}

function errorMessage(reason: string | undefined): string {
  switch (reason) {
    case 'not_provisioned':
      return 'Số điện thoại chưa được đăng ký';
    case 'invalid_identifier':
      return 'Cấu hình Clerk chưa cho phép đăng nhập bằng số điện thoại';
    case 'send_failed':
      return 'Đã xảy ra lỗi, thử lại';
    case 'invalid_input':
      return 'Số điện thoại không hợp lệ';
    default:
      return '';
  }
}

export function PhoneForm() {
  const router = useRouter();
  const labelId = useId();
  const [national, setNational] = useState('');
  const [reason, setReason] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const nationalRef = useRef<HTMLInputElement>(null);
  const { requestOtp, isLoaded: portLoaded } = useClerkSignInPort();

  const isInvalid = reason === 'invalid_input';
  const errorText = errorMessage(reason);

  const submit = (digits: string) => {
    if (pending) return;
    if (!isValidNational(digits)) {
      setReason('invalid_input');
      return;
    }
    if (!portLoaded) {
      setReason('send_failed');
      return;
    }
    setReason(undefined);
    startTransition(async () => {
      const result = await requestOtp({
        countryCode: '+84',
        nationalNumber: digits,
      });
      if (result.ok) {
        router.push(`/login/otp?p=84${digits}`);
        return;
      }
      setReason(result.reason);
      nationalRef.current?.focus();
    });
  };

  const onNationalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = normalizeVietnamNationalNumber(e.target.value);
    setNational(next);
    if (reason) setReason(undefined);
    if (isValidNational(next)) {
      // Defer to allow React to commit the value before submitting.
      queueMicrotask(() => formRef.current?.requestSubmit());
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const pasted = e.clipboardData.getData('text');
    const digits = normalizeVietnamNationalNumber(pasted);
    if (!digits) return;
    e.preventDefault();
    setNational(digits);
    if (isValidNational(digits)) {
      queueMicrotask(() => formRef.current?.requestSubmit());
    } else {
      nationalRef.current?.focus();
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={e => {
        e.preventDefault();
        submit(national);
      }}
      noValidate
    >
      <div className="form-row">
        <label id={labelId} className="form-label">
          Số điện thoại
        </label>
        <div className="phone-input" onPaste={onPaste} aria-labelledby={labelId}>
          <span className="phone-input__prefix" aria-label="Vietnam (+84)">
            +84
          </span>
          <input
            ref={nationalRef}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            pattern="[0-9]{9,10}"
            maxLength={10}
            className="phone-input__national"
            placeholder="Nhập số điện thoại"
            aria-label="Số điện thoại"
            aria-invalid={isInvalid || undefined}
            aria-busy={pending || undefined}
            value={national}
            onChange={onNationalChange}
            readOnly={pending}
          />
        </div>
        <p className="form-error" role={errorText ? 'alert' : undefined}>
          {errorText}
        </p>
      </div>
      <button
        type="submit"
        className="button-primary"
        disabled={pending || !isValidNational(national)}
      >
        {pending ? 'Đang gửi…' : 'Tiếp tục'}
      </button>
    </form>
  );
}

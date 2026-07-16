'use client';

/**
 * OtpForm — UX-DR8 OTP cell.
 *
 * Six 48×56 cells, paste-anywhere, auto-advance, auto-submit, 60s resend
 * cooldown. Vietnamese microcopy per UX-DR20. ARIA live region announces
 * "OTP đã nhận" on paste (the AC's "OTP received" is the English spec; the
 * rendered text is Vietnamese per UX-DR20).
 *
 * Clerk wiring: the phone-code verification call lives on the client
 * (`useClerkSignInPort()` wraps Clerk's `useSignIn()`). After Clerk
 * activates the session we call `recordLoginAction()` to confirm a locos
 * shop row exists and emit `shop_login` (AR-13).
 */

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
} from 'react';
import { useRouter } from 'next/navigation';
import { useClerkSignInPort } from '@/adapters/clerk/sign-in-client';
import { recordLoginAction } from '../actions';

const CELLS = 6 as const;
const COOLDOWN_SECONDS = 60;

function parsePhone(input: string): { countryCode: '+84'; nationalNumber: string } | null {
  // input arrives as "+84xxxxxxxxx" from /login/otp?p=...
  if (!input.startsWith('+84')) return null;
  const national = input.slice(3);
  if (!/^[0-9]{9,10}$/.test(national)) return null;
  return { countryCode: '+84', nationalNumber: national };
}

function errorMessage(reason: string | undefined): string {
  switch (reason) {
    case 'invalid_code':
      return 'Mã OTP không đúng';
    case 'expired':
      return 'Mã đã hết hạn, vui lòng yêu cầu mã mới';
    case 'invalid_input':
      return 'Mã OTP phải gồm 6 chữ số';
    case 'no_shop_for_user':
    case 'unexpected':
      return 'Đã xảy ra lỗi, thử lại';
    default:
      return '';
  }
}

export function OtpForm({ phone }: { phone: string }) {
  const router = useRouter();
  const labelId = useId();
  const liveRegionId = useId();
  const [digits, setDigits] = useState<string[]>(() => Array(CELLS).fill(''));
  const [reason, setReason] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();
  // Reach this page only after PhoneForm's requestOtp succeeded, so the
  // 60s resend window is already in effect. Starting at 0 here would let
  // users spam resends the moment they land.
  const [cooldown, setCooldown] = useState<number>(COOLDOWN_SECONDS);
  const cellRefs = useRef<Array<HTMLInputElement | null>>([]);
  const submittedOnce = useRef(true);
  const { requestOtp, verifyOtp, isLoaded: portLoaded } = useClerkSignInPort();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(s => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const focusCell = useCallback((idx: number) => {
    const el = cellRefs.current[idx];
    if (el) {
      el.focus();
      el.select();
    }
  }, []);

  const submit = useCallback(
    (code: string) => {
      if (pending) return;
      if (!portLoaded) {
        setReason('unexpected');
        return;
      }
      const parsed = parsePhone(phone);
      if (!parsed) {
        setReason('invalid_input');
        return;
      }
      startTransition(async () => {
        const result = await verifyOtp(parsed, code);
        if (!result.ok) {
          setReason(result.reason);
          if (result.reason === 'expired') {
            setDigits(Array(CELLS).fill(''));
            setCooldown(COOLDOWN_SECONDS);
            focusCell(0);
          }
          return;
        }
        // Clerk session is set; record side effects server-side.
        const record = await recordLoginAction();
        if (!record.ok) {
          setReason(record.reason);
          return;
        }
        router.push('/catalog');
      });
    },
    [phone, router, focusCell, verifyOtp, portLoaded, pending],
  );

  const setCell = (idx: number, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned.length === 0) {
      setDigits(prev => {
        const next = [...prev];
        next[idx] = '';
        return next;
      });
      return;
    }
    if (cleaned.length === 1) {
      setDigits(prev => {
        const next = [...prev];
        next[idx] = cleaned;
        return next;
      });
      if (idx < CELLS - 1) focusCell(idx + 1);
      return;
    }
    // Multi-char input: fill from idx onward.
    const chars = cleaned.slice(0, CELLS - idx).split('');
    setDigits(prev => {
      const next = [...prev];
      chars.forEach((c, i) => {
        next[idx + i] = c;
      });
      return next;
    });
    const lastFilled = Math.min(idx + chars.length - 1, CELLS - 1);
    focusCell(Math.min(lastFilled + 1, CELLS - 1));
  };

  const onCellChange = (idx: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (reason) setReason(undefined);
    setCell(idx, e.target.value);
    const next = (() => {
      const arr = [...digits];
      const cleaned = e.target.value.replace(/[^0-9]/g, '');
      if (cleaned.length === 0) arr[idx] = '';
      else if (cleaned.length === 1) arr[idx] = cleaned[0];
      else {
        const chars = cleaned.slice(0, CELLS - idx).split('');
        chars.forEach((c, i) => {
          arr[idx + i] = c;
        });
      }
      return arr;
    })();
    if (next.every(d => d !== '')) {
      submit(next.join(''));
    }
  };

  const onCellKeyDown = (idx: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      e.preventDefault();
      setDigits(prev => {
        const next = [...prev];
        next[idx - 1] = '';
        return next;
      });
      focusCell(idx - 1);
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      e.preventDefault();
      focusCell(idx - 1);
    } else if (e.key === 'ArrowRight' && idx < CELLS - 1) {
      e.preventDefault();
      focusCell(idx + 1);
    }
  };

  const onPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    const cleaned = pasted.replace(/[^0-9]/g, '').slice(0, CELLS);
    if (!cleaned) return;
    e.preventDefault();
    const arr = Array(CELLS).fill('');
    cleaned.split('').forEach((c, i) => {
      arr[i] = c;
    });
    setDigits(arr);
    announce(liveRegionId, 'OTP đã nhận');
    const lastIdx = Math.min(cleaned.length, CELLS) - 1;
    focusCell(Math.min(lastIdx + 1, CELLS - 1));
    if (cleaned.length === CELLS) {
      submit(cleaned);
    }
  };

  const onResend = () => {
    if (cooldown > 0 || pending) return;
    if (!portLoaded) {
      setReason('unexpected');
      return;
    }
    const parsed = parsePhone(phone);
    if (!parsed) {
      setReason('invalid_input');
      return;
    }
    startTransition(async () => {
      const result = await requestOtp(parsed);
      if (result.ok) {
        submittedOnce.current = true;
        setCooldown(COOLDOWN_SECONDS);
        setReason(undefined);
        setDigits(Array(CELLS).fill(''));
        focusCell(0);
      } else {
        setReason(result.reason === 'send_failed' ? 'unexpected' : result.reason);
      }
    });
  };

  const errorText = errorMessage(reason);
  const allFilled = digits.every(d => d !== '');

  return (
    <div aria-labelledby={labelId}>
      <span id={labelId} className="sr-only">
        Mã OTP gồm 6 chữ số
      </span>
      <div className="form-row">
        <div
          className="otp-grid"
          onPaste={onPaste}
          role="group"
          aria-label="Mã OTP gồm 6 chữ số"
        >
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => {
                cellRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={i === 0 ? CELLS : 1}
              className="otp-cell"
              aria-label={`Ô nhập mã OTP ${i + 1}`}
              aria-invalid={reason === 'invalid_code' || reason === 'invalid_input' || undefined}
              value={d}
              onChange={onCellChange(i)}
              onKeyDown={onCellKeyDown(i)}
              disabled={pending}
            />
          ))}
        </div>
        <p className="form-error" role={errorText ? 'alert' : undefined}>
          {errorText}
        </p>
      </div>
      <button
        type="button"
        className="button-primary"
        onClick={() => submit(digits.join(''))}
        disabled={pending || !allFilled}
      >
        {pending ? 'Đang xác thực…' : 'Xác nhận'}
      </button>
      <div style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
        <button
          type="button"
          className="button-text"
          onClick={onResend}
          disabled={cooldown > 0 || pending}
        >
          {cooldown > 0 ? `Gửi lại mã sau ${cooldown}s` : 'Gửi lại mã'}
        </button>
      </div>
      <div id={liveRegionId} className="live-region" role="status" aria-live="polite" />
    </div>
  );
}

function announce(id: string, message: string) {
  const el = document.getElementById(id);
  if (!el) return;
  // Toggle to ensure screen readers pick up repeat announcements.
  el.textContent = '';
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  el.offsetWidth;
  el.textContent = message;
}
'use client';

/**
 * Clerk-backed SignInPort implementation — CLIENT-side only.
 *
 * The phone-code flow in Clerk v6 is driven by the `useSignIn()` hook
 * because the active SignIn object lives on the client. This module
 * wraps that hook and exposes the SignInPort contract so the login UI
 * (`PhoneForm`, `OtpForm`) doesn't import `@clerk/nextjs` directly.
 *
 * Logging: errors are mapped to stable reason strings; phone numbers
 * and OTP codes never appear in the log payloads (defense-in-depth:
 * the logger's redact list also catches them).
 */

import { useSignIn } from '@clerk/nextjs';
import type { PhoneInput } from '@/ports/auth';
import type {
  OtpRequestResult,
  OtpVerifyResult,
  SignInPort,
} from '@/ports/sign-in';
import { metric } from '@/adapters/logger';
import {
  extractClerkCode,
  mapSignInCode,
  type RequestReason,
  type VerifyReason,
} from './sign-in-error-mapping';

const FULL_PHONE = (p: PhoneInput): string => `${p.countryCode}${p.nationalNumber}`;

/**
 * React hook returning the SignInPort for the current render. Components
 * that need the port call this hook (must be in a `'use client'` tree).
 */
export function useClerkSignInPort(): SignInPort & { isLoaded: boolean } {
  const { signIn, isLoaded, setActive } = useSignIn();

  const requestOtp = async (phone: PhoneInput): Promise<OtpRequestResult> => {
    if (!isLoaded) return { ok: false, reason: 'send_failed' };
    try {
      await signIn.create({
        strategy: 'phone_code',
        identifier: FULL_PHONE(phone),
      });
      metric('otp_request_sent', { countryCode: phone.countryCode });
      return { ok: true };
    } catch (err) {
      const code = extractClerkCode(err);
      const mapped = mapSignInCode(code ?? '');
      const reason: RequestReason =
        mapped === 'not_provisioned' ? 'not_provisioned' : 'send_failed';
      metric('otp_request_failed', { reason, hasCode: code !== null });
      return { ok: false, reason };
    }
  };

  const verifyOtp = async (
    _phone: PhoneInput,
    code: string,
  ): Promise<OtpVerifyResult> => {
    if (!isLoaded) return { ok: false, reason: 'unexpected' };
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'phone_code',
        code,
      });
      if (result.createdSessionId && setActive) {
        await setActive({ session: result.createdSessionId });
      }
      metric('otp_verify_succeeded');
      return { ok: true };
    } catch (err) {
      const code = extractClerkCode(err);
      const mapped = mapSignInCode(code ?? '');
      const reason: VerifyReason =
        mapped === 'invalid_code' || mapped === 'expired' ? mapped : 'unexpected';
      metric('otp_verify_failed', { reason, hasCode: code !== null });
      return { ok: false, reason };
    }
  };

  return { requestOtp, verifyOtp, isLoaded };
}
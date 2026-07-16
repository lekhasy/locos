'use client';

/**
 * Clerk-backed SignInPort implementation — CLIENT-side only.
 *
 * The phone-code flow in Clerk v6 is driven by the `useSignIn()` hook
 * because the active SignIn object lives on the client. This module
 * wraps that hook and exposes the SignInPort contract so the login UI
 * (`PhoneForm`, `OtpForm`) doesn't import `@clerk/nextjs` directly.
 *
 * Uses the `__internal_future` API surface (`signIn.__internal_future.phoneCode.*`)
 * instead of the classic `signIn.create({ strategy: 'phone_code' })` /
 * `signIn.attemptFirstFactor({ strategy: 'phone_code' })`. The classic API
 * rejects `phone_code` against the current Clerk FAPI version
 * (`__clerk_api_version=2025-11-10`) with
 * `phone_code does not match one of the allowed values for parameter strategy`.
 * The future-API methods use cleaner typed return shapes and are the path
 * Clerk documents for new flows.
 *
 * Logging: errors are mapped to stable reason strings; phone numbers
 * and OTP codes never appear in the log payloads (defense-in-depth:
 * the logger's redact list also catches them).
 */

import { useSignIn } from '@clerk/nextjs';
import { toVietnamE164, type PhoneInput } from '@/ports/auth';
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

/**
 * React hook returning the SignInPort for the current render. Components
 * that need the port call this hook (must be in a `'use client'` tree).
 */
export function useClerkSignInPort(): SignInPort & { isLoaded: boolean } {
  const { signIn, isLoaded, setActive } = useSignIn();

  const requestOtp = async (phone: PhoneInput): Promise<OtpRequestResult> => {
    if (!isLoaded) return { ok: false, reason: 'send_failed' };
    try {
      const { error } = await signIn.__internal_future.phoneCode.sendCode({
        phoneNumber: toVietnamE164(phone),
      });
      if (error) {
        const code = extractClerkCode(error);
        const mapped = mapSignInCode(code ?? '');
        const reason: RequestReason =
          mapped === 'not_provisioned' || mapped === 'invalid_identifier'
            ? mapped
            : 'send_failed';
        metric('otp_request_failed', { reason, hasCode: code !== null });
        return { ok: false, reason };
      }
      metric('otp_request_sent', { countryCode: phone.countryCode });
      return { ok: true };
    } catch (err) {
      metric('otp_request_failed', { reason: 'send_failed', hasCode: false });
      return { ok: false, reason: 'send_failed' };
    }
  };

  const verifyOtp = async (
    _phone: PhoneInput,
    code: string,
  ): Promise<OtpVerifyResult> => {
    if (!isLoaded) return { ok: false, reason: 'unexpected' };
    try {
      const { error } = await signIn.__internal_future.phoneCode.verifyCode({
        code,
      });
      if (error) {
        const codeStr = extractClerkCode(error);
        const mapped = mapSignInCode(codeStr ?? '');
        const reason: VerifyReason =
          mapped === 'invalid_code' || mapped === 'expired' ? mapped : 'unexpected';
        metric('otp_verify_failed', { reason, hasCode: codeStr !== null });
        return { ok: false, reason };
      }
      const sessionId = signIn.createdSessionId;
      if (sessionId && setActive) {
        await setActive({ session: sessionId });
      }
      metric('otp_verify_succeeded');
      return { ok: true };
    } catch (err) {
      metric('otp_verify_failed', { reason: 'unexpected', hasCode: false });
      return { ok: false, reason: 'unexpected' };
    }
  };

  return { requestOtp, verifyOtp, isLoaded };
}

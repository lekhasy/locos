/**
 * SignInPort — client-side port for the phone + OTP sign-in flow.
 *
 * Clerk v6 exposes `useSignIn()` returning a SignIn resource whose
 * `.create()` and `.attemptFirstFactor()` calls drive the phone-code
 * sign-in flow. Those calls happen on the client because the active
 * SignIn object lives there. This port wraps that flow behind a stable
 * contract so `app/(auth)/login/*` doesn't import `@clerk/nextjs`
 * directly.
 *
 * Phone numbers, OTP codes, and OTP TTLs never escape this port — the
 * UI passes a normalized `PhoneInput` and a 6-digit code; the adapter
 * holds the SignIn resource and Clerk handles the rest.
 */

import type { PhoneInput } from './auth';

export type OtpRequestResult =
  | { ok: true }
  | { ok: false; reason: 'not_provisioned' | 'send_failed' };

export type OtpVerifyResult =
  | { ok: true }
  | { ok: false; reason: 'invalid_code' | 'expired' | 'unexpected' };

export interface SignInPort {
  requestOtp(phone: PhoneInput): Promise<OtpRequestResult>;
  verifyOtp(phone: PhoneInput, code: string): Promise<OtpVerifyResult>;
}
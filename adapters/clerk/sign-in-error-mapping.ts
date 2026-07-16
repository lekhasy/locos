/**
 * Stable mapping for Clerk sign-in error codes → SignInPort reason strings.
 *
 * Lives in its own module (no React, no Clerk import) so it can be unit
 * tested without mocking `@clerk/nextjs`. `sign-in-client.ts` imports from
 * here.
 *
 * Mapping table:
 *   - phone_number_not_provisioned → not_provisioned
 *   - invalid_code / verification_failed → invalid_code
 *   - expired_code → expired
 *   - everything else → null (caller decides the fallback reason)
 *
 * Never log the phone, OTP code, or Clerk error message verbatim. The
 * logger's redact paths (`adapters/logger.ts`) catch phone/code fields
 * defensively, but this module is the primary control.
 */

import type {
  OtpRequestResult,
  OtpVerifyResult,
} from '@/ports/sign-in';

export type RequestReason = Extract<OtpRequestResult, { ok: false }>['reason'];
export type VerifyReason = Extract<OtpVerifyResult, { ok: false }>['reason'];

export function mapSignInCode(code: string): RequestReason | VerifyReason | null {
  switch (code) {
    case 'phone_number_not_provisioned':
      return 'not_provisioned';
    case 'invalid_code':
    case 'verification_failed':
      return 'invalid_code';
    case 'expired_code':
      return 'expired';
    default:
      return null;
  }
}

export function extractClerkCode(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) return null;
  const anyErr = err as {
    errors?: Array<{ code?: string; longMessage?: string; message?: string }>;
    code?: string;
    message?: string;
  };
  if (Array.isArray(anyErr.errors)) {
    for (const e of anyErr.errors) {
      if (typeof e?.code === 'string') return e.code;
    }
  }
  if (typeof anyErr.code === 'string') return anyErr.code;
  return null;
}
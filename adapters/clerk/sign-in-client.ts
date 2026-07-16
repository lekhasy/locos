'use client';

/**
 * Clerk-backed SignInPort implementation — CLIENT-side only.
 *
 * Story 1.1 v3: locos uses Clerk's `username` strategy (no email/phone
 * verification, no OTP). The active `SignIn` resource lives on the client
 * because Clerk v6 drives the flow through `useSignIn()`; we wrap that
 * hook so the login UI (`LoginForm`) never imports `@clerk/nextjs` directly
 * (AD-1, AD-7).
 *
 * Flow:
 *   1. `signIn.__internal_future.password({ identifier, password })` —
 *      Clerk v6's `SignInFutureResource.password()` accepts username and
 *      password in one call (SignInFuturePasswordParams).
 *   2. On success, `signIn.__internal_future.finalize({ session })` to set
 *      the newly-created session as the active session. The hook's
 *      `setActive` may also be used; we prefer `finalize` since it's the
 *      future-API pairing documented by Clerk.
 *
 * Logging policy: error mappings emit stable reason strings (`invalid_credentials`
 * for every documented failure, `unexpected` for the rest). The password
 * itself never reaches the logger — neither in payloads nor in keys. Username
 * is intentionally also not logged (the metric keys are stable identifiers;
 * see tests/sign-in-error-mapping.test.ts for the boundary discipline).
 */

import { useSignIn } from '@clerk/nextjs';
import type { SignInPort, SignInResult } from '@/ports/sign-in';
import { metric } from '@/adapters/logger';
import {
  extractClerkCode,
  mapSignInCode,
  type SignInReason,
} from './sign-in-error-mapping';

const GENERIC_UNEXPECTED: SignInResult = { ok: false, reason: 'unexpected' };

/**
 * React hook returning the SignInPort for the current render. Components
 * that need the port call this hook (must be in a `'use client'` tree).
 */
export function useClerkSignInPort(): SignInPort & { isLoaded: boolean } {
  const { signIn, isLoaded, setActive } = useSignIn();

  const submit = async (
    identifier: string,
    password: string,
  ): Promise<SignInResult> => {
    if (!isLoaded || !setActive) return GENERIC_UNEXPECTED;

    metric('sign_in_attempted');

    try {
      const { error } = await signIn.__internal_future.password({
        identifier,
        password,
      });

      if (error) {
        const code = extractClerkCode(error);
        const mapped = mapSignInCode(code ?? '');
        const reason: SignInReason =
          mapped === 'invalid_credentials' ? mapped : 'unexpected';
        metric('sign_in_failed', { reason, hasCode: code !== null });
        return { ok: false, reason };
      }

      // The session id lives on the future resource. `setActive()` from
      // `useSignIn()` is the documented Clerk v6 way to persist a freshly
      // created session — `SignInFutureResource.finalize()` only takes
      // optional navigate params, so we use `setActive` here.
      const sessionId = signIn.__internal_future.createdSessionId;
      if (sessionId) {
        await setActive({ session: sessionId });
      }

      metric('sign_in_succeeded');
      return { ok: true };
    } catch {
      metric('sign_in_failed', { reason: 'unexpected', hasCode: false });
      return GENERIC_UNEXPECTED;
    }
  };

  return { signIn: submit, isLoaded };
}

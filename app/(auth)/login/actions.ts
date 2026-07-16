'use server';

/**
 * Server action that records a successful phone-code login (Story 1.1).
 *
 * Why this exists separately: Clerk v6's phone-code sign-in is driven by
 * the client-side `useSignIn()` hook (see `adapters/clerk/sign-in-client.ts`).
 * The actual sign-in therefore happens in the browser; this action runs
 * AFTER `setActive()` has persisted the session and just records the side
 * effects: confirming a `shop` row exists, emitting `shop_login` (AR-13),
 * and emitting `login_no_shop_row` for ops when a Clerk user has no locos
 * shop (Story 1.3 will tighten to provisioned-only enforcement).
 *
 * Never log phone, OTP code, or verbatim Clerk error bodies — the only
 * fields emitted are stable reason strings and the locos shop id.
 */

import { clerkAuthAdapterFactory } from '@/adapters/clerk/auth';
import { getCurrentShop } from '@/core/shop/get-current-shop';
import { metric } from '@/adapters/logger';

export type RecordLoginResult =
  | { ok: true }
  | { ok: false; reason: 'no_shop_for_user' | 'unexpected' };

export async function recordLoginAction(): Promise<RecordLoginResult> {
  try {
    const shop = await getCurrentShop(clerkAuthAdapterFactory());
    if (!shop) {
      metric('login_no_shop_row');
      return { ok: false, reason: 'no_shop_for_user' };
    }
    metric('shop_login', { shopId: shop.id });
    return { ok: true };
  } catch (err) {
    metric('record_login_failed', { hasError: err instanceof Error });
    return { ok: false, reason: 'unexpected' };
  }
}
'use server';

/**
 * resetShopPasswordAction — server action for the rep-initiated reset.
 *
 * Story 1.3 / Rev C: the rep clicks "Đặt lại mật khẩu" on the shop
 * detail page. This action:
 *
 *   1. Looks up the `shop` row by `shopId` (URL param) so we have the
 *      `clerk_user_id` (the `shop` row holds the opaque id, not the
 *      username).
 *   2. Calls `resetShopPassword` orchestrator with that id.
 *   3. Returns the new credentials on success, or a stable reason on
 *      failure. The client renders the existing `<CredentialsCard>` on
 *      success — same UX as the create flow.
 *
 * AD-1: ports factory-injected at the action boundary. No `@clerk` or
 * `drizzle` imports. Metric emission lives here (boundary), not inside
 * `core/rep/`.
 */

import { postgresShopRepositoryFactory } from '@/adapters/postgres/repositories/shop-repository';
import { clerkRepAdapterFactory } from '@/adapters/clerk/rep';
import { resetShopPassword } from '@/core/rep/reset-shop-password';
import { DEFAULT_LOCOS_LOGIN_URL } from '@/core/rep/credentials-message';
import { metric } from '@/adapters/logger';
import { requireSalesRep } from '@/app/rep/auth-guard';

export type ResetShopPasswordActionInput = {
  shopId: string;
};

export type ResetShopPasswordActionResult =
  | {
      ok: true;
      credentials: {
        username: string;
        password: string;
        loginUrl: string;
      };
    }
  | {
      ok: false;
      reason:
        | 'shop_not_found'
        | 'username_lookup_failed'
        | 'password_set_failed';
    };

export async function resetShopPasswordAction(
  input: ResetShopPasswordActionInput,
): Promise<ResetShopPasswordActionResult> {
  await requireSalesRep();

  const shop = await postgresShopRepositoryFactory().get(input.shopId);
  if (!shop) {
    metric('rep_password_reset_failed', {
      shopId: input.shopId,
      reason: 'shop_not_found',
    });
    return { ok: false, reason: 'shop_not_found' };
  }

  const result = await resetShopPassword(
    { clerkUserId: shop.clerkUserId },
    { repPort: clerkRepAdapterFactory() },
  );
  if (!result.ok) {
    metric('rep_password_reset_failed', {
      shopId: input.shopId,
      reason: result.reason,
    });
    return { ok: false, reason: result.reason };
  }

  metric('rep_password_reset_succeeded', { shopId: input.shopId });
  return {
    ok: true,
    credentials: {
      username: result.username,
      password: result.newPassword,
      loginUrl: DEFAULT_LOCOS_LOGIN_URL,
    },
  };
}
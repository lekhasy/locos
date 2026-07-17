'use server';

/**
 * createShopAction — server action for the rep's new-shop form.
 *
 * Story 1.3 / Rev C AC #4: writes a Clerk user first via
 * `clerkClient.users.createUser`, then writes the matching `shop` row
 * bound by `clerkUserId`. Both writes happen in the same handler.
 *
 * Boundary guards:
 *   - Authorization (`requireSalesRep`): the layout already redirects
 *     non-reps on navigation, but a server action is also an endpoint
 *     and a determined caller could POST here without hitting the
 *     layout. We re-check the role at the top of the action.
 *   - Runtime validation (`createShopActionInputSchema`): the form's
 *     client-side validation is a UX hint, not a security boundary.
 *     Domain validation lives in `core/rep/create-shop.ts`; this
 *     schema guarantees the action receives well-typed strings and
 *     returns a structured failure (instead of throwing on a malformed
 *     payload) before reaching the orchestrator.
 *
 * Metric boundary (Patch 6 distinction): every failure now maps to a
 * stable event name:
 *   - rep_shop_create_succeeded          (Clerk + Postgres both ok)
 *   - rep_shop_create_partial_failure    (Clerk ok, Postgres failed — orphan user)
 *   - rep_shop_create_failed             (Clerk rejected — no orphan)
 * The unrelated per-attempt `rep_shop_create_failed` emitted inside
 * `adapters/clerk/rep.ts` is keyed on the upstream Clerk-side reason
 * and is meant for Clerk anomaly alerting; the boundary event is the
 * rep-flow signal. Both keep their original names so AR-13 consumers
 * don't need to relearn the contract.
 *
 * Credentials handoff: on success, the action returns the rep's username
 * + password + login URL so the client form can render the copy-to-clip
 * card. We do NOT redirect to the detail page — the rep must see the
 * credentials and copy them before navigating away. The password is not
 * persisted anywhere; this is the only window the rep has to capture
 * it for the shop-owner handoff.
 */

import { clerkRepAdapterFactory } from '@/adapters/clerk/rep';
import { postgresShopRepositoryFactory } from '@/adapters/postgres/repositories/shop-repository';
import { createShop } from '@/core/rep/create-shop';
import type { CreateShopInput } from '@/ports/rep';
import { metric } from '@/adapters/logger';
import { DEFAULT_LOCOS_LOGIN_URL } from '@/core/rep/credentials-message';
import { requireSalesRep } from '@/app/rep/auth-guard';
import { z } from 'zod';

/**
 * Wire-format schema — bounds chosen to be wider than the domain
 * checks so the domain remains the source of truth for length and
 * character constraints. Anything outside this schema (missing key,
 * wrong type) is treated as a malformed direct-call and surfaces as
 * an `invalid_input` result.
 */
const createShopActionInputSchema = z.object({
  username: z.string().min(1).max(128),
  password: z.string().min(1).max(256),
  displayName: z.string().max(256),
  address: z.string().max(1024),
  contactPhone: z.string().max(256),
});

export type CreateShopActionInput = z.infer<typeof createShopActionInputSchema>;

export type CreateShopActionResult =
  | {
      ok: true;
      shopId: string;
      credentials: {
        username: string;
        password: string;
        loginUrl: string;
      };
    }
  | { ok: false; reason: 'username_taken' }
  | {
      ok: false;
      reason: 'invalid_input';
      field: 'username' | 'password' | 'displayName' | 'address' | 'contactPhone';
    }
  | {
      ok: false;
      reason: 'shop_write_failed';
      partialClerkUserCreated: boolean;
    };

export async function createShopAction(
  rawInput: unknown,
): Promise<CreateShopActionResult> {
  await requireSalesRep();

  const parsed = createShopActionInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    // Malformed payload (missing key, wrong type). Surface as an
    // invalid_input without claiming a specific field — the form
    // cannot have produced this shape and a direct call shouldn't
    // learn more than "the payload was wrong".
    metric('rep_shop_create_failed', { reason: 'invalid_input', malformed: true });
    return { ok: false, reason: 'invalid_input', field: 'username' };
  }
  const input = parsed.data;

  // Trim the username at the boundary so what we echo back via
  // credentials matches what Clerk stored (the core also trims, but the
  // form-level rep-touched value should be trimmed once here).
  const trimmedUsername = input.username.trim();
  const domainInput: CreateShopInput = {
    username: trimmedUsername,
    password: input.password,
    displayName: input.displayName,
    address: input.address,
    contactPhone:
      typeof input.contactPhone === 'string' &&
      input.contactPhone.trim().length === 0
        ? null
        : input.contactPhone,
  };

  const result = await createShop(domainInput, {
    repPort: clerkRepAdapterFactory(),
    shopRepo: postgresShopRepositoryFactory(),
  });

  if (result.ok) {
    metric('rep_shop_create_succeeded', { shopId: result.shop.id });
    return {
      ok: true,
      shopId: result.shop.id,
      credentials: {
        username: trimmedUsername,
        password: input.password,
        loginUrl: DEFAULT_LOCOS_LOGIN_URL,
      },
    };
  }

  if (result.reason === 'username_taken') {
    metric('rep_shop_create_failed', { reason: 'username_taken' });
    return { ok: false, reason: 'username_taken' };
  }
  if (result.reason === 'invalid_input') {
    metric('rep_shop_create_failed', { reason: 'invalid_input', field: result.field });
    return { ok: false, reason: 'invalid_input', field: result.field };
  }
  // shop_write_failed — distinguish orphan-user (partial) from
  // pure-Clerk-rejection (no orphan) so dashboards don't conflate
  // them. Orphan-user case is operationally rarer and the more
  // important signal for the rep UX.
  if (result.partialClerkUserCreated) {
    metric('rep_shop_create_partial_failure', { reason: 'shop_write_failed' });
  } else {
    metric('rep_shop_create_failed', {
      reason: 'shop_write_failed_clerk_upstream',
    });
  }
  return {
    ok: false,
    reason: 'shop_write_failed',
    partialClerkUserCreated: result.partialClerkUserCreated,
  };
}

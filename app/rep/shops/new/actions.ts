'use server';

/**
 * createShopAction — server action for the rep's new-shop form.
 *
 * Story 1.3 / Rev C AC #4: writes a Clerk user first via
 * `clerkClient.users.createUser`, then writes the matching `shop` row
 * bound by `clerkUserId`. Both writes happen in the same handler.
 *
 * AD-1 compliant: ports are factory-injected at the action boundary.
 * No `@clerk` or `drizzle` import beyond the boundary files. Metric
 * emission lives at the boundary (this file), not inside `core/rep/`.
 *
 * Server actions can only return serializable values; we return a plain
 * object the client component can render.
 *
 * The action boundary normalizes the form's "always-a-string" contact
 * phone to `null` (the form submits an empty string when the rep leaves
 * the field blank; the DB column is nullable and stores NULL for "not
 * provided").
 */

import { redirect } from 'next/navigation';
import { clerkRepAdapterFactory } from '@/adapters/clerk/rep';
import { postgresShopRepositoryFactory } from '@/adapters/postgres/repositories/shop-repository';
import { createShop } from '@/core/rep/create-shop';
import type { CreateShopInput } from '@/ports/rep';
import { metric } from '@/adapters/logger';

/**
 * Wire-format input — what the form sends. `contactPhone` is always a
 * string (HTML form reality). The action converts empty → null before
 * calling the domain.
 */
export type CreateShopActionInput = {
  username: string;
  password: string;
  displayName: string;
  address: string;
  contactPhone: string;
};

export type CreateShopActionResult =
  | { ok: true; shopId: string }
  | {
      ok: false;
      reason: 'username_taken' | 'shop_write_failed' | 'invalid_input';
      field?: 'username' | 'password' | 'displayName' | 'address' | 'contactPhone';
      partialClerkUserCreated?: boolean;
    };

export async function createShopAction(
  input: CreateShopActionInput,
): Promise<CreateShopActionResult> {
  const domainInput: CreateShopInput = {
    username: input.username,
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
    redirect(`/rep/shops/${result.shop.id}`);
  }

  if (result.reason === 'username_taken') {
    return { ok: false, reason: 'username_taken', field: 'username' };
  }
  if (result.reason === 'invalid_input') {
    return { ok: false, reason: 'invalid_input', field: result.field };
  }
  // shop_write_failed — includes partial-failure orphan case.
  metric('rep_shop_create_partial_failure', {
    partial: result.partialClerkUserCreated === true,
  });
  return {
    ok: false,
    reason: 'shop_write_failed',
    partialClerkUserCreated: result.partialClerkUserCreated,
  };
}

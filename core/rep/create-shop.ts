/**
 * createShop — rep orchestrator for the two-write provisioning sequence.
 *
 * Story 1.3 / Rev C: a sales rep submits the new-shop form. The handler
 * must:
 *   1. Validate inputs against the same constraints as the form schema.
 *   2. Call Clerk's `users.createUser` (via `RepPort`) FIRST. If Clerk
 *      rejects (username taken, format invalid, etc.), return failure and
 *      DO NOT write the `shop` row.
 *   3. Call `shopRepository.insert({ clerkUserId, ... })`. If this throws
 *      (network blip, DB constraint violation), return
 *      `{ ok: false; reason: 'shop_write_failed'; partialClerkUserCreated: true }`.
 *      Best-effort — no compensating delete on the Clerk side; orphan
 *      Clerk users are visible to ops via Clerk dashboard.
 *
 * AD-1: ports injected as parameters. No `@clerk`, `drizzle`, or
 * `adapters/*` imports inside `core/` — metric emission is owned by
 * the caller's adapter layer (`adapters/clerk/rep.ts`,
 * `app/rep/shops/new/actions.ts`).
 */

import type {
  CreateShopInput,
  CreateShopResult,
  RepPort,
} from '@/ports/rep';
import type { ShopRepositoryPort } from '@/ports/shop-repository';

const USERNAME_RE = /^[a-zA-Z0-9_-]+$/;
const MAX_USERNAME = 32;
const MIN_USERNAME = 3;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;
const MAX_DISPLAY_NAME = 80;
const MIN_DISPLAY_NAME = 1;
const MAX_ADDRESS = 200;
const MAX_CONTACT_PHONE = 32;

type ValidatedInput = {
  username: string;
  password: string;
  displayName: string;
  address: string;
  contactPhone: string | null;
};

function validateInput(input: CreateShopInput): CreateShopResult | ValidatedInput {
  const username = input.username.trim();
  if (!username || username.length < MIN_USERNAME || username.length > MAX_USERNAME) {
    return { ok: false, reason: 'invalid_input', field: 'username' };
  }
  if (!USERNAME_RE.test(username)) {
    return { ok: false, reason: 'invalid_input', field: 'username' };
  }
  if (
    !input.password ||
    input.password.length < MIN_PASSWORD ||
    input.password.length > MAX_PASSWORD
  ) {
    return { ok: false, reason: 'invalid_input', field: 'password' };
  }
  const displayName = input.displayName.trim();
  if (
    displayName.length < MIN_DISPLAY_NAME ||
    displayName.length > MAX_DISPLAY_NAME
  ) {
    return { ok: false, reason: 'invalid_input', field: 'displayName' };
  }
  if (input.address.length > MAX_ADDRESS) {
    return { ok: false, reason: 'invalid_input', field: 'address' };
  }
  // contactPhone is optional. Allow null OR a string within the max
  // length. The form will pass empty string when the rep leaves the
  // field blank; we treat that the same as null at the repo boundary.
  if (
    input.contactPhone !== null &&
    input.contactPhone.length > MAX_CONTACT_PHONE
  ) {
    return { ok: false, reason: 'invalid_input', field: 'contactPhone' };
  }
  // Trimmed values are the canonical store-side form. Replace input.
  return {
    username,
    password: input.password,
    displayName,
    address: input.address,
    contactPhone: input.contactPhone,
  };
}

function isValidated(v: CreateShopResult | ValidatedInput): v is ValidatedInput {
  return !('ok' in v);
}

export type CreateShopDeps = {
  repPort: RepPort;
  shopRepo: ShopRepositoryPort;
};

export async function createShop(
  input: CreateShopInput,
  deps: CreateShopDeps,
): Promise<CreateShopResult> {
  const validated = validateInput(input);
  if (!isValidated(validated)) return validated;
  const v: ValidatedInput = validated;

  // (1) Clerk first — never write the shop row without the clerkUserId.
  const clerkResult = await deps.repPort.createClerkUser({
    username: v.username,
    password: v.password,
  });

  if (!clerkResult.ok) {
    // The Clerk adapter's reason set is a subset of our rep reason set;
    // any "unexpected" upstream surfaces as a generic "shop_write_failed"
    // to the rep (no useful action on the form).
    if (clerkResult.reason === 'username_taken') {
      return { ok: false, reason: 'username_taken' };
    }
    if (clerkResult.reason === 'invalid_input') {
      return { ok: false, reason: 'invalid_input', field: 'username' };
    }
    return { ok: false, reason: 'shop_write_failed' };
  }

  // (2) Postgres second. Failure here leaves an orphan Clerk user.
  try {
    const created = await deps.shopRepo.insert({
      clerkUserId: clerkResult.clerkUserId,
      displayName: v.displayName,
      address: v.address,
      contactPhone: v.contactPhone,
    });
    return { ok: true, shop: { id: created.id } };
  } catch {
    return {
      ok: false,
      reason: 'shop_write_failed',
      partialClerkUserCreated: true,
    };
  }
}

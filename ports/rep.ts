/**
 * RepPort — AD-7 sister clause for the sales-rep surface (Story 1.3 / Rev C).
 *
 * Sales-rep identity is a Clerk user flagged with `publicMetadata.role =
 * 'sales_rep'`. The rep shell reads that flag in the layout guard and
 * dispatches the rep into `app/rep/*`. This port is the only contract
 * `core/rep/` depends on for Clerk interactions.
 *
 * Split:
 *   - `createClerkUser` lives in the Clerk server client (it's the only
 *     writer in the repo); the role detection lives alongside because
 *     `currentUser()` is a Clerk-server primitive.
 *   - List/get is implemented in the Postgres shop repository
 *     (`ports/shop-repository.ts`); the rep surface inlines it via
 *     `core/rep/list-shops.ts` to keep `core/rep/` small.
 */

export type CreateClerkUserInput = {
  username: string;
  password: string;
};

export type CreateClerkUserResult =
  | { ok: true; clerkUserId: string }
  | { ok: false; reason: 'username_taken' | 'invalid_input' | 'unexpected' };

export interface RepPort {
  /**
   * Create a new Clerk user via `clerkClient.users.createUser` and return
   * the issued `user_xxx` id. The matching `shop` row is written by the
   * orchestrating use case in `core/rep/create-shop.ts` (not here) —
   * keeping the two writes separate lets `core/rep` distinguish the full
   * vs partial failure cases.
   */
  createClerkUser(input: CreateClerkUserInput): Promise<CreateClerkUserResult>;
}

export type RepPortFactory = () => RepPort;

export type CreateShopInput = CreateClerkUserInput & {
  displayName: string;
  address: string;
  /**
   * Optional. Empty strings are normalized to null at the repo insert
   * so the DB column's "not provided" semantics aren't muddied.
   */
  contactPhone: string | null;
};

export type CreateShopResult =
  | { ok: true; shop: { id: string } }
  | {
      ok: false;
      reason: 'invalid_input' | 'username_taken' | 'shop_write_failed';
      partialClerkUserCreated?: boolean;
      field?: 'username' | 'password' | 'displayName' | 'address' | 'contactPhone';
    };

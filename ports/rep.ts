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
  | { ok: false; reason: 'username_taken' }
  | { ok: false; reason: 'invalid_input'; field?: 'username' | 'password' }
  | { ok: false; reason: 'unexpected' };

export interface RepPort {
  /**
   * Create a new Clerk user via `clerkClient.users.createUser` and return
   * the issued `user_xxx` id. The matching `shop` row is written by the
   * orchestrating use case in `core/rep/create-shop.ts` (not here) —
   * keeping the two writes separate lets `core/rep` distinguish the full
   * vs partial failure cases.
   */
  createClerkUser(input: CreateClerkUserInput): Promise<CreateClerkUserResult>;

  /**
   * Set a Clerk user's password directly via
   * `clerkClient.users.updateUser`. Used by the reset-password flow when
   * a shop owner forgets their first-login credentials — the rep resets
   * server-side and copies the new password to the shop owner. The
   * password value comes from `generatePassword` in `core/rep/`; the
   * adapter is intentionally dumb and just hands it to Clerk.
   */
  setClerkUserPassword(
    clerkUserId: string,
    newPassword: string,
  ): Promise<SetClerkPasswordResult>;

  /**
   * Read the username from a Clerk user. Used by the reset flow to put
   * the shop owner's username back into the regenerated copy card —
   * the `shop` row holds the opaque `clerk_user_id`, not the username,
   * so we ask Clerk. Returns `not_found` if the Clerk user is missing
   * or has no username set.
   */
  getClerkUsername(clerkUserId: string): Promise<GetClerkUsernameResult>;
}

export type SetClerkPasswordResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'unexpected' };

export type GetClerkUsernameResult =
  | { ok: true; username: string }
  | { ok: false; reason: 'not_found' | 'unexpected' };

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
  | { ok: false; reason: 'username_taken' }
  | {
      ok: false;
      reason: 'invalid_input';
      field: 'username' | 'password' | 'displayName' | 'address' | 'contactPhone';
    }
  | {
      ok: false;
      reason: 'shop_write_failed';
      /**
       * `true` — Clerk user was created but the local `shop` insert failed;
       * the rep sees a partial-failure banner and should retry with a
       * different username. Orphan Clerk users are visible to ops via
       * Clerk dashboard (no compensating delete).
       * `false` — Clerk rejected the createUser call; no Clerk user was
       * created. The rep sees a generic failure banner and can retry
       * without changing credentials.
       */
      partialClerkUserCreated: boolean;
    };

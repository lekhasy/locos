/**
 * resetShopPassword — orchestrator for the rep-initiated password reset.
 *
 * Story 1.3 / Rev C: a shop owner forgets their first-login password and
 * asks the rep for help. The rep clicks "Đặt lại mật khẩu" on the shop
 * detail page; this orchestrator runs:
 *
 *   1. Look up the username via `RepPort.getClerkUsername(clerkUserId)`
 *      — needed to put the username back into the regenerated copy
 *      card (we only persist `clerk_user_id` on the `shop` row).
 *   2. Generate a fresh 12-char password via `generatePassword()`.
 *   3. Push it to Clerk via `RepPort.setClerkUserPassword`.
 *   4. Return `{ ok: true; username; newPassword }` so the action layer
 *      can render the copy card.
 *
 * Step 1 and step 3 are not transactional — if step 3 fails, step 1 was
 * a no-op read so there's no partial state to clean up. If step 1 fails
 * we never generate a password (no waste).
 *
 * Concurrency: two near-simultaneous resets for the SAME `clerkUserId`
 * would each generate a distinct password and overwrite each other's
 * update in Clerk; the earlier response would return credentials the
 * later Clerk update invalidated. We serialize per-clerkUserId with an
 * in-process mutex (sufficient for the "rep double-clicks the button"
 * case; the surface is single-rep, single-server). Cross-process races
 * would need a Postgres advisory lock — out of scope for MVP.
 *
 * AD-1: only `ports/rep` + local `password-generator`. No `@clerk`,
 * `drizzle`, or `@/adapters` imports.
 */

import type { RepPort } from '@/ports/rep';
import { generatePassword } from './password-generator';

export type ResetShopPasswordInput = {
  clerkUserId: string;
};

export type ResetShopPasswordDeps = {
  repPort: RepPort;
};

export type ResetShopPasswordResult =
  | { ok: true; username: string; newPassword: string }
  | {
      ok: false;
      reason: 'username_lookup_failed' | 'password_set_failed';
    };

// Per-clerkUserId serialization. We chain every call onto the previous
// tail so the writes to Clerk are non-interleaving for the same user.
const resetLocks = new Map<string, Promise<unknown>>();

async function withResetLock<T>(
  clerkUserId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const previous = resetLocks.get(clerkUserId);
  const next = (previous ?? Promise.resolve())
    .catch(() => undefined)
    .then(fn);
  // Store the .catch'd chain so observers aren't rejected, but await `next`
  // for the real result.
  resetLocks.set(clerkUserId, next.catch(() => undefined));
  try {
    return await next;
  } finally {
    // Only clear the slot if no newer caller chained onto us. Otherwise
    // we'd let a queued caller race against the fresh head.
    if (resetLocks.get(clerkUserId) === next) {
      resetLocks.delete(clerkUserId);
    }
  }
}

export async function resetShopPassword(
  input: ResetShopPasswordInput,
  deps: ResetShopPasswordDeps,
): Promise<ResetShopPasswordResult> {
  return withResetLock(input.clerkUserId, async () => {
    const usernameResult = await deps.repPort.getClerkUsername(input.clerkUserId);
    if (!usernameResult.ok) {
      return { ok: false, reason: 'username_lookup_failed' };
    }

    const newPassword = generatePassword();
    const passwordResult = await deps.repPort.setClerkUserPassword(
      input.clerkUserId,
      newPassword,
    );
    if (!passwordResult.ok) {
      return { ok: false, reason: 'password_set_failed' };
    }

    return {
      ok: true,
      username: usernameResult.username,
      newPassword,
    };
  });
}

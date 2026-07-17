/**
 * Clerk-backed RepPort implementation (AD-7 sister clause, Rev C).
 *
 * This file imports from `@clerk/nextjs/server` only. `core/rep/*` consumes
 * `RepPort` without ever importing Clerk. Role detection (`publicMetadata.role`)
 * is co-located here because `currentUser()` is a Clerk-server primitive.
 *
 * The `createClerkUser` write is the only code path in the locos repo that
 * creates Clerk users. The matching `shop` row is written by
 * `core/rep/create-shop.ts` against `ShopRepositoryPort`, NOT here, so the
 * core layer can distinguish the full-success vs partial-failure cases
 * (and because AD-1 forbids `core/rep` from importing `@clerk`).
 *
 * Logging policy: never log username, password, or verbatim Clerk error
 * bodies. Errors funnel through `rep-error-mapping.ts` to a stable reason
 * string and a `hasCode` flag is emitted alongside the metric.
 */

import { clerkClient, currentUser } from '@clerk/nextjs/server';
import type {
  CreateClerkUserInput,
  CreateClerkUserResult,
  GetClerkUsernameResult,
  RepPort,
  RepPortFactory,
  SetClerkPasswordResult,
} from '@/ports/rep';
import { metric } from '@/adapters/logger';
import {
  extractClerkCode,
  mapCreateUserCode,
} from './rep-error-mapping';

const UNEXPECTED: CreateClerkUserResult = { ok: false, reason: 'unexpected' };

export class ClerkRepAdapter implements RepPort {
  async createClerkUser(input: CreateClerkUserInput): Promise<CreateClerkUserResult> {
    metric('rep_shop_create_attempted');
    try {
      const client = await clerkClient();
      const user = await client.users.createUser({
        username: input.username,
        password: input.password,
      });

      const clerkUserId = user?.id;
      if (typeof clerkUserId !== 'string' || clerkUserId.length === 0) {
        metric('rep_shop_create_failed', { reason: 'unexpected', hasCode: false });
        return UNEXPECTED;
      }

      metric('rep_shop_create_clerk_succeeded');
      return { ok: true, clerkUserId };
    } catch (err) {
      const code = extractClerkCode(err);
      const mapped = mapCreateUserCode(code);
      const reason =
        mapped === 'username_taken' || mapped === 'invalid_input'
          ? mapped
          : 'unexpected';
      metric('rep_shop_create_failed', { reason, hasCode: code !== null });
      return { ok: false, reason };
    }
  }

  async setClerkUserPassword(
    clerkUserId: string,
    newPassword: string,
  ): Promise<SetClerkPasswordResult> {
    metric('rep_password_reset_attempted');
    try {
      const client = await clerkClient();
      await client.users.updateUser(clerkUserId, { password: newPassword });
      metric('rep_password_reset_clerk_succeeded');
      return { ok: true };
    } catch (err) {
      const code = extractClerkCode(err);
      // Clerk returns resource_not_found / 404-ish when the user id is
      // unknown. Without a stable code map (password writes have fewer
      // error shapes than create), fall back to `unexpected` and let the
      // caller re-check.
      const reason = code === 'resource_not_found' ? 'not_found' : 'unexpected';
      metric('rep_password_reset_failed', { reason, hasCode: code !== null });
      return { ok: false, reason };
    }
  }

  async getClerkUsername(clerkUserId: string): Promise<GetClerkUsernameResult> {
    metric('rep_username_lookup_attempted');
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(clerkUserId);
      if (!user || typeof user.username !== 'string' || user.username.length === 0) {
        metric('rep_username_lookup_failed', { reason: 'not_found' });
        return { ok: false, reason: 'not_found' };
      }
      metric('rep_username_lookup_succeeded');
      return { ok: true, username: user.username };
    } catch (err) {
      const code = extractClerkCode(err);
      const reason = code === 'resource_not_found' ? 'not_found' : 'unexpected';
      metric('rep_username_lookup_failed', { reason, hasCode: code !== null });
      return { ok: false, reason };
    }
  }
}

export const clerkRepAdapterFactory: RepPortFactory = () => new ClerkRepAdapter();

/**
 * Sales-rep detection. A rep is a Clerk user with `publicMetadata.role ===
 * 'sales_rep'`. Used by `app/rep/layout.tsx` to guard the rep surface and
 * by the login/catalog page for defense-in-depth routing.
 *
 * Returns `false` for unauthenticated callers; the layout/page handlers
 * are responsible for the auth requirement themselves.
 */
export async function isSalesRep(): Promise<boolean> {
  const user = await currentUser();
  const role = (user?.publicMetadata as { role?: unknown } | undefined)?.role;
  return role === 'sales_rep';
}

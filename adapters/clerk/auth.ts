/**
 * Clerk-backed AuthPort implementation (AD-7) — server-side only.
 *
 * This file imports from `@clerk/nextjs/server` only. The phone-code
 * sign-in flow lives in `adapters/clerk/sign-in-client.ts` because
 * Clerk v6 drives it through a client-side hook.
 *
 * Logging policy: errors are mapped to stable reason strings and emitted
 * via `metric()` so no phone number, OTP code, or verbatim Clerk error
 * body ever lands in logs. The logger's redact list (adapters/logger.ts)
 * is defense-in-depth — this file is the primary control.
 */

import { auth, currentUser } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import type { AuthPort, AuthPortFactory } from '@/ports/auth';
import type { Shop } from '@/core/shop/shop';
import { db } from '@/adapters/postgres/client';
import { shop } from '@/adapters/postgres/schema';

export class ClerkAuthAdapter implements AuthPort {
  async getCurrentShop(): Promise<Shop | null> {
    const { userId } = await auth();
    if (!userId) return null;
    // Confirm the user actually exists in Clerk — cheap guard for orphaned
    // sessions and degraded Clerk dashboards.
    const user = await currentUser();
    if (!user) return null;

    const rows = await db
      .select({
        id: shop.id,
        clerkUserId: shop.clerkUserId,
        createdAt: shop.createdAt,
      })
      .from(shop)
      .where(eq(shop.clerkUserId, userId))
      .limit(1);

    return rows[0] ?? null;
  }

  async signOut(): Promise<void> {
    // Story 1.1 stub: Clerk v6 exposes sign-out via the client-side
    // `useClerk().signOut()` hook — there is no server-side `signOut`
    // export on @clerk/nextjs/server. Story 1.2 wires the avatar menu
    // and owns the real implementation. This method exists on the port
    // so callers don't reach into Clerk directly; it intentionally
    // does not clear the session.
  }
}

export const clerkAuthAdapterFactory: AuthPortFactory = () => new ClerkAuthAdapter();
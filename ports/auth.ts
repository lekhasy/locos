/**
 * AuthPort — AD-7.
 *
 * Story 1.1 v3: Clerk owns identity via the `username` + password strategy.
 * Locos stores only `clerk_user_id`; no passwords, OTPs, email addresses, or
 * phone numbers ever touch the locos DB. This port is the only contract the
 * domain sees for authentication. `core/` never imports from
 * `@clerk/nextjs` — it depends on this interface only.
 *
 * Split between server and client:
 *   - Server-side: `getCurrentShop`, `signOut` — used in route handlers,
 *     server components, server actions. Implemented in
 *     `adapters/clerk/auth.ts`.
 *   - Client-side: `signIn` — the Clerk v6 SDK drives the `username`
 *     strategy through the `useSignIn()` hook; the active SignIn object
 *     lives on the client. See `ports/sign-in.ts` and
 *     `adapters/clerk/sign-in-client.ts`.
 */

import type { Shop } from '@/core/shop/shop';

export interface AuthPort {
  /**
   * Resolves the current Clerk-authenticated user to a locos `shop` row.
   * Returns `null` if there is no signed-in user or no matching row.
   */
  getCurrentShop(): Promise<Shop | null>;

  /**
   * Clears the current Clerk session. Story 1.2 wires the avatar menu;
   * exposed here so callers don't reach into Clerk directly.
   */
  signOut(): Promise<void>;
}

export type AuthPortFactory = () => AuthPort;

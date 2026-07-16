/**
 * AuthPort — AD-7.
 *
 * Clerk owns identity; locos stores only `clerk_user_id`. This port is the
 * only contract the domain sees for authentication. `core/` never imports
 * from `@clerk/nextjs` — it depends on this interface only.
 *
 * Phone numbers, OTP codes, and OTP TTLs flow through Clerk's vendor and are
 * NEVER stored in locos. The port's methods accept a `PhoneInput` shape
 * (country code + national number) and return discriminated results so
 * callers can act on outcomes without touching Clerk's types.
 *
 * Split between server and client:
 *   - `getCurrentShop`, `signOut` are SERVER-side (used in route handlers,
 *     server components, server actions).
 *   - `requestOtp`, `verifyOtp` are CLIENT-side (the Clerk v6 SDK drives
 *     phone-code flows through the `useSignIn()` hook; the active SignIn
 *     object lives on the client). See `ports/sign-in.ts`.
 */

import { z } from 'zod';
import type { Shop } from '@/core/shop/shop';

export const phoneSchema = z.object({
  countryCode: z.literal('+84'),
  nationalNumber: z
    .string()
    .regex(/^[0-9]{9,10}$/, 'nationalNumber must be 9–10 digits'),
});

export type PhoneInput = z.infer<typeof phoneSchema>;

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
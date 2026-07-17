/**
 * Shop aggregate — domain entity for an authenticated shop owner.
 *
 * AD-5 (multi-tenant): the shop is the unit of all locos data. Every
 * downstream query takes `shopId` as a required argument.
 * AD-7 (Clerk-owned auth): locos stores `clerkUserId` only — never the
 * phone number, OTP code, or any other PII.
 *
 * Story 1.3 (Rev C) widened the shape: the sales-rep surface now writes
 * `displayName`, `address`, and `contactPhone` at provisioning time.
 * These fields are all optional at the domain boundary (defaults ''), so
 * older callers reading just `id` + `clerkUserId` are unaffected.
 *
 * `Shop` is the read shape that flows through domain services and the
 * AuthPort. Writes to `shop` rows are confined to Story 1.3's
 * in-app rep surface (and the dev seed for local dev).
 */

export interface Shop {
  id: string;
  clerkUserId: string;
  displayName: string;
  address: string;
  /**
   * `null` means the rep didn't collect a phone at provisioning. Empty
   * string is *not* a sentinel here — an empty string (if any caller
   * ever wrote one) means "explicitly blank", which is a distinct state
   * from "not provided".
   */
  contactPhone: string | null;
  createdAt: Date;
}
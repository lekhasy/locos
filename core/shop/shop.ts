/**
 * Shop aggregate — domain entity for an authenticated shop owner.
 *
 * AD-5 (multi-tenant): the shop is the unit of all locos data. Every
 * downstream query takes `shopId` as a required argument.
 * AD-7 (Clerk-owned auth): locos stores `clerkUserId` only — never the
 * phone number, OTP code, or any other PII.
 *
 * `Shop` is the read shape that flows through domain services and the
 * AuthPort. Writes to `shop` rows are confined to Story 1.3's
 * provisioned-only enforcement (and the dev seed for local dev).
 */

export interface Shop {
  id: string;
  clerkUserId: string;
  createdAt: Date;
}
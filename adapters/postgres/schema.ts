/**
 * Drizzle schema — first migration (Story 1.0 AC #5).
 *
 * Per Implementation-Readiness Minor Concern 3 (sprint-planning decision):
 *   "all-at-once" pattern. This file establishes the minimum table set;
 *   subsequent stories extend it rather than each creating their own.
 *
 * Architecture Consistency Conventions:
 *   - cuid2 everywhere for locos-issued ids.
 *   - Postgres stores UTC `timestamp`. snake_case columns. camelCase TS.
 *   - VND stored as integer (smallest unit). Never float.
 *   - Multi-tenant from day one: every locos-owned table carries `shop_id` (AD-5).
 *
 * First migration (Story 1.0) creates: shop, page_token, product.
 * Schema grows in Stories 3.1, 4.x, 5.x — never removed.
 */

import {
  bigint,
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// -----------------------------------------------------------------------------
// shop — provisioned by the in-app sales-rep surface (Story 1.3 / Rev C).
// In dev: created by db/seed.ts; real creates flow through /rep/shops/new and
// call Clerk `users.createUser` then write the matching row in the same
// handler. clerk_user_id is opaque; phone numbers are NEVER stored here
// (AD-7: Clerk owns identity).
// -----------------------------------------------------------------------------
export const shop = pgTable('shop', {
  id: text('id').primaryKey().notNull(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  displayName: text('display_name').notNull().default(''),
  address: text('address').notNull().default(''),
  // Phone numbers are an "optional at provisioning" field; NULL means
  // the rep didn't collect one. Do not normalize to '' — the distinction
  // matters when we surface partial profiles later.
  contactPhone: text('contact_phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // tombstone-on-row (AD-4)
});

// -----------------------------------------------------------------------------
// page_token — encrypted-at-rest Page access token for AD-8.
// `encrypted_token` is a libsodium secretbox ciphertext; the plaintext never
// escapes the `withDecryptedToken(shopId, pageId, fn)` closure.
// -----------------------------------------------------------------------------
export const pageToken = pgTable('page_token', {
  id: text('id').primaryKey().notNull(),
  shopId: text('shop_id').notNull().references(() => shop.id),
  pageId: text('page_id').notNull(),
  encryptedToken: text('encrypted_token').notNull(),
  scope: text('scope').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
});

// -----------------------------------------------------------------------------
// product — the locos catalog row. Image references are placeholder paths in
// Story 1.0; Story 3.1 fills in `originals/{shopId}/{sha256}.{ext}` per AR-4.
// -----------------------------------------------------------------------------
export const product = pgTable('product', {
  id: text('id').primaryKey().notNull(),
  shopId: text('shop_id').notNull().references(() => shop.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  originalImagePaths: jsonb('original_image_paths').$type<string[]>().notNull(),
  generatedImagePath: text('generated_image_path'),
  priceVnd: bigint('price_vnd', { mode: 'number' }).notNull(), // integer (VND smallest unit)
  soldOut: boolean('sold_out').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }), // tombstone-on-row (AD-4)
});

export type Shop = typeof shop.$inferSelect;
export type PageToken = typeof pageToken.$inferSelect;
export type Product = typeof product.$inferSelect;

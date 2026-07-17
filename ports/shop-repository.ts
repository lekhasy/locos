/**
 * ShopRepositoryPort — boundary for shop row reads/writes.
 *
 * `core/rep/*` reads + writes shop rows through this interface. The Postgres
 * implementation lives at `adapters/postgres/repositories/shop-repository.ts`;
 * tests substitute a fake. Keeping the port minimal keeps `core/rep/` AD-1
 * compliant (no `@clerk` or `drizzle` imports inside `core/`).
 *
 * Tombstone-on-row (AD-4): `list` and `get` filter out rows where
 * `deletedAt` is set; `insert` always writes a fresh, non-tombstoned row.
 */

import type { Shop } from '@/core/shop/shop';

export type ShopInsertInput = {
  clerkUserId: string;
  displayName: string;
  address: string;
  /**
   * Optional. The repo normalizes empty strings to null on insert
   * (callers may submit either; the column is nullable and stores the
   * caller's intent faithfully).
   */
  contactPhone: string | null;
};

export interface ShopRepositoryPort {
  list(): Promise<Shop[]>;
  get(id: string): Promise<Shop | null>;
  insert(input: ShopInsertInput): Promise<Shop>;
}

export type ShopRepositoryPortFactory = () => ShopRepositoryPort;

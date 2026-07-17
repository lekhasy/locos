/**
 * Postgres-backed ShopRepositoryPort implementation.
 *
 * `core/rep/*` reads + writes shop rows through this port; the boundary
 * keeps `core/rep/` AD-1 compliant (no `drizzle` imports inside `core/`).
 *
 * Tombstone-on-row (AD-4): `list` and `get` filter out rows whose
 * `deleted_at` is set. `insert` always writes a fresh, non-tombstoned row.
 */

import { desc, eq, isNull } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import type { Shop } from '@/core/shop/shop';
import type {
  ShopInsertInput,
  ShopRepositoryPort,
  ShopRepositoryPortFactory,
} from '@/ports/shop-repository';
import { db } from '@/adapters/postgres/client';
import { shop } from '@/adapters/postgres/schema';

type ShopRow = {
  id: string;
  clerkUserId: string;
  displayName: string;
  address: string;
  contactPhone: string | null;
  createdAt: Date;
};

function toShop(row: ShopRow): Shop {
  return {
    id: row.id,
    clerkUserId: row.clerkUserId,
    displayName: row.displayName,
    address: row.address,
    contactPhone: row.contactPhone,
    createdAt: row.createdAt,
  };
}

export class PostgresShopRepository implements ShopRepositoryPort {
  async list(): Promise<Shop[]> {
    const rows = await db
      .select({
        id: shop.id,
        clerkUserId: shop.clerkUserId,
        displayName: shop.displayName,
        address: shop.address,
        contactPhone: shop.contactPhone,
        createdAt: shop.createdAt,
      })
      .from(shop)
      .where(isNull(shop.deletedAt))
      .orderBy(desc(shop.createdAt));
    return rows.map(toShop);
  }

  async get(id: string): Promise<Shop | null> {
    const rows = await db
      .select({
        id: shop.id,
        clerkUserId: shop.clerkUserId,
        displayName: shop.displayName,
        address: shop.address,
        contactPhone: shop.contactPhone,
        createdAt: shop.createdAt,
        deletedAt: shop.deletedAt,
      })
      .from(shop)
      .where(eq(shop.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    if (row.deletedAt !== null) return null;
    return toShop(row);
  }

  async insert(input: ShopInsertInput): Promise<Shop> {
    const id = createId();
    // Normalize empty-string contact_phone to null so the DB column's
    // nullable semantics aren't muddied by callers that submit an empty
    // input field. (display_name and address are NOT NULL — empty there
    // is a meaningful state, so we don't transform.)
    const contactPhone =
      typeof input.contactPhone === 'string' && input.contactPhone.trim().length === 0
        ? null
        : input.contactPhone;

    const rows = await db
      .insert(shop)
      .values({
        id,
        clerkUserId: input.clerkUserId,
        displayName: input.displayName,
        address: input.address,
        contactPhone,
      })
      .returning({
        id: shop.id,
        clerkUserId: shop.clerkUserId,
        displayName: shop.displayName,
        address: shop.address,
        contactPhone: shop.contactPhone,
        createdAt: shop.createdAt,
      });
    const row = rows[0];
    if (!row) {
      throw new Error('shop insert returned no rows');
    }
    return toShop(row);
  }
}

export const postgresShopRepositoryFactory: ShopRepositoryPortFactory =
  () => new PostgresShopRepository();

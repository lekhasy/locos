/**
 * listShops — rep reads every active shop in `created_at DESC` order.
 *
 * AD-1: takes the ShopRepositoryPort via parameter; `core/rep/` never
 * imports `drizzle`. The Postgres adapter at
 * `adapters/postgres/repositories/shop-repository.ts` implements the
 * `ORDER BY created_at DESC` and the `deleted_at IS NULL` filter.
 */

import type { Shop } from '@/core/shop/shop';
import type { ShopRepositoryPort } from '@/ports/shop-repository';

export async function listShops(repo: ShopRepositoryPort): Promise<Shop[]> {
  return repo.list();
}

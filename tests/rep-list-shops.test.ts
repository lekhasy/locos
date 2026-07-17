/**
 * listShops — Story 1.3 / Rev C listShops() pass-through.
 *
 * The function is a single-line wrapper around `ShopRepositoryPort.list`.
 * Tests exercise the contract via a fake repository.
 */

import { describe, it, expect } from 'vitest';
import { listShops } from '../core/rep/list-shops';
import type {
  ShopInsertInput,
  ShopRepositoryPort,
} from '../ports/shop-repository';
import type { Shop } from '../core/shop/shop';

const shopA: Shop = {
  id: 'cuidA',
  clerkUserId: 'user_a',
  displayName: 'Shop A',
  address: '',
  contactPhone: null,
  createdAt: new Date('2026-07-01T00:00:00Z'),
};

const shopB: Shop = {
  id: 'cuidB',
  clerkUserId: 'user_b',
  displayName: 'Shop B',
  address: '12 Lê Lợi',
  contactPhone: '0901234567',
  createdAt: new Date('2026-07-15T00:00:00Z'),
};

class FakeShopRepository implements ShopRepositoryPort {
  constructor(private readonly rows: Shop[]) {}
  async list(): Promise<Shop[]> {
    return [...this.rows];
  }
  async get(id: string): Promise<Shop | null> {
    return this.rows.find((s) => s.id === id) ?? null;
  }
  async insert(_input: ShopInsertInput): Promise<Shop> {
    throw new Error('not implemented in fake');
  }
}

describe('listShops (Story 1.3)', () => {
  it('returns the rows from the repository in the order provided', async () => {
    const repo = new FakeShopRepository([shopA, shopB]);
    const result = await listShops(repo);
    expect(result.map((s) => s.id)).toEqual(['cuidA', 'cuidB']);
  });

  it('returns an empty array when the repository has no rows', async () => {
    const repo = new FakeShopRepository([]);
    const result = await listShops(repo);
    expect(result).toEqual([]);
  });

  it('does not mutate the underlying repository rows', async () => {
    const repo = new FakeShopRepository([shopA]);
    const result = await listShops(repo);
    expect(result[0].clerkUserId).toBe('user_a');
  });
});

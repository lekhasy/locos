/**
 * createShop — Story 1.3 / Rev C rep orchestrator.
 *
 * Covers the four cases the spec calls out:
 *   - Full success (Clerk ok + Postgres ok)
 *   - Full failure (Clerk rejects; no Postgres call)
 *   - Partial failure (Clerk ok + Postgres throws)
 *   - Invalid input short-circuit (no port call)
 *
 * Ports are injected as fakes; the test exercises orchestration logic only.
 */

import { describe, it, expect, vi } from 'vitest';
import { createShop } from '../core/rep/create-shop';
import type {
  CreateClerkUserInput,
  CreateClerkUserResult,
  RepPort,
} from '../ports/rep';
import type {
  ShopInsertInput,
  ShopRepositoryPort,
} from '../ports/shop-repository';
import type { Shop } from '../core/shop/shop';

function fakeShopRow(overrides: Partial<Shop> = {}): Shop {
  return {
    id: 'cuidNew',
    clerkUserId: 'user_new',
    displayName: 'Locos Dev Shop',
    address: '',
    contactPhone: null,
    createdAt: new Date('2026-07-16T00:00:00Z'),
    ...overrides,
  };
}

function validInput() {
  return {
    username: 'shopowner1',
    password: 'password123',
    displayName: 'Locos Dev Shop',
    address: '',
    contactPhone: null as string | null,
  };
}

function makeRepPort(impl: (i: CreateClerkUserInput) => Promise<CreateClerkUserResult>): RepPort {
  return {
    createClerkUser: vi.fn(impl),
    setClerkUserPassword: vi.fn(async () => ({ ok: true as const })),
    getClerkUsername: vi.fn(async () => ({ ok: true as const, username: '' })),
  };
}

function makeShopRepo(impl: (i: ShopInsertInput) => Promise<Shop>): ShopRepositoryPort {
  return {
    list: vi.fn(async () => []),
    get: vi.fn(async () => null),
    insert: vi.fn(impl),
  };
}

describe('createShop (Story 1.3)', () => {
  it('full success: writes Clerk user first, then shop row', async () => {
    const repPort = makeRepPort(async () => ({ ok: true, clerkUserId: 'user_new' }));
    const shopRepo = makeShopRepo(async () => fakeShopRow());

    const result = await createShop(validInput(), { repPort, shopRepo });

    expect(result).toEqual({ ok: true, shop: { id: 'cuidNew' } });
    expect(repPort.createClerkUser).toHaveBeenCalledWith({
      username: 'shopowner1',
      password: 'password123',
    });
    expect(shopRepo.insert).toHaveBeenCalledWith({
      clerkUserId: 'user_new',
      displayName: 'Locos Dev Shop',
      address: '',
      contactPhone: null,
    });
    // Critically: insert runs AFTER the Clerk create — the order matters
    // so partial-failure semantics map cleanly to "Clerk happened first".
    const clerkOrder = (repPort.createClerkUser as unknown as { mock: { invocationCallOrder: number[] } }).mock.invocationCallOrder[0];
    const insertOrder = (shopRepo.insert as unknown as { mock: { invocationCallOrder: number[] } }).mock.invocationCallOrder[0];
    expect(clerkOrder).toBeLessThan(insertOrder);
  });

  it('full failure: Clerk rejects username_taken → no Postgres call', async () => {
    const repPort = makeRepPort(async () => ({ ok: false, reason: 'username_taken' }));
    const shopRepo = makeShopRepo(async () => {
      throw new Error('insert must not run on full failure');
    });

    const result = await createShop(validInput(), { repPort, shopRepo });

    expect(result).toEqual({ ok: false, reason: 'username_taken' });
    expect(shopRepo.insert).not.toHaveBeenCalled();
  });

  it('partial failure: Clerk succeeds, Postgres throws → banner signal', async () => {
    const repPort = makeRepPort(async () => ({ ok: true, clerkUserId: 'user_new' }));
    const shopRepo = makeShopRepo(async () => {
      throw new Error('postgres is down');
    });

    const result = await createShop(validInput(), { repPort, shopRepo });

    expect(result).toEqual({
      ok: false,
      reason: 'shop_write_failed',
      partialClerkUserCreated: true,
    });
  });

  it('unexpected Clerk error: clerkWrite never reaches Postgres, partialClerkUserCreated=false', async () => {
    const repPort = makeRepPort(async () => ({
      ok: false,
      reason: 'unexpected' as const,
    }));
    const shopRepo = makeShopRepo(async () => {
      throw new Error('shop insert must not be called when Clerk failed');
    });

    const result = await createShop(validInput(), { repPort, shopRepo });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('shop_write_failed');
      if (result.reason === 'shop_write_failed') {
        expect(result.partialClerkUserCreated).toBe(false);
      }
    }
    expect(shopRepo.insert).not.toHaveBeenCalled();
  });

  it('Clerk invalid_input with field=password → preserved through orchestrator', async () => {
    const repPort = makeRepPort(async () => ({
      ok: false,
      reason: 'invalid_input' as const,
      field: 'password' as const,
    }));
    const shopRepo = makeShopRepo(async () => fakeShopRow());

    const result = await createShop(validInput(), { repPort, shopRepo });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid_input');
      if (result.reason === 'invalid_input') {
        expect(result.field).toBe('password');
      }
    }
    expect(shopRepo.insert).not.toHaveBeenCalled();
  });

  it('Clerk invalid_input without a field disambiguator → defaults to field=username', async () => {
    // form_param_format_invalid (and similar) don't say which form
    // field — the orchestrator picks 'username' as the safe default
    // since it's the first Clerk-owned field on the form.
    const repPort = makeRepPort(async () => ({
      ok: false,
      reason: 'invalid_input' as const,
    }));
    const shopRepo = makeShopRepo(async () => fakeShopRow());

    const result = await createShop(validInput(), { repPort, shopRepo });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid_input');
      if (result.reason === 'invalid_input') {
        expect(result.field).toBe('username');
      }
    }
  });

  it('invalid input: bad username (too short) → no port call', async () => {
    const repPort = makeRepPort(async () => {
      throw new Error('port must not be called on invalid input');
    });
    const shopRepo = makeShopRepo(async () => {
      throw new Error('port must not be called on invalid input');
    });

    const result = await createShop(
      { ...validInput(), username: 'ab' },
      { repPort, shopRepo },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid_input');
      if (result.reason === 'invalid_input') {
        expect(result.field).toBe('username');
      }
    }
    expect(repPort.createClerkUser).not.toHaveBeenCalled();
    expect(shopRepo.insert).not.toHaveBeenCalled();
  });

  it('invalid input: bad username (illegal character) → field=username', async () => {
    const repPort = makeRepPort(async () => ({ ok: true, clerkUserId: 'x' }));
    const shopRepo = makeShopRepo(async () => fakeShopRow());

    const result = await createShop(
      { ...validInput(), username: 'bad@name' },
      { repPort, shopRepo },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid_input');
      if (result.reason === 'invalid_input') {
        expect(result.field).toBe('username');
      }
    }
  });

  it('invalid input: empty displayName → field=displayName', async () => {
    const repPort = makeRepPort(async () => ({ ok: true, clerkUserId: 'x' }));
    const shopRepo = makeShopRepo(async () => fakeShopRow());

    const result = await createShop(
      { ...validInput(), displayName: '' },
      { repPort, shopRepo },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid_input');
      if (result.reason === 'invalid_input') {
        expect(result.field).toBe('displayName');
      }
    }
  });

  it('invalid input: address too long → field=address', async () => {
    const repPort = makeRepPort(async () => ({ ok: true, clerkUserId: 'x' }));
    const shopRepo = makeShopRepo(async () => fakeShopRow());

    const result = await createShop(
      { ...validInput(), address: 'a'.repeat(201) },
      { repPort, shopRepo },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid_input');
      if (result.reason === 'invalid_input') {
        expect(result.field).toBe('address');
      }
    }
  });

  it('invalid input: contact phone too long → field=contactPhone', async () => {
    const repPort = makeRepPort(async () => ({ ok: true, clerkUserId: 'x' }));
    const shopRepo = makeShopRepo(async () => fakeShopRow());

    const result = await createShop(
      { ...validInput(), contactPhone: '1'.repeat(33) },
      { repPort, shopRepo },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid_input');
      if (result.reason === 'invalid_input') {
        expect(result.field).toBe('contactPhone');
      }
    }
  });

  it('contactPhone: null is accepted as "not provided"', async () => {
    const repPort = makeRepPort(async () => ({ ok: true, clerkUserId: 'user_new' }));
    const shopRepo = makeShopRepo(async () => fakeShopRow());

    const result = await createShop(
      { ...validInput(), contactPhone: null },
      { repPort, shopRepo },
    );
    expect(result).toEqual({ ok: true, shop: { id: 'cuidNew' } });
    expect(shopRepo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ contactPhone: null }),
    );
  });

  it('contactPhone: a valid string passes through to insert', async () => {
    const repPort = makeRepPort(async () => ({ ok: true, clerkUserId: 'user_new' }));
    const shopRepo = makeShopRepo(async () => fakeShopRow());

    const result = await createShop(
      { ...validInput(), contactPhone: '0901234567' },
      { repPort, shopRepo },
    );
    expect(result).toEqual({ ok: true, shop: { id: 'cuidNew' } });
    expect(shopRepo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ contactPhone: '0901234567' }),
    );
  });

  it('trims display_name before insert', async () => {
    const repPort = makeRepPort(async () => ({ ok: true, clerkUserId: 'user_new' }));
    const shopRepo = makeShopRepo(async () => fakeShopRow());

    await createShop(
      { ...validInput(), displayName: '  Locos Dev Shop  ' },
      { repPort, shopRepo },
    );
    expect(shopRepo.insert).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: 'Locos Dev Shop' }),
    );
  });
});

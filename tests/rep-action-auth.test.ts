/**
 * rep-action-auth — Patch 2 boundary tests.
 *
 * Server actions are endpoints: a determined caller could POST a valid
 * action payload directly without the `/rep` layout running. Both
 * `createShopAction` and `resetShopPasswordAction` must therefore
 * re-check `publicMetadata.role === 'sales_rep'` at the action
 * boundary and `redirect('/catalog')` on mismatch — mirroring the
 * layout's behavior so a direct POST gets the same UX as a tampered
 * navigation.
 *
 * We test by mocking `next/navigation`'s `redirect` to throw a sentinel
 * (which is exactly what the real `redirect()` does — it throws a
 * `NEXT_REDIRECT` that Next.js catches at the framework boundary) and
 * by stubbing `isSalesRep()` to return `false`.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const redirectMock = vi.fn((url: string) => {
  // Mimic next/navigation.redirect(): throws NEXT_REDIRECT so the
  // framework can intercept and navigate.
  const err = new Error(`NEXT_REDIRECT to ${url}`);
  (err as Error & { digest?: string }).digest =
    `NEXT_REDIRECT;replace;${url};307;`;
  throw err;
});

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('server-only', () => ({}));

vi.mock('@/adapters/clerk/rep', () => ({
  isSalesRep: vi.fn(),
  clerkRepAdapterFactory: vi.fn(),
}));

vi.mock('@/adapters/postgres/repositories/shop-repository', () => ({
  postgresShopRepositoryFactory: vi.fn(),
}));

import { isSalesRep } from '@/adapters/clerk/rep';

describe('rep action auth (Story 1.3 / Patch 2)', () => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  it('createShopAction redirects non-reps without invoking the orchestrator', async () => {
    vi.mocked(isSalesRep).mockResolvedValue(false);
    redirectMock.mockClear();

    const { createShopAction } = await import('@/app/rep/shops/new/actions');

    await expect(
      createShopAction({
        username: 'shopowner1',
        password: 'password123',
        displayName: 'Locos Dev Shop',
        address: '',
        contactPhone: '',
      }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectMock).toHaveBeenCalledWith('/catalog');
  });

  it('resetShopPasswordAction redirects non-reps without invoking the repo', async () => {
    vi.mocked(isSalesRep).mockResolvedValue(false);
    redirectMock.mockClear();

    const { resetShopPasswordAction } = await import(
      '@/app/rep/shops/[shopId]/actions'
    );

    await expect(
      resetShopPasswordAction({ shopId: 'cuidAnything' }),
    ).rejects.toThrow(/NEXT_REDIRECT/);
    expect(redirectMock).toHaveBeenCalledWith('/catalog');
  });

  it('createShopAction rejects malformed payloads via the Zod schema', async () => {
    // Rep authorization passes; we then verify the runtime validation
    // gate rejects a malformed input without crashing.
    vi.mocked(isSalesRep).mockResolvedValue(true);
    redirectMock.mockClear();

    const { createShopAction } = await import('@/app/rep/shops/new/actions');

    // Missing keys / wrong types should NOT throw — they should return a
    // structured invalid_input result so the form can render a banner.
    const result = await createShopAction({
      username: 'shopowner1',
      // password missing
      displayName: 'Locos Dev Shop',
      address: '',
      contactPhone: '',
    } as unknown as Parameters<typeof createShopAction>[0]);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid_input');
    }
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

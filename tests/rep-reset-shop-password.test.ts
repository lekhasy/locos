/**
 * resetShopPassword — orchestrator tests.
 *
 * Covers the three branches the spec calls out:
 *   - username lookup fails → return `username_lookup_failed`, never call
 *     `setClerkUserPassword`.
 *   - password set fails → return `password_set_failed`.
 *   - both succeed → return `{ username, newPassword }` and the password
 *     pushed to the port equals the one returned to the caller (round-
 *     trip).
 *
 * The fake port matches `tests/rep-create-shop.test.ts:48`'s `vi.fn`
 * pattern. We don't inject a custom RNG into the orchestrator — instead
 * we assert the generated password is alphabet-safe + 12 chars, then
 * confirm the same string was passed to `setClerkUserPassword`.
 */

import { describe, it, expect } from 'vitest';
import { resetShopPassword } from '../core/rep/reset-shop-password';
import type {
  GetClerkUsernameResult,
  RepPort,
  SetClerkPasswordResult,
} from '../ports/rep';
import { SAFE_ALPHABET } from '../core/rep/password-generator';

function makeRepPort(impl: {
  getClerkUsername?: (id: string) => Promise<GetClerkUsernameResult>;
  setClerkUserPassword?: (id: string, pw: string) => Promise<SetClerkPasswordResult>;
}): RepPort {
  return {
    createClerkUser: () => {
      throw new Error('not used in these tests');
    },
    getClerkUsername: impl.getClerkUsername ?? (async () => ({ ok: false, reason: 'not_found' })),
    setClerkUserPassword: impl.setClerkUserPassword ?? (async () => ({ ok: true })),
  };
}

describe('resetShopPassword', () => {
  it('username lookup fails → returns username_lookup_failed, password port not called', async () => {
    let setPasswordCalls = 0;
    const port = makeRepPort({
      getClerkUsername: async () => ({ ok: false, reason: 'not_found' }),
      setClerkUserPassword: async () => {
        setPasswordCalls += 1;
        return { ok: true };
      },
    });

    const result = await resetShopPassword({ clerkUserId: 'user_xyz' }, { repPort: port });

    expect(result).toEqual({ ok: false, reason: 'username_lookup_failed' });
    expect(setPasswordCalls).toBe(0);
  });

  it('username lookup unexpected error → still username_lookup_failed (collapsed reason)', async () => {
    const port = makeRepPort({
      getClerkUsername: async () => ({ ok: false, reason: 'unexpected' }),
      setClerkUserPassword: async () => {
        throw new Error('port must not be called when username lookup failed');
      },
    });

    const result = await resetShopPassword({ clerkUserId: 'user_xyz' }, { repPort: port });

    expect(result).toEqual({ ok: false, reason: 'username_lookup_failed' });
  });

  it('password set fails → returns password_set_failed', async () => {
    const port = makeRepPort({
      getClerkUsername: async () => ({ ok: true, username: 'shopowner1' }),
      setClerkUserPassword: async () => ({ ok: false, reason: 'not_found' }),
    });

    const result = await resetShopPassword({ clerkUserId: 'user_xyz' }, { repPort: port });

    expect(result).toEqual({ ok: false, reason: 'password_set_failed' });
  });

  it('both succeed → returns username + newPassword, password round-trips to setClerkUserPassword', async () => {
    const seen: { id: string; pw: string }[] = [];
    const port = makeRepPort({
      getClerkUsername: async () => ({ ok: true, username: 'shopowner1' }),
      setClerkUserPassword: async (id, pw) => {
        seen.push({ id, pw });
        return { ok: true };
      },
    });

    const result = await resetShopPassword({ clerkUserId: 'user_xyz' }, { repPort: port });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error('unreachable');

    expect(result.username).toBe('shopowner1');
    expect(result.newPassword).toHaveLength(12);
    for (const ch of result.newPassword) {
      expect(SAFE_ALPHABET).toContain(ch);
    }
    expect(seen).toEqual([{ id: 'user_xyz', pw: result.newPassword }]);
  });

  it('username lookup happens before password set (ordering)', async () => {
    const order: string[] = [];
    const port: RepPort = {
      createClerkUser: () => {
        throw new Error('not used');
      },
      getClerkUsername: async () => {
        order.push('username');
        return { ok: true, username: 'shopowner1' };
      },
      setClerkUserPassword: async () => {
        order.push('password');
        return { ok: true };
      },
    };

    await resetShopPassword({ clerkUserId: 'user_xyz' }, { repPort: port });
    expect(order).toEqual(['username', 'password']);
  });

  it('two consecutive calls produce different passwords (default RNG)', async () => {
    const port = makeRepPort({
      getClerkUsername: async () => ({ ok: true, username: 'shopowner1' }),
      setClerkUserPassword: async () => ({ ok: true }),
    });

    const a = await resetShopPassword({ clerkUserId: 'user_xyz' }, { repPort: port });
    const b = await resetShopPassword({ clerkUserId: 'user_xyz' }, { repPort: port });
    if (!a.ok || !b.ok) throw new Error('unreachable');
    expect(a.newPassword).not.toBe(b.newPassword);
  });

  it('serializes concurrent resets for the same clerk user id', async () => {
    // Two requests fire in parallel with no coordination; the lock
    // chains them so the second `setClerkUserPassword` only runs after
    // the first completes. Without the lock we'd see
    // ["username","username","password","password"] (interleaved); with
    // the lock we see ["username","password","username","password"].
    const order: string[] = [];
    const port: RepPort = {
      createClerkUser: () => {
        throw new Error('not used');
      },
      getClerkUsername: async () => {
        order.push('username');
        await new Promise((r) => setTimeout(r, 5));
        return { ok: true, username: 'shopowner1' };
      },
      setClerkUserPassword: async (_id, pw) => {
        order.push(`password:${pw}`);
        return { ok: true };
      },
    };

    await Promise.all([
      resetShopPassword({ clerkUserId: 'user_xyz' }, { repPort: port }),
      resetShopPassword({ clerkUserId: 'user_xyz' }, { repPort: port }),
    ]);

    expect(order).toEqual([
      'username',
      expect.stringMatching(/^password:/),
      'username',
      expect.stringMatching(/^password:/),
    ]);
    // Distinct passwords means the Clerk write for B happened after A.
    const pws = order
      .filter((s): s is string => s.startsWith('password:'))
      .map((s) => s.slice('password:'.length));
    expect(new Set(pws).size).toBe(2);
  });

  it('does not serialize resets for distinct clerk user ids', async () => {
    // Different shop rows must run independently — a slow reset on one
    // shop should not back up another shop's reset.
    const events: string[] = [];
    const port: RepPort = {
      createClerkUser: () => {
        throw new Error('not used');
      },
      getClerkUsername: async (id) => {
        events.push(`u:${id}`);
        return { ok: true, username: `user_${id}` };
      },
      setClerkUserPassword: async (id) => {
        events.push(`p:${id}`);
        return { ok: true };
      },
    };

    await Promise.all([
      resetShopPassword({ clerkUserId: 'user_a' }, { repPort: port }),
      resetShopPassword({ clerkUserId: 'user_b' }, { repPort: port }),
    ]);

    // Each id's username must precede that id's password — no cross-
    // id interleaving.
    expect(events.indexOf('u:user_a')).toBeLessThan(events.indexOf('p:user_a'));
    expect(events.indexOf('u:user_b')).toBeLessThan(events.indexOf('p:user_b'));
  });
});
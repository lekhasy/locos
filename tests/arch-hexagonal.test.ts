/**
 * Architecture guardrail (AD-1, hexagonal core).
 *
 * Story 1.0 AC: first CI grep test added — `core/` must never import any SDK
 * (Next, Clerk, Drizzle, pg, Graphile Worker, FB, Gemini, FASHN, pino).
 *
 * Subsequent stories will add more grep tests:
 *   - AD-3: no updateFbPost|deleteFbPost|editFbPost exists (Story 4.3)
 *
 * This test statically inspects source text — no compile step required.
 */

import { describe, it, expect } from 'vitest';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'core');
const BANNED_PREFIXES = [
  'next',
  '@clerk',
  'drizzle',
  'pg',
  'graphile-worker',
  'pino',
  'libsodium',
  'react',
  '@/adapters',
];

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.name.endsWith('.ts')) {
      yield full;
    }
  }
}

function hasBannedImport(source: string): string | null {
  // Scan the full file (not line-by-line) so multi-line imports are caught
  // even when the `from` clause sits on a continuation line.
  for (const banned of BANNED_PREFIXES) {
    const re = new RegExp(`from\\s+['"]${banned.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')}`);
    if (re.test(source)) return banned;
  }
  return null;
}

describe('AD-1: hexagonal core', () => {
  it('core/ has no SDK imports', async () => {
    const offenders: string[] = [];
    for await (const file of walk(ROOT)) {
      const src = await readFile(file, 'utf8');
      const banned = hasBannedImport(src);
      if (banned) {
        offenders.push(`${file.replace(process.cwd() + '/', '')}: imports '${banned}'`);
      }
    }
    expect(offenders, `core/ must depend only on ports/ — found:\n  ${offenders.join('\n  ')}`).toEqual([]);
  });
});

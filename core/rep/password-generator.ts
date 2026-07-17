/**
 * generatePassword — pure helper for fresh shop-owner passwords.
 *
 * Story 1.3 Rev C: the rep resets a shop owner's password via the rep
 * surface. The new password is auto-generated server-side so the rep
 * never types one. We pass it to the rep via the same one-shot
 * CredentialsCard the create flow uses.
 *
 * The default alphabet excludes visually ambiguous characters
 * (`0/O/1/l/I`) — the password is read off a phone screen in SMS form
 * by a low-tech shop owner. 12 chars from a 56-symbol alphabet ≈ 71
 * bits of entropy, comfortably above Clerk's "not in pwned list"
 * threshold.
 *
 * AD-1: pure function, no I/O. `defaultRandom` uses WebCrypto
 * (`globalThis.crypto.getRandomValues`), available in Node 19+ and all
 * evergreen browsers. The orchestrator only ever calls this server-side.
 * RNG is injectable so tests pin deterministic output.
 */

const DEFAULT_LENGTH = 12;
export const SAFE_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';

type RandomSource = (n: number) => Uint8Array;

export type GeneratePasswordOptions = {
  length?: number;
  alphabet?: string;
  random?: RandomSource;
};

export function generatePassword(
  opts: GeneratePasswordOptions = {},
): string {
  const length = opts.length ?? DEFAULT_LENGTH;
  const alphabet = opts.alphabet ?? SAFE_ALPHABET;
  const random = opts.random ?? defaultRandom;

  if (alphabet.length === 0) {
    throw new Error('generatePassword: alphabet must not be empty');
  }
  if (length <= 0) {
    throw new Error('generatePassword: length must be positive');
  }

  const bytes = random(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

function defaultRandom(n: number): Uint8Array {
  const out = new Uint8Array(n);
  globalThis.crypto.getRandomValues(out);
  return out;
}
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
 * Rejection sampling (NOT modulo): `byte % n` is biased when 256 is
 * not a multiple of `n` — the lowest (256 % n) characters of the
 * alphabet get `ceil(256/n)` extra samples per byte. For the 56-char
 * `SAFE_ALPHABET`, 32 of 256 bytes are biased, producing a ~6.7% per-
 * symbol skew. The rep hands these passwords to shop owners verbatim;
 * cryptographic uniformity is the bar. We discard bytes above
 * `cutoff = 256 - (256 % n)` and draw more. Rejection rate is bounded
 * by 50% for any alphabet, so we ask for 2× bytes per round.
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

  const alphabetLength = alphabet.length;
  // Bytes >= cutoff would map onto the lower (256 % n) alphabet slots
  // with extra weight; reject them.
  const cutoff = 256 - (256 % alphabetLength);

  const accepted: number[] = [];
  while (accepted.length < length) {
    // Worst-case rejection rate is < 50%, so 2× the needed count clears
    // the bar in one or two rounds. A minimum of 8 prevents tiny lengths
    // from looping too tightly.
    const chunk = random(Math.max(length * 2, 8));
    for (let i = 0; i < chunk.length && accepted.length < length; i++) {
      const b = chunk[i];
      if (b < cutoff) accepted.push(b);
    }
  }

  let out = '';
  for (const byte of accepted) {
    out += alphabet[byte % alphabetLength];
  }
  return out;
}

function defaultRandom(n: number): Uint8Array {
  const out = new Uint8Array(n);
  globalThis.crypto.getRandomValues(out);
  return out;
}

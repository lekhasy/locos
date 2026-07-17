/**
 * generatePassword — pure-helper tests.
 *
 * Pins length, alphabet, RNG injection, and validation. The default
 * RNG (`globalThis.crypto.getRandomValues`) is non-deterministic, so
 * those tests use probability assertions with retries.
 */

import { describe, it, expect } from 'vitest';
import {
  generatePassword,
  SAFE_ALPHABET,
} from '../core/rep/password-generator';

const SAFE_ALPHABET_RE = /^[A-HJ-NP-Za-hj-np-z2-9]+$/;

describe('generatePassword', () => {
  it('defaults to length 12', () => {
    const pw = generatePassword();
    expect(pw).toHaveLength(12);
  });

  it('uses only safe-alphabet characters (no 0/O/1/l/I)', () => {
    // Run a few draws to be sure; the alphabet is fixed across calls.
    for (let i = 0; i < 10; i++) {
      expect(generatePassword()).toMatch(SAFE_ALPHABET_RE);
    }
  });

  it('exposes the safe alphabet (sanity check on the constant)', () => {
    expect(SAFE_ALPHABET).not.toMatch(/[0O1lI]/);
  });

  it('produces different outputs across consecutive draws (probabilistic, retry up to 5x)', () => {
    let collisions = 0;
    for (let attempt = 0; attempt < 5; attempt++) {
      const a = generatePassword();
      const b = generatePassword();
      if (a !== b) return; // pass
      collisions++;
    }
    throw new Error(
      `generatePassword returned identical strings 5 times in a row (${collisions} collisions) — RNG broken`,
    );
  });

  it('respects a custom length', () => {
    expect(generatePassword({ length: 6 })).toHaveLength(6);
    expect(generatePassword({ length: 24 })).toHaveLength(24);
  });

  it('respects a custom alphabet', () => {
    const pw = generatePassword({
      length: 6,
      alphabet: '0123456789',
      random: () => new Uint8Array([0, 1, 2, 3, 4, 5]),
    });
    expect(pw).toBe('012345');
  });

  it('uses the injectable RNG for deterministic output', () => {
    // bytes [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] all map to alphabet[0]
    const pw = generatePassword({
      length: 12,
      random: () => new Uint8Array(12).fill(0),
      alphabet: 'AB',
    });
    expect(pw).toBe('AAAAAAAAAAAA');
  });

  it('uses module-position in the alphabet (bytes modulo length)', () => {
    // bytes [5, 6, 7] with alphabet of length 3 → indices 5 % 3 = 2, 6 % 3 = 0, 7 % 3 = 1
    const pw = generatePassword({
      length: 3,
      random: () => new Uint8Array([5, 6, 7]),
      alphabet: 'abc',
    });
    expect(pw).toBe('cab');
  });

  it('throws when alphabet is empty', () => {
    expect(() => generatePassword({ alphabet: '' })).toThrow(/alphabet must not be empty/);
  });

  it('throws when length is zero or negative', () => {
    expect(() => generatePassword({ length: 0 })).toThrow(/length must be positive/);
    expect(() => generatePassword({ length: -3 })).toThrow(/length must be positive/);
  });
});
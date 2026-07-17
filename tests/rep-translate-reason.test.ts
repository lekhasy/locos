/**
 * translateReason — Story 1.3 / Rev C.
 *
 * Pin the contract the form relies on: a `CreateShopActionResult` →
 * { partialFailure, fieldErrors }. The two banner-flavored branches
 * (partial vs generic `shop_write_failed`) need to stay distinct so
 * the rep doesn't go hunting for an orphan user that doesn't exist.
 */

import { describe, it, expect } from 'vitest';
import {
  FIELD_ERROR_MESSAGES,
  GENERIC_FAILURE_MESSAGE,
  PARTIAL_FAILURE_MESSAGE,
  translateReason,
} from '../app/rep/shops/new/translate-reason';

describe('translateReason (Story 1.3)', () => {
  it('returns empty state on success', () => {
    expect(translateReason({ ok: true })).toEqual({
      partialFailure: null,
      fieldErrors: {},
    });
  });

  it('username_taken → field error on username', () => {
    const { partialFailure, fieldErrors } = translateReason({
      ok: false,
      reason: 'username_taken',
    });
    expect(partialFailure).toBeNull();
    expect(fieldErrors).toEqual({ username: 'Tên đăng nhập đã tồn tại.' });
  });

  it('invalid_input with field=username → field error on username', () => {
    const { partialFailure, fieldErrors } = translateReason({
      ok: false,
      reason: 'invalid_input',
      field: 'username',
    });
    expect(partialFailure).toBeNull();
    expect(fieldErrors.username).toBe(FIELD_ERROR_MESSAGES.username);
  });

  it('invalid_input with field=password → field error on password', () => {
    const { partialFailure, fieldErrors } = translateReason({
      ok: false,
      reason: 'invalid_input',
      field: 'password',
    });
    expect(partialFailure).toBeNull();
    expect(fieldErrors.password).toBe(FIELD_ERROR_MESSAGES.password);
  });

  it('shop_write_failed with partialClerkUserCreated=true → partial banner', () => {
    // Patch 3 / Patch 6 distinction: the partial banner is the orphan-
    // user signal. The form must show this when Clerk succeeded but the
    // shop write threw.
    const { partialFailure, fieldErrors } = translateReason({
      ok: false,
      reason: 'shop_write_failed',
      partialClerkUserCreated: true,
    });
    expect(partialFailure).toBe(PARTIAL_FAILURE_MESSAGE);
    expect(fieldErrors).toEqual({});
  });

  it('shop_write_failed with partialClerkUserCreated=false → generic banner', () => {
    // Patch 3: previously this branch was silent (no banner). The rep
    // would see the form go idle with no explanation. Now: a generic
    // failure banner so the rep knows Clerk rejected outright and a
    // retry is safe.
    const { partialFailure, fieldErrors } = translateReason({
      ok: false,
      reason: 'shop_write_failed',
      partialClerkUserCreated: false,
    });
    expect(partialFailure).toBe(GENERIC_FAILURE_MESSAGE);
    expect(fieldErrors).toEqual({});
  });

  it('partial and generic banners are distinct copy (no orphan to clean up on generic)', () => {
    expect(PARTIAL_FAILURE_MESSAGE).not.toBe(GENERIC_FAILURE_MESSAGE);
    expect(GENERIC_FAILURE_MESSAGE).not.toContain('dọn tài khoản');
  });
});

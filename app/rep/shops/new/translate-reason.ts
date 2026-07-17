/**
 * translateReason — single source of truth for converting a
 * `CreateShopActionResult` into form-level state (which field has an
 * error, which banner to show).
 *
 * Extracted from `NewShopForm.tsx` so the mapping can be unit-tested
 * without rendering the React form. The contract is intentionally
 * narrow: a `FailureMessage | null` and a per-field error map.
 *
 * Two distinct banners for `shop_write_failed`:
 *   - partialClerkUserCreated: true  → PARTIAL_FAILURE_MESSAGE
 *     (Clerk user was created, our DB write failed; rep retries with a
 *     different username).
 *   - partialClerkUserCreated: false → GENERIC_FAILURE_MESSAGE
 *     (Clerk rejected outright; no orphan user; rep retries without
 *     changing anything).
 */

export type FieldErrorMap = Partial<Record<
  'username' | 'password' | 'displayName' | 'address' | 'contactPhone',
  string
>>;

export type TranslateReasonResult = {
  partialFailure: string | null;
  fieldErrors: FieldErrorMap;
};

export const PARTIAL_FAILURE_MESSAGE =
  'Đã tạo tài khoản ở Clerk nhưng ghi shop thất bại. Vui lòng thử lại với tên đăng nhập khác hoặc liên hệ kỹ thuật để dọn tài khoản.';

export const GENERIC_FAILURE_MESSAGE =
  'Đã xảy ra lỗi khi tạo tài khoản. Vui lòng thử lại sau hoặc liên hệ kỹ thuật nếu lỗi tiếp tục.';

export const FIELD_ERROR_MESSAGES: Record<
  'username' | 'password' | 'displayName' | 'address' | 'contactPhone',
  string
> = {
  username: 'Tên đăng nhập không hợp lệ (3–32 ký tự, chỉ chữ cái, số, gạch dưới, gạch ngang).',
  password: 'Mật khẩu không hợp lệ (8–128 ký tự).',
  displayName: 'Tên cửa hàng phải có từ 1 đến 80 ký tự.',
  address: 'Địa chỉ quá dài (tối đa 200 ký tự).',
  contactPhone: 'Số điện thoại quá dài (tối đa 32 ký tự).',
};

type CreateShopActionFailure =
  | { ok: false; reason: 'username_taken' }
  | {
      ok: false;
      reason: 'invalid_input';
      field: 'username' | 'password' | 'displayName' | 'address' | 'contactPhone';
    }
  | {
      ok: false;
      reason: 'shop_write_failed';
      partialClerkUserCreated: boolean;
    };

export function translateReason(
  result: { ok: true } | CreateShopActionFailure,
): TranslateReasonResult {
  if (result.ok) return { partialFailure: null, fieldErrors: {} };
  if (result.reason === 'shop_write_failed') {
    return {
      partialFailure: result.partialClerkUserCreated
        ? PARTIAL_FAILURE_MESSAGE
        : GENERIC_FAILURE_MESSAGE,
      fieldErrors: {},
    };
  }
  if (result.reason === 'username_taken') {
    return {
      partialFailure: null,
      fieldErrors: { username: 'Tên đăng nhập đã tồn tại.' },
    };
  }
  // invalid_input — the orchestrator guarantees `field` is one of the
  // five canonical field keys.
  return {
    partialFailure: null,
    fieldErrors: { [result.field]: FIELD_ERROR_MESSAGES[result.field] },
  };
}

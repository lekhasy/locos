'use client';

/**
 * NewShopForm — two-step "create shop" form for sales reps.
 *
 * Story 1.3 / Rev C:
 *   Step 1 — Clerk user (Tên đăng nhập, Mật khẩu with Hiện/Ẩn toggle)
 *   Step 2 — Shop details (Tên cửa hàng, Địa chỉ, Số điện thoại liên hệ)
 *
 * Submit → createShopAction → redirect to /rep/shops/{shopId}.
 *
 * No OTP, no email verification; the rep walks through two steps and
 * the server action creates the Clerk user + writes the matching `shop`
 * row in the same handler. AC #6 (partial-failure banner copy) and
 * AC #7 (full-failure field-level error) live here.
 */

import { useState, useTransition } from 'react';
import { createShopAction, type CreateShopActionResult } from './actions';

type Field = 'username' | 'password' | 'displayName' | 'address' | 'contactPhone';

type FieldErrorState = Partial<Record<Field, string>>;

type State = {
  step: 1 | 2;
  username: string;
  password: string;
  showPassword: boolean;
  displayName: string;
  address: string;
  contactPhone: string;
  fieldErrors: FieldErrorState;
  partialFailure: string | null;
};

const STEP_1_HELPERS = {
  username:
    'Từ 3 đến 32 ký tự, chỉ gồm chữ cái, số, dấu gạch dưới hoặc gạch ngang.',
  password: 'Từ 8 đến 128 ký tự.',
};

const PARTIAL_FAILURE_MESSAGE =
  'Đã tạo tài khoản ở Clerk nhưng ghi shop thất bại. Vui lòng thử lại với tên đăng nhập khác hoặc liên hệ kỹ thuật để dọn tài khoản.';

const FIELD_ERROR_MESSAGES: Record<Field, string> = {
  username: 'Tên đăng nhập không hợp lệ (3–32 ký tự, chỉ chữ cái, số, gạch dưới, gạch ngang).',
  password: 'Mật khẩu không hợp lệ (8–128 ký tự).',
  displayName: 'Tên cửa hàng phải có từ 1 đến 80 ký tự.',
  address: 'Địa chỉ quá dài (tối đa 200 ký tự).',
  contactPhone: 'Số điện thoại quá dài (tối đa 32 ký tự).',
};

function translateReason(result: CreateShopActionResult): {
  partialFailure: string | null;
  fieldErrors: FieldErrorState;
} {
  if (result.ok) return { partialFailure: null, fieldErrors: {} };
  if (result.reason === 'shop_write_failed' && result.partialClerkUserCreated) {
    return { partialFailure: PARTIAL_FAILURE_MESSAGE, fieldErrors: {} };
  }
  if (result.reason === 'username_taken') {
    return {
      partialFailure: null,
      fieldErrors: { username: 'Tên đăng nhập đã tồn tại.' },
    };
  }
  if (result.reason === 'invalid_input' && result.field) {
    return {
      partialFailure: null,
      fieldErrors: { [result.field]: FIELD_ERROR_MESSAGES[result.field] },
    };
  }
  return { partialFailure: null, fieldErrors: {} };
}

export function NewShopForm() {
  const [state, setState] = useState<State>({
    step: 1,
    username: '',
    password: '',
    showPassword: false,
    displayName: '',
    address: '',
    contactPhone: '',
    fieldErrors: {},
    partialFailure: null,
  });
  const [pending, startTransition] = useTransition();

  function setField<K extends keyof State>(key: K, value: State[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function clearFieldError(field: Field) {
    setState((prev) => {
      if (!prev.fieldErrors[field]) return prev;
      const { [field]: _omitted, ...rest } = prev.fieldErrors;
      void _omitted;
      return { ...prev, fieldErrors: rest };
    });
  }

  function goNext() {
    const errors: FieldErrorState = {};
    const usernameTrim = state.username.trim();
    if (
      usernameTrim.length < 3 ||
      usernameTrim.length > 32 ||
      !/^[a-zA-Z0-9_-]+$/.test(usernameTrim)
    ) {
      errors.username = FIELD_ERROR_MESSAGES.username;
    }
    if (state.password.length < 8 || state.password.length > 128) {
      errors.password = FIELD_ERROR_MESSAGES.password;
    }
    if (Object.keys(errors).length > 0) {
      setState((prev) => ({ ...prev, fieldErrors: errors }));
      return;
    }
    setState((prev) => ({ ...prev, step: 2, fieldErrors: {} }));
  }

  function submit() {
    const errors: FieldErrorState = {};
    const displayNameTrim = state.displayName.trim();
    if (displayNameTrim.length < 1 || displayNameTrim.length > 80) {
      errors.displayName = FIELD_ERROR_MESSAGES.displayName;
    }
    if (state.address.length > 200) errors.address = FIELD_ERROR_MESSAGES.address;
    if (state.contactPhone.length > 32)
      errors.contactPhone = FIELD_ERROR_MESSAGES.contactPhone;
    if (Object.keys(errors).length > 0) {
      setState((prev) => ({ ...prev, fieldErrors: errors }));
      return;
    }

    startTransition(async () => {
      const result = await createShopAction({
        username: state.username.trim(),
        password: state.password,
        displayName: displayNameTrim,
        address: state.address,
        contactPhone: state.contactPhone,
      });
      const { partialFailure, fieldErrors } = translateReason(result);
      setState((prev) => ({ ...prev, partialFailure, fieldErrors }));
    });
  }

  if (state.step === 1) {
    return (
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (pending) return;
          goNext();
        }}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
      >
        <header>
          <h1>Tạo tài khoản mới — bước 1</h1>
          <p className="helper">
            Nhập tên đăng nhập và mật khẩu sẽ giao cho chủ shop.
          </p>
        </header>

        <div className="form-row">
          <label htmlFor="username" className="form-label">
            Tên đăng nhập
          </label>
          <input
            id="username"
            className="input"
            value={state.username}
            onChange={(e) => {
              setField('username', e.target.value);
              clearFieldError('username');
            }}
            aria-invalid={Boolean(state.fieldErrors.username)}
            readOnly={pending}
            autoComplete="off"
            autoFocus
          />
          <p className="helper">{STEP_1_HELPERS.username}</p>
          {state.fieldErrors.username ? (
            <p className="form-error" role="alert">
              {state.fieldErrors.username}
            </p>
          ) : null}
        </div>

        <div className="form-row">
          <label htmlFor="password" className="form-label">
            Mật khẩu
          </label>
          <input
            id="password"
            className="input"
            value={state.password}
            onChange={(e) => {
              setField('password', e.target.value);
              clearFieldError('password');
            }}
            type={state.showPassword ? 'text' : 'password'}
            aria-invalid={Boolean(state.fieldErrors.password)}
            readOnly={pending}
            autoComplete="new-password"
          />
          <button
            type="button"
            className="button-text"
            onClick={() => setField('showPassword', !state.showPassword)}
            style={{ alignSelf: 'flex-start' }}
            disabled={pending}
            aria-pressed={state.showPassword}
          >
            {state.showPassword ? 'Ẩn' : 'Hiện'}
          </button>
          <p className="helper">{STEP_1_HELPERS.password}</p>
          {state.fieldErrors.password ? (
            <p className="form-error" role="alert">
              {state.fieldErrors.password}
            </p>
          ) : null}
        </div>

        <button type="submit" className="button-primary" disabled={pending}>
          Tiếp tục
        </button>
      </form>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        submit();
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}
    >
      <header>
        <h1>Tạo tài khoản mới — bước 2</h1>
        <p className="helper">
          Nhập thông tin shop để hiển thị trong hệ thống. Hai trường cuối có thể bỏ trống.
        </p>
      </header>

      <div className="form-row">
        <label htmlFor="displayName" className="form-label">
          Tên cửa hàng
        </label>
        <input
          id="displayName"
          className="input"
          value={state.displayName}
          onChange={(e) => {
            setField('displayName', e.target.value);
            clearFieldError('displayName');
          }}
          aria-invalid={Boolean(state.fieldErrors.displayName)}
          readOnly={pending}
          autoFocus
        />
        {state.fieldErrors.displayName ? (
          <p className="form-error" role="alert">
            {state.fieldErrors.displayName}
          </p>
        ) : null}
      </div>

      <div className="form-row">
        <label htmlFor="address" className="form-label">
          Địa chỉ
        </label>
        <input
          id="address"
          className="input"
          value={state.address}
          onChange={(e) => {
            setField('address', e.target.value);
            clearFieldError('address');
          }}
          aria-invalid={Boolean(state.fieldErrors.address)}
          readOnly={pending}
        />
        <p className="helper">Có thể bỏ trống nếu chưa rõ.</p>
        {state.fieldErrors.address ? (
          <p className="form-error" role="alert">
            {state.fieldErrors.address}
          </p>
        ) : null}
      </div>

      <div className="form-row">
        <label htmlFor="contactPhone" className="form-label">
          Số điện thoại liên hệ
        </label>
        <input
          id="contactPhone"
          className="input"
          value={state.contactPhone}
          onChange={(e) => {
            setField('contactPhone', e.target.value);
            clearFieldError('contactPhone');
          }}
          aria-invalid={Boolean(state.fieldErrors.contactPhone)}
          readOnly={pending}
          autoComplete="off"
        />
        <p className="helper">Có thể bỏ trống.</p>
        {state.fieldErrors.contactPhone ? (
          <p className="form-error" role="alert">
            {state.fieldErrors.contactPhone}
          </p>
        ) : null}
      </div>

      {state.partialFailure ? (
        <div className="rep-banner warning" role="alert">
          {state.partialFailure}
        </div>
      ) : null}

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <button
          type="button"
          className="button-text"
          onClick={() =>
            setState((prev) => ({
              ...prev,
              step: 1,
              fieldErrors: {},
              partialFailure: null,
            }))
          }
          disabled={pending}
        >
          Quay lại
        </button>
        <button
          type="submit"
          className="button-primary"
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? 'Đang tạo…' : 'Tạo shop'}
        </button>
      </div>
    </form>
  );
}

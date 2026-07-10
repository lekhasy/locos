---
title: "locos — Experience"
status: final
created: 2026-07-10
updated: 2026-07-10
---

# locos — Experience

> Behavioral spine. `DESIGN.md` is the visual identity reference; this document owns how the app works. Spines win on conflict with any mock.

## Foundation

- **Form-factor.** Responsive web, mobile-first. Owners photograph on phones; desktop is for editing and catalog review. The same column renders at every breakpoint — single column, 480px content max (centered wider on desktop), no nav bar, no side rail.
- **UI system.** None. CSS tokens declared in `DESIGN.md` used directly. No shadcn, MUI, Tailwind, or design-system import in Phase 1.
- **Locale.** Vietnamese UI (NFR1). All AI-generated content is Vietnamese (PRD FR9).
- **Auth model.** Phone-number OTP only (PRD FR2). No self-service signup, no password. Facebook connection is OAuth one-time via Page access token exchange (PRD FR5).
- **Phase scope.** Shop-owner tool only. Search, watermark, discovery link, multi-channel customization — all out (PRD §5).
- **Article of faith.** The product is a tool that disappears. Catalog → New Product → Publish is the spine.

## Information Architecture

| Surface | Entry | Steps | Purpose |
|---|---|---|---|
| `Login — phone` | App open, unauthenticated | — | Owner enters phone number; country prefix `+84` locked |
| `Login — OTP` | After phone submit | — | Six-cell OTP input; resubmit / resend code affordances |
| `Connect Facebook Page` | First login only (or whenever token invalid) | — | OAuth flow → confirm Page → land back at destination |
| `Catalog` | App open, authenticated (default landing) | — | Grid of published products; empty state for new shops |
| `New Product` | Catalog primary action | 1. Capture · 2. Generate · 3. Edit & Publish | The full create flow: photos → description → attributes → generate → edit → publish |
| `Product Detail` | Catalog tile tap | — | View / edit / mark sold out / republish to Facebook |
| `Settings` | Top-right avatar menu | — | Log out, reconnect Facebook, language (out of scope in v1) |

**No bottom tab bar in Phase 1.** Catalog is the only "tab." Settings lives behind the avatar menu. Anywhere outside the catalog is modal or full-screen.

**Top-bar convention.** Avatar menu on every authenticated screen (top-right). Catalog "Đăng sản phẩm mới" primary action pinned bottom on mobile (sticky), top on desktop.

**Modal vs full-screen.** Confirmation (delete, mark sold out, FB republish) uses a bottom sheet on mobile and a centered dialog on desktop. Both: cancel as left action, confirm as right `button-primary`.

**Surface-derived state.** Every surface above knows three things: (a) does this shop have a connected Page? (b) is there an active generation in flight? (c) is the FB token currently valid? Surface-level UI reflects those — not buried in a settings screen.

## Voice and Tone

Brand voice lives in `DESIGN.md.Brand & Style`. This section is the **microcopy discipline** — what we say, what we don't say.

**Phrasing rules.**
- Imperative, noun-first: "Đăng sản phẩm", "Tạo ảnh lại", "Đăng lên Facebook".
- No exclamation marks. No "🎉", no emoji in the interface at all.
- Numbers as Vietnamese formatting: `350.000₫` (period thousands, currency suffix).
- Pronouns: address the owner directly as "bạn" in instructions ("Nhập mô tả…") only when a sentence genuinely needs a subject; otherwise just use the verb. Confirmations and success copy can drop the pronoun entirely.
- Errors: name the cause, name the action, no blame. ("Không đăng được lên Facebook — thử lại?")

**What we say / what we don't.**

| Do | Don't |
|---|---|
| "Đang tạo ảnh…" | "AI đang phép thuật!" |
| "Đã đăng lên Facebook." | "Đăng thành công!" |
| "Chưa kết nối Facebook — kết nối ngay?" | "Kết nối để bắt đầu!" |
| "Không đăng được lên Facebook. Thử lại?" | "Lỗi: đã xảy ra sự cố." |
| "Sản phẩm hết hàng" | "HẾT HÀNG!" |

**Numbers in copy.** Currency: `350.000₫`. Prices in generation preview use the same format. No decimals for typical K-prices; show two decimals when fractional.

## Component Patterns

Behavioral; visual specs live in `DESIGN.md.Components`.

| Component | Use | Behavioral rules |
|---|---|---|
| `phone-input` | `Login — phone` | `+84` prefix locked, 9-10 digit national number, paste-anywhere, auto-submit when valid |
| `otp-cell` | `Login — OTP` | Six single-digit cells, auto-advance, paste-anywhere, auto-submit when full; 60-second resend cooldown with explicit countdown copy |
| `photo-tile` | `New Product` step 1 | Tap empty tile → camera on mobile, file picker on desktop. Tap filled tile → preview. Long-press filled tile (mobile) → drag-reorder. Maximum 6 tiles. Direct camera access on phones (no "Pick from library" first). |
| `description-input` | `New Product` step 1 (below photos) | Single textarea, placeholder example visible ("áo linen, màu be, 350k"). Price-included pattern recognized but not validated inline; surfaced on the generation result. |
| `attribute-row` | `New Product` step 2 | Two inline selects: gender (Nữ / Nam) and style preset (Casual / Chic / Thời thượng / Tối giản — names pending). Local-only, no fetch. |
| `generate-action` | `New Product` step 2 | Primary button. Disabled until at least one photo + description present + attributes selected. |
| `generation-progress` | `New Product` step 3 (same screen as 2) | Each `{generation-tile}` shows a skeleton + descriptor ("Đang tạo ảnh…"). On done, the tile is replaced by the generated image inline. Caption appears as it finishes; price appears last. (Owner can read or skim input during generation.) |
| `generated-image` | `New Product` step 3 | Each image gets its own `image-action-overlay` — "Tạo lại" and "Xoá". Tapping a generated image opens full-screen preview with the same actions. |
| `editable-title` | `New Product` step 3 | Inline `input` styled like `{typography.title}`, autofocus off, max 80 chars, owner can re-edit any time without re-generating. |
| `editable-description` | `New Product` step 3 | Inline `textarea`, same auto-grow behavior, max 500 chars. |
| `editable-price` | `New Product` step 3 | Right-aligned `price-input`. Defaults to whatever the owner typed into `description-input` (FR14); owner can override. Empty price is invalid — publish stays disabled until filled. |
| `publish-action` | `New Product` step 3 (bottom) | "Đăng sản phẩm" — saves to locos catalog. "Đăng lên Facebook" is a separate secondary button, always enabled (but blocked-when-no-FB with prompt to connect). |
| `product-card` | `Catalog`, `Product Detail` | Image-led, status pill, title, price. Sold-out products get a `{colors.sold-out}` overlay tint and pill. Tap → `Product Detail`. |
| `sold-out-toggle` | `Product Detail` | `switch` (modal sheet) "Đánh dấu hết hàng" / "Còn hàng". Confirms on toggle, persists immediately. Sold-out state is visible on `product-card` everywhere it appears. |
| `fb-republish` | `Product Detail` | "Đăng lại lên Facebook" — visible whether previously posted or not. Always creates a new post. |
| `connect-fb-prompt` | Anywhere publish is attempted without a connected Page | Bottom sheet / centered dialog: "Kết nối Facebook để đăng sản phẩm lên trang của bạn?" with primary connect + cancel. Surface: `{colors.accent-soft}` background, `{colors.warning}` text + a quiet `{status-pill warning}` on top-bar until they reconnect. |

**Generation image set semantics.** Each product holds **N generated images** (say, 3 by default; configurable in code; vary during regen). Per the UX decision logged in memlog: regenerate is per-image (regen button re-rolls that single image only); text is never re-rolled — owner edits inline. The owner can delete any generated image; the remaining ones still appear on the FB post.

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Unauthenticated | App open | Redirect to `Login — phone`. No nav. No skeleton of the protected app. |
| No Page connected | `New Product` step 3, `Product Detail` | `connect-fb-prompt` blocks publish-actually-to-FB path; locos-catalog publish still works. |
| Page token invalid | Any publish attempt | `connect-fb-prompt` variant — "Kết nối Facebook đã hết hạn — kết nối lại?" Plus a quiet `{status-pill}` warning on top-bar until they reconnect. |
| Generation in flight | `New Product` step 3 | Each `{generation-tile}` skeleton + descriptor; existing generated images are already-editable; cancel-generation control not offered in v1. |
| Generation partial failure | `New Product` step 3 | Failed tiles show `{generation-tile}` with an error-state overlay + "Tạo lại". Owner can publish with the survivors or cancel and retry the failed ones. |
| Generation total failure | `New Product` step 3 | All tiles errored → owner sees a single full-screen message on the generation panel: "Không tạo được ảnh — thử lại?" with `Tạo lại` primary action. No publish surface shown. |
| Publishing to FB | `Product Detail` | Button morphs into in-progress state (`status-pill` "Đang đăng…"). On success: confirm + show the post link. On failure: button restores + `{status-pill failed}` + explicit retry. |
| Empty catalog | `Catalog` | `empty-state` with the "Đăng sản phẩm đầu tiên" CTA — surface is functional, not motivational. |
| Sold-out | `Catalog` + `Product Detail` | Image gets a sold-out overlay tint + `{status-pill sold-out}`. |

## Interaction Primitives

- **Tap** is primary. **Long-press** is reserved for drag-reorder on the new-product photo strip and system text selection everywhere else.
- **Bottom sheet** on mobile for all confirmations; centered dialog on desktop. Same intent, different presentation.
- **Pull-to-refresh** on `Catalog` only — fetches newest products.
- **Pinch / double-tap zoom** on `generated-image` preview.
- **No carousel auto-advance.** Catalog uses a grid, not a swipe deck.
- **No badge counts.** No streaks. No re-engagement nudges. The product earns repeat use on its own quality (PRD SM2).

## Accessibility Floor

Behavioral; visual contrast lives in `DESIGN.md.Colors`.

- **Reading language.** Vietnamese diacritics render correctly across the system font stack. No custom font in v1.
- **Focus order.** Logical tab order on every screen. Mobile focus order mirrors reading order on `New Product` step 3.
- **Tap targets.** All interactive elements ≥ 44×44px on mobile. `generated-image` overlay action icons count.
- **Color contrast.** Text against surfaces meets WCAG AA: `{colors.ink-primary}` on `{colors.surface}` ≥ 7:1; `{colors.ink-secondary}` ≥ 4.5:1. Status pills use both color *and* a label — color alone never carries meaning.
- **Image alt.** Generated images inherit alt from product title. Owner-uploaded photos fall back to title unless explicitly captioned. Empty alt when neither makes sense.
- **Reduce motion.** Honor OS preference. Generation skeleton shimmer uses opacity, not transform → safe to disable. No staggered entrances.
- **Phone-input semantics.** `+84` prefix is a `<label>`-associated disclosure, not an editable input — assistive tech announces "Vietnam (+84)" and the editable portion.
- **OTP paste.** `otp-cell` accepts a pasted 6-digit string; announces "OTP received" via live region.

## Inspiration & Anti-patterns

**Lifted from**
- **Apple Photos / Google Photos** — the neutral-canvas, image-forward surface. Chrome that disappears so the photos and generated images carry the visual weight.
- **Notion / Linear** — restrained typography, hairline borders, tonal layering over shadows. Calm enough to live in for hours.
- **Shopify mobile admin** — the "do one thing well per screen" flow for shop owners; especially the photo-first product creation.

**Rejected**
- **Streaks / nudges** (Duolingo, etc.) — Phase 1 has nothing to streak; shops post when they have product. No fake engagement mechanics.
- **"Magic AI happens here!" branding** — the brief is explicit that locos doesn't shout. Chrome stays out of the way.
- **Animated illustrations on empty states** — keep empty states useful, not cute. First-time shop owners need a clear next step, not delight.

## Key Flows

### Flow 1 — Chi publishes a new product (mirrors PRD UJ-1)

1. Chi opens locos on her phone → `Catalog` (already authenticated; Page connected from before).
2. Taps "Đăng sản phẩm mới" (bottom sticky on mobile) → `New Product` step 1.
3. Taps the first `photo-tile` → camera opens directly.
4. Photographs one dress, returns to the strip. Long-presses the new tile, drags it. Taps again, photographs a detail shot.
5. Taps the third empty tile, photographs the tag. Adds one more from the library.
6. Types the description "váy linen, màu be, 350k" into `description-input`. Price is captured from the text — surfaced later in editable-price default.
7. Taps "Tiếp tục" → `New Product` step 2.
8. Selects Nữ + Casual on `attribute-row`. Taps "Tạo ảnh".
9. **Generation.** The screen stays where it is. Below her inputs, three `{generation-tile}` skeletons appear with "Đang tạo ảnh 1/3…", "Đang tạo ảnh 2/3…", "Đang tạo ảnh 3/3…".
10. The first image appears. It isn't right. She taps "Tạo lại" on that image only. The other two continue / finish as expected.
11. As images finish, the editable title, description, and price materialize under the strip — Vietnamese title ("Váy linen mùa hè — beige tự nhiên, dáng suông"), marketing copy, price defaulting to `350.000₫`.
12. She tweaks the title to be shorter, confirms the price.
13. Taps "Đăng sản phẩm" → product saves to the locos catalog and she lands on `Product Detail`.
14. Taps "Đăng lên Facebook" → button shows "Đang đăng…" → success: `{status-pill posted}` + a "Mở bài viết" link.

**Climax.** The shopper sees Chi's post on Facebook — self-contained, with all contact info — and Chi is back at her catalog within two taps.

**Failure path:** if generation totally fails on step 9 → generation panel collapses to a single "Tạo lại" message; her inputs (photos, description, attributes) survive. If "Đăng lên Facebook" fails on step 14 → button restores, `{status-pill failed}` appears, "Đăng lại" stays enabled. The locos-catalog publish on step 13 still succeeds in either case.

### Flow 2 — Chi marks a dress sold out

1. From `Catalog`, Chi taps a tile she hasn't sold-out yet.
2. Lands on `Product Detail`. Reviews the current state, taps "Đánh dấu hết hàng".
3. Confirmation bottom sheet: "Đánh dấu sản phẩm này là hết hàng?" with confirm-as-primary.
4. Confirms. The product updates. Returns to `Catalog` with the new sold-out badge visible.

**Climax.** The catalog now shows two parallel truths: the locos listing and the Facebook post both remain (with their original images and copy). The product page carries the sold-out signal for any future republish but does not retroactively edit the FB post (per PRD FR17).

### Flow 3 — Token expired, reconnect

1. Chi taps "Đăng lại lên Facebook" on a product she hasn't touched in weeks.
2. The `connect-fb-prompt` appears: "Kết nối Facebook đã hết hạn — kết nối lại ngay?"
3. Confirms. OAuth opens. She re-authorizes. Returns to the same `Product Detail` surface.
4. Retry uses the same "Đăng lại" control — no separate "retry" action.

**Climax.** Reconnect took two screens, and the product she was working with never lost context.

**Failure path.** Chi dismisses the OAuth (closes the new tab without completing). The `connect-fb-prompt` re-opens on her next publish attempt; the warning `{status-pill}` on top-bar persists. Locos-catalog publish remains unaffected.

## Open Items (carried from PRD)

- **PRD-OQ1 — regen cap:** unanswered in v1. UX now confirms regen is per-image (cheap per regen), which lowers the cost concern; defer as PRD planned.
- **PRD-OQ3 — FB token-expiry handling specifics:** the UX shape is the prompt in Flow 3; specifics owned by architecture (notification channel, who else gets told).
- **PRD-OQ2 — RESOLVED via this document.** Model attributes = Gender + Style preset. Style preset names: `Casual · Chic · Thời thượng · Tối giản` (cap 4; names tentative, must read naturally in Vietnamese).
- **PRD FR-extension (newly discovered).** The PRD does not explicitly authorize deleting a generated image. UX now requires it (owner can delete any generated image they don't like). Recommendation: PRD should add this requirement; flagging here so it propagates.

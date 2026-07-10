---
title: "locos — Design"
status: final
created: 2026-07-10
updated: 2026-07-10
---

# locos — Design

> **Frontmatter note.** This document declares no token frontmatter (`name`, `colors`, `typography`, `rounded`, `spacing`, `components` blocks). That is deliberate: Phase 1 has no UI-system pipeline — tokens are CSS variables consumed directly (see EXPERIENCE.md Foundation). If a future contributor wants to add a token frontmatter for tooling, that's fine; do not graft one onto this document without resolving it against EXPERIENCE.md first.

## Brand & Style

Clean, neutral, tool-first. The aesthetic posture is **functional restraint**: locos should look like a competent shop camera and editor, not a destination. Chrome (the app's own UI) recedes; the shop's product photos and AI-generated model images are the visual hero. No marketing language on the app itself ("Try our AI!", badges, "Powered by…") — the tool does the chore, the work speaks for itself.

The voice is **direct and slightly warm**, in service of independent HCMC shop owners on phones. Confident enough to be trusted, plain enough to be in the way. Vietnamese-language microcopy (EXPERIENCE.md owns the words) sits in a calm Latin-derived typeface that handles Vietnamese diacritics reliably.

What this is **not**: not a fashion-magazine surface, not branded ecommerce, not a generic SaaS dashboard. The product is a tool that disappears the moment the job is done.

## Colors

A near-monochrome neutral palette so that generated product imagery — the entire point of the app — visually dominates. One calm accent reserved for primary actions and active state.

| Token | Hex | Use | Avoid |
|---|---|---|---|
| `{colors.surface}` | `#FFFFFF` | App canvas, all primary content surfaces | Tinted backgrounds behind product photos |
| `{colors.surface-dim}` | `#F7F8FA` | Section dividers, photo upload tiles, generation skeleton | Borders, dividers (use outline) |
| `{colors.surface-container}` | `#EEF0F3` | Pressed/hover surfaces, sold-out overlay | Status colors |
| `{colors.outline}` | `#E5E7EB` | 1px hairline borders, image frames | Filled buttons |
| `{colors.outline-strong}` | `#D1D5DB` | Strong separators, sold-out badge border | Body text |
| `{colors.ink-primary}` | `#0F172A` | Primary text, button text on surface | Decorative |
| `{colors.ink-secondary}` | `#475569` | Captions, helper text | Headlines |
| `{colors.ink-tertiary}` | `#94A3B8` | Disabled text, skeleton hint | Body copy |
| `{colors.accent}` | `#2563EB` | Primary action, focused control, link | Marketing/illustration fills |
| `{colors.accent-soft}` | `#DBEAFE` | Accent surface tint (selected rows, FB-connection callout) | Body text on white |
| `{colors.success}` | `#16A34A` | "Posted to Facebook" confirmation | Decoration |
| `{colors.warning}` | `#D97706` | FB reconnect needed, generation partial fail | Body copy |
| `{colors.error}` | `#DC2626` | Generation failed, publish failed (retry surface) | Decoration |
| `{colors.sold-out}` | `#6B7280` | Sold-out badge and overlay text | Generation skeletons |

Single rule for imagery: all generated product photos and owner-uploaded photos sit on `{colors.surface}` with a 1px `{colors.outline}` frame. No drop shadows behind photos.

## Typography

System font stack with Vietnamese diacritic coverage. No webfonts in Phase 1 — keeps first-paint fast and removes a third-party dependency in a tool whose load is already tens of seconds for AI generation (per NFR4).

| Token | Family / size / line | Use |
|---|---|---|
| `{typography.body}` | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` · 16px · 1.5 | All body copy, button text, form labels |
| `{typography.body-sm}` | Same · 14px · 1.5 | Helper text, captions, OTP cell labels |
| `{typography.title}` | Same · 22px · 1.3 · 600 | Screen titles, product title (editable) |
| `{typography.heading}` | Same · 28px · 1.25 · 600 | Auth screens, empty states |
| `{typography.label}` | Same · 12px · 1.4 · 600 · 0.04em tracking | Section labels, "Sold out", status pills |
| `{typography.numeric}` | `ui-monospace, "SF Mono", Menlo, Consolas, monospace` · 16px · 1.4 | Price input + display (so decimals align) |

Vietnamese diacritics render correctly across the Latin system stack — verified baseline; do not introduce any custom font stack in v1.

## Layout & Spacing

8px spacing grid. Mobile-first single column; desktop widens the same column and uses the freed real estate for the generation-side-by-side preview, not for new chrome.

| Token | Value | Use |
|---|---|---|
| `{spacing.1}` | `4px` | Icon–label gap, tight stack |
| `{spacing.2}` | `8px` | Inline button gap, input label gap |
| `{spacing.3}` | `12px` | Photo-tile padding, form field gap |
| `{spacing.4}` | `16px` | **Mobile horizontal gutter**, card padding, screen section gap |
| `{spacing.5}` | `20px` | Vertical gap above primary action |
| `{spacing.6}` | `24px` | Card-to-card gap in catalog grid |
| `{spacing.8}` | `32px` | Section break within a screen |
| `{spacing.12}` | `48px` | Above-fold break above empty-state illustration |

**Mobile layout.** All screens render as a single column, max content width `480px` (centered on phone but never fighting wider screens). 16px gutters. The catalog grid becomes 2-up at ≥ 360px and 3-up at ≥ 720px viewport width; never more than 3 columns.

**Desktop layout.** Same column, centered. The new-product flow stays single-column even on desktop — generation result appears directly under description input. (Stretch: show a sticky right-rail "preview of FB post" from the desktop generation screen; defer unless explicitly useful.)

**Form factor boundary.** Breakpoints are content-driven not device-driven. ≥ 720px: catalog switches to 3-up grid. ≥ 1024px: nothing else changes in Phase 1; no nav bar, no side panel.

## Elevation & Depth

Low-elevation system. Hairline borders are the default; shadows are reserved for genuinely floating elements (modal, FAB-equivalent primary action when stuck to viewport bottom on mobile).

| Token | Value | Use |
|---|---|---|
| `{elevation.none}` | none | Default for cards, list rows, form fields |
| `{elevation.hairline}` | `inset 0 0 0 1px {colors.outline}` | Card, photo tile, sold-out frame |
| `{elevation.overlay}` | `0 8px 24px rgba(15, 23, 42, 0.08)` | Mobile bottom action bar, modal |

Tonal layering (using `{colors.surface-dim}` for quiet surface-vs-surface distinction) preferred over shadows wherever possible.

## Shapes

| Token | Value | Use |
|---|---|---|
| `{rounded.sm}` | `6px` | Inline pills, status badges |
| `{rounded.md}` | `10px` | Buttons, inputs |
| `{rounded.lg}` | `12px` | Cards, photo tiles, generation tiles |
| `{rounded.full}` | `9999px` | Sold-out badge, "New" badge (omit "New" badge in v1 — not earned) |

One consistent rule: images and their containers share the same radius. A photo tile that is `{rounded.lg}` displays photos clipped to the same `{rounded.lg}`.

## Components

| Component | Visual spec |
|---|---|
| `button-primary` | Solid `{colors.accent}` fill · `{colors.surface}` text · `{typography.body}` · `{rounded.md}` · min height 44px |
| `button-secondary` | `{colors.surface}` fill · 1px `{colors.outline}` border · `{colors.ink-primary}` text · same sizing |
| `button-text` | No border, no fill · `{colors.accent}` text · used for "Regenerate", "Xoá" (delete image), "Đăng lại" |
| `input` | `{colors.surface}` fill · 1px `{colors.outline}` border · `{rounded.md}` · `{typography.body}` · 44px height; focus: 1.5px `{colors.accent}` ring, not border color change |
| `textarea` | Same as `input`, height auto-grow |
| `price-input` | `input` with `{typography.numeric}` and right-aligned decoration |
| `otp-cell` | Six single-character inputs, 48×56px each, `{typography.title}` centered, paste-anywhere support |
| `phone-input` | `+84` prefix pre-filled and locked, editable national number after |
| `photo-tile` | Square `{colors.surface-dim}` tile · dashed 1px `{colors.outline}` border when empty (prompt state) · solid 1px `{colors.outline}` border when filled · 4:5 aspect · direct camera access on mobile · long-press to drag-reorder |
| `product-card` | Image top, `{rounded.lg}` · status pill bottom-left of image · title `{typography.title}` ellipsised 1 line · price `{typography.numeric}` right-aligned |
| `generation-tile` | Skeleton box `{colors.surface-dim}` with shimmer during generation · `{typography.body-sm}` copy below ("Đang tạo ảnh…") |
| `image-action-overlay` | On hover (desktop) / always-visible on mobile: row of two icon buttons (`{button-text}`) — "Tạo lại" (regenerate) and "Xoá" (delete) |
| `status-pill` | `{rounded.full}` · `{colors.surface}` fill · 1px `{colors.outline}` border · `{typography.label}` · variants: `posted` (success text), `sold-out` (`{colors.sold-out}` text), `failed` (error text) |
| `generation-progress` | Inline `{generation-tile}` + descriptor · same screen reveals the result; no separate "generating…" route |
| `empty-state` | Centered illustration placeholder (Phase 1: subtle gray shape, no mascot) · `{typography.heading}` title · one `{button-primary}` |

## Do's and Don'ts

**Do**
- Make product photos the largest visible thing on every screen that has them.
- Use plain Vietnamese in buttons and labels — noun phrases work fine ("Đăng sản phẩm", "Tạo ảnh", "Đăng lên Facebook").
- Show progress on the same screen the result will land on.
- Default the FB post preview to **image-first, caption collapsed** on mobile; expand on tap.
- Show retry affordances explicitly on failed generation / failed publish.
- Treat generation as the product's value, not a cost to ration. There is no generation cap or generation-count indicator in the UI; regen is per-image, cheap to invoke, and never hidden behind a confirmation.
- Treat the FB post as the shop's content. It carries the shop's images, caption, and contact info — never a locos watermark, never a "discover more" link, never any CTA back to locos (deferred to Phase 2 by design).

**Don't**
- Don't put a "Try AI!" badge or a hero illustration of a fashion model anywhere in the app.
- Don't add a bottom tab bar in Phase 1. Catalog and Settings are reachable from the top-right avatar menu.
- Don't animate the chrome (no skeleton shimmer on cards, no parallax) — generated images are the only legitimate visual spectacle.
- Don't add a dark mode toggle in Phase 1.
- Don't introduce webfonts or icon kits. System text + inline SVG icons only.
- Don't use the accent color as a fill on anything decorative — primary action only.
- Don't render the FB post preview in a modal that blocks the next action. It lives on the same screen as the publish button.
- Don't surface metrics the system can't honestly compute. FB publish failures are surfaced (actionable, owner can retry). Generation abandonment and regen churn are *not* surfaced in the UI — they are observed via internal counter-metrics only.

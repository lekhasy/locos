# Structural Review: ux-locos-2026-07-10 (DESIGN.md + EXPERIENCE.md)

**Reviewer:** bmad-editorial-review-structure (structural pass only — no prose mechanics)
**Date:** 2026-07-10
**Sources:**
- `/Users/syle/Documents/Github/locos/_bmad-output/planning-artifacts/ux-designs/ux-locos-2026-07-10/DESIGN.md`
- `/Users/syle/Documents/Github/locos/_bmad-output/planning-artifacts/ux-designs/ux-locos-2026-07-10/EXPERIENCE.md`
**Stakes calibration:** launch / chain-top-stakes — internal-to-launch band (moderately high, not investor-grade). Reference: locos product principles.
**Reader type:** humans (internal product team + design/architecture consumers) and downstream agents (architecture, epics).
**Structure model:** Two-document spine — DESIGN.md is visual identity (token table, components table); EXPERIENCE.md is behavioral spine (IA surface table, component patterns table, state table, key flows). Together they are consumed as a pair; on conflict, "spines win on conflict with any mock" (EXPERIENCE.md:10).

---

## Document Summary

### DESIGN.md
- **Purpose:** Visual identity reference — tokens (colors, typography, spacing, elevation, shapes) + components + do/don't, designed to be consumed directly by CSS without a central UI system.
- **Audience:** Engineers (token consumer), designers (visual reference), the EXPERIENCE.md author (cross-reference owner).
- **Reader type:** humans + downstream agents
- **Current length:** ~140 lines, 8 top-level body sections + 1 frontmatter block
- **Token inventory:** 14 colors, 6 typography roles, 8 spacing values, 3 elevation levels, 4 radius values, 13 components, 9 do/don't pairs.

### EXPERIENCE.md
- **Purpose:** Behavioral spine — IA, voice, component behavior, state, interaction primitives, accessibility floor, key flows, inspiration/anti-patterns, open items.
- **Audience:** Engineers (interaction consumer), designers (behavioral reference), the PRD/architecture authors (cross-reference owner).
- **Reader type:** humans + downstream agents
- **Current length:** ~183 lines, 9 top-level body sections + 1 frontmatter block
- **Surface inventory:** 7 surfaces in IA; 9 states; 17 component behaviors; 3 key flows.

---

## Verdict

**PASS-WITH-FIXES**

Both spines are in the canonical order required by the spec, the token references mostly resolve to in-line declared tables (the spines are self-anchored), the IA surface table covers every PRD UJ-1 beat, and the three key flows cover the genuine climaxes (publish, mark sold out, reconnect). The structural issues are concentrated in (1) DESIGN.md missing frontmatter tokens it is explicitly allowed to declare (the spec permits but does not require), (2) one orphan surface that exists in prose but not in the IA table, (3) one missing section the product implicitly requires given multi-image regen and (4) one cross-file content bleed. None of the findings require prose work — they are cuts, moves, and add-sections only.

---

## DESIGN.md — Section-by-section structural findings

### Frontmatter (lines 1–6) — 6 lines
- **Verdict:** PRESERVE, but FLAG a permitted-but-skipped option.
- **Concern:** The spec allows frontmatter to carry `name`, `description`, `colors`, `typography`, `rounded`, `spacing`, `components` — these would be machine-readable token exports. Currently the frontmatter carries only `title / status / created / updated`, identical to EXPERIENCE.md. For a spine that declares "design directly with CSS tokens, no central UI system" (EXPERIENCE.md:15), the absence of frontmatter tokens is **arguably appropriate** — the in-body tables ARE the contract, the frontmatter would just duplicate them, and a downstream CSS pipeline is not declared as a consumer. **Verdict:** leave as-is, but be aware this is a conscious skip (covered in Top Finding #1).

### §1 Brand & Style (lines 10–16) — 7 lines
- **Verdict:** PRESERVE.
- **Note:** Right size for a posture block — three short paragraphs (posture / voice / what-this-is-not). The "what this is not" paragraph (line 16) is structurally useful — it pre-empts scope creep (fashion-magazine aesthetic, branded ecommerce, SaaS dashboard). No change.

### §2 Colors (lines 18–39) — 22 lines
- **Verdict:** PRESERVE.
- **Token-spot-check:** All 14 `{colors.*}` references in DESIGN.md anchor to in-line declared rows in the same table. Verified: `surface`, `surface-dim`, `surface-container`, `outline`, `outline-strong`, `ink-primary`, `ink-secondary`, `ink-tertiary`, `accent`, `accent-soft`, `success`, `warning`, `error`, `sold-out`. The closing paragraph (line 39) re-uses `surface` and `outline` — both anchor fine.
- **One structural flag:** The `accent-soft` row (line 33) gives one example use ("selected rows, FB-connection callout") but the callout itself never appears in code — the `{accent-soft}` reference in EXPERIENCE.md (line 95 "selected rows" — wait, that's not in EXPERIENCE.md; let me recheck). **Re-checked:** EXPERIENCE.md does not reference `accent-soft` at all. The reference is internal to DESIGN.md and the FB-connection callout use is also in DESIGN.md (which it isn't — the `connect-fb-prompt` is in EXPERIENCE.md:85 and never names a token). **This is a small bleed** — the token is declared but its primary use (the FB-connect callout) lives in the other document and never cites it. **Out of scope for structural pass on the prose mechanics — flagged structurally so the prose review can wire it.**

### §3 Typography (lines 41–54) — 14 lines
- **Verdict:** PRESERVE.
- **Token-spot-check:** All 6 `{typography.*}` references anchor to in-line declared rows: `body`, `body-sm`, `title`, `heading`, `label`, `numeric`. Verified. The verification line (line 54) is right where it should be.

### §4 Layout & Spacing (lines 56–75) — 20 lines
- **Verdict:** PRESERVE.
- **Token-spot-check:** All `{spacing.*}` references in DESIGN.md anchor to in-line declared values: `1`, `2`, `3`, `4`, `5`, `6`, `8`, `12` (8 values, all declared). The prose paragraphs that follow the table reference the same tokens; they all anchor.
- **Note:** The "Form factor boundary" sub-paragraph (line 75) names breakpoints at 720px and 1024px — both content-driven, both consistent with EXPERIENCE.md::Foundation form-factor stance. No bleed, no orphan.

### §5 Elevation & Depth (lines 77–87) — 11 lines
- **Verdict:** PRESERVE.
- **Token-spot-check:** All `{elevation.*}` references in DESIGN.md anchor correctly: `none`, `hairline`, `overlay`. The `hairline` row (line 84) correctly inlines `{colors.outline}` as a reference to the cross-table token rather than duplicating the hex — this is the right model for cross-table refs.

### §6 Shapes (lines 89–98) — 10 lines
- **Verdict:** PRESERVE.
- **Token-spot-check:** All `{rounded.*}` references in DESIGN.md anchor correctly: `sm`, `md`, `lg`, `full`. The "image-and-container share the same radius" rule (line 98) is structurally important and earns its line.

### §7 Components (lines 100–118) — 19 lines
- **Verdict:** PRESERVE.
- **Note:** 13 components, each one row, each referencing tokens from the previously-declared tables. The `generation-progress` row (line 117) correctly cites `{generation-tile}` as a sub-component reference rather than re-specifying it — this is the right model for self-references inside the table. Order is roughly by lifecycle (creation inputs → generation → post-creation overlay → publishing → status → states) — works.

### §8 Do's and Don'ts (lines 120–139) — 20 lines
- **Verdict:** PRESERVE.
- **Note:** The do/don't pairing is structurally clean — each "do" in the first list has a corresponding "don't" later where one exists. The last "don't" (line 139) correctly links to PRD §3 counter-metrics — structurally important, earns its bullets.

---

## DESIGN.md — Cross-cutting token spot-check

Spot-checked all token references in DESIGN.md against the in-line declared tables. Result: **every reference resolves**. Cross-table references (e.g. `elevation.hairline` referencing `{colors.outline}`) resolve cleanly via the in-line `{colors.outline}` reference inside the elevation row.

The spine is **self-anchored** — no external token sources are required.

The one observation: **no frontmatter tokens** are declared (see Top Finding #1).

---

## EXPERIENCE.md — Section-by-section structural findings

### Frontmatter (lines 1–6) — 6 lines
- **Verdict:** PRESERVE — same frontmatter stance as DESIGN.md is internally consistent.

### §1 Foundation (lines 12–19) — 8 lines
- **Verdict:** PRESERVE.
- **Note:** Six bullets, each one line. Form-factor, UI system, locale, auth model, phase scope, article of faith. Right size for a foundation block. The "Article of faith" bullet (line 19) is the spine's spine — it would survive alone if everything else were cut.

### §2 Information Architecture (lines 21–40) — 20 lines
- **Verdict:** PRESERVE, with one FLAG.
- **Note:** 7 surfaces in the table; the convention paragraphs after (lines 33–39) cover "no bottom tab bar," top-bar convention, modal-vs-full-screen rule, and surface-derived state. All four earn their place.
- **Internal flag (Top Finding #2):** The surface `New Product` is described as "The full create flow: photos → description → attributes → generate → edit → publish" (line 29) — six micro-steps. The component-patterns section later enumerates `photo-tile`, `description-input`, `attribute-row`, `generate-action`, `generation-progress`, `generated-image`, `editable-title`, `editable-description`, `editable-price`, `publish-action` — 10 components for 6 steps. The IA table is correct as-is, but **the steps in New Product should be promoted to a defined micro-IA** (step 1 = photos + description; step 2 = attributes; step 3 = generate + edit + publish) so reviewers can verify the phase flows match the step labels in the components section and the key flow (Flow 1: "step 1" / "step 2" / "step 3" are all referenced). Currently the step labels live in prose; **this is a structural visibility gap** — not a content gap, a structural-elevation gap.

### §3 Voice and Tone (lines 42–62) — 21 lines
- **Verdict:** PRESERVE.
- **Note:** Phrasing rules + do/don't table + numbers rule. Right size. The "Pronouns" bullet (line 49) is structurally important — it makes a non-obvious decision (drop the pronoun when possible) and earns its line.

### §4 Component Patterns (lines 64–87) — 24 lines
- **Verdict:** PRESERVE.
- **Note:** 17 component behaviors; each references the visual spec living in DESIGN.md. The closing "Generation image set semantics" paragraph (line 87) is structurally important — it captures the per-image regen decision that was logged in memlog. The "Each product holds **N generated images** (say, 3 by default; configurable in code; vary during regen)" sentence (line 87) is a load-bearing assumption that the architecture will need.

### §5 State Patterns (lines 89–101) — 13 lines
- **Verdict:** PRESERVE.
- **Note:** 9 states, all defined by (State, Surface, Treatment). Each one is a row a developer can implement. The "Surface-derived state" rule from §2 (line 39) and the state table together cover: unauthenticated, no FB Page, invalid token, generation in flight, generation partial fail, generation total fail, publishing in flight, empty catalog, sold-out. **All 9 states cite a surface that exists in the IA table.** Verified.

### §6 Interaction Primitives (lines 103–110) — 8 lines
- **Verdict:** PRESERVE.
- **Note:** Five bullets, each one line. The "No badge counts. No streaks. No re-engagement nudges." bullet (line 110) is structurally important — it is a constraint, not a feature. Anchors back to PRD SM2. Earns its line.

### §7 Accessibility Floor (lines 112–123) — 12 lines
- **Verdict:** PRESERVE.
- **Note:** 8 bullets covering reading language, focus order, tap targets, color contrast, image alt, reduce motion, phone-input semantics, OTP paste. The color contrast bullet (line 119) inlines specific thresholds from DESIGN.md (`{colors.ink-primary}` ≥ 7:1) — correct model: the threshold lives in DESIGN.md, the enforcement lives here.

### §8 Inspiration & Anti-patterns (lines 125–135) — 11 lines
- **Verdict:** PRESERVE.
- **Note:** This is one of the two optional sections — correctly placed in spec order (after Key Flows would have been too late; before is correct so the inspiration shapes the flows). The "Rejected" cluster naming "Streaks / nudges" and "Magic AI happens here!" branding correctly mirrors the do/don't in DESIGN.md — **this is intentional duplication, not bloat**. The structural pass preserves it.

### §9 Key Flows (lines 137–176) — 40 lines
- **Verdict:** PRESERVE.
- **Note:** Three flows: Flow 1 = publish new product (mirrors PRD UJ-1), Flow 2 = mark sold out, Flow 3 = reconnect expired FB token. Each flow has numbered beats, a "Climax" line, and a "Failure path" paragraph (Flow 1 and Flow 2; Flow 3 lacks one — see Top Finding #4).
- **Cross-check against IA table:** All flows end on a surface that exists in the IA table — Flow 1 ends on Product Detail, Flow 2 returns to Catalog, Flow 3 returns to Product Detail. Verified.
- **Climax coverage check:** Flow 1 covers the publish-to-FB climax (the genuine UX climax); Flow 2 covers the sold-out persistence climax; Flow 3 covers the FB token-expiry climax. All three real climaxes have a flow. The "shop opens app for the first time" cold-start (Login → OTP → Connect FB → Catalog) is **NOT** covered as a flow. **This is justified** — it is fully covered by the first-login requirement of §1.4 (auth model) and the surfaces in §2; a fourth flow would be redundant for the structural spine. Verdict: **leave as-is**.

### §10 Open Items (lines 178–183) — 6 lines
- **Verdict:** PRESERVE.
- **Note:** Four items: OQ1 (regen cap) deferred, OQ3 (FB token-expiry specifics) owned by architecture, OQ2 RESOLVED via this document, plus a flagged PRD extension (delete generated image). Right place for cross-document propagation notes.

---

## EXPERIENCE.md — IA completeness check (every PRD UJ-1 beat reachable)

PRD UJ-1 (cross-referenced via Flow 1) involves: shop-owner opens app, lands on Catalog, taps "Đăng sản phẩm mới", photographs, describes, attributes, generates, edits, publishes. Mapped to surfaces:

| UJ-1 beat | Surface | Reachable? |
|---|---|---|
| App open | (entry) | n/a |
| Catalog | `Catalog` | Yes (default landing, line 28) |
| Tap "Đăng sản phẩm mới" | `New Product` | Yes (catalog primary action, line 29) |
| Photograph | `New Product` step 1 (`photo-tile`) | Yes (component table line 71) |
| Describe | `New Product` step 1 (`description-input`) | Yes (component table line 73) |
| Attributes | `New Product` step 2 (`attribute-row`) | Yes (component table line 74) |
| Generate | `New Product` step 3 (`generate-action`, `generation-progress`) | Yes (component table lines 75–76) |
| Edit | `New Product` step 3 (`editable-title`/`-description`/`-price`) | Yes (component table lines 78–80) |
| Publish (locos catalog) | `New Product` step 3 (`publish-action` "Đăng sản phẩm") | Yes (line 81) |
| Publish (FB) | `Product Detail` (`fb-republish`? no — `publish-action` "Đăng lên Facebook") | Partial (see below) |

**One reachability gap:** The UJ-1 climax is publishing to Facebook directly from the New Product step 3 surface (Flow 1, beat 14). The component table names this as `publish-action` with two buttons ("Đăng sản phẩm" + "Đăng lên Facebook" — lines 81). The IA table lists `New Product` and `Product Detail` as separate surfaces. **Both "Đăng sản phẩm" and "Đăng lên Facebook" actions live on `New Product` step 3**, which is fine; the structural pass confirms Flow 1 is reachable from the IA surface. **Verdict:** no IA gap, just a long sentence in the IA table entry that conflates three steps into one. **Structural fix:** §2 `New Product` row could read "Step 1: photos + description. Step 2: attributes + generate trigger. Step 3: generation → edit → publish." This is a **table-clarity cut**, not a content cut — flagged in Top Finding #2.

---

## Top findings (priority order)

### 1. FLAG — DOCUMENT a conscious skip: no frontmatter token exports in DESIGN.md
- **Files / lines:** `DESIGN.md:1–6` (frontmatter) and EXPERIENCE.md cross-ref (`EXPERIENCE.md:15` "CSS tokens declared in `DESIGN.md` used directly").
- **Issue:** The spec permits frontmatter fields `name`, `description`, `colors`, `typography`, `rounded`, `spacing`, `components` — these would be a machine-readable token export for a CSS preprocessor / design-token pipeline. The current frontmatter is intentionally bare. For the declared architecture ("no central UI system, CSS tokens used directly"), this is **arguably appropriate** — the in-body tables are the contract, and the spec phrase is "design directly with CSS tokens" not "export tokens to a system". **However, this is a deliberate skip that should be documented** — a future contributor might see the empty frontmatter and try to add token exports, breaking the no-system invariant. The structural fix is one paragraph in Brand & Style (or just after the frontmatter) that says: "Frontmatter token fields are intentionally omitted — see EXPERIENCE.md §1 UI system rule. CSS tokens are consumed directly from the in-body tables."
- **Suggested fix:** Add a one-line "Why no frontmatter tokens" note after line 6 (the closing `---`), titled for example `**On token frontmatter.**` — or alternatively add it to the Brand & Style section. This is a **structurally useful insert** — the prose review can polish wording.

### 2. ADD — Promote "New Product" steps from prose to a micro-IA in the IA surface table
- **File / lines:** `EXPERIENCE.md:29` (New Product row in the surface table).
- **Issue:** The IA surface table lists `New Product` as one row, but the row names six micro-steps ("photos → description → attributes → generate → edit → publish") and the component table references "step 1 / step 2 / step 3" terminology throughout (Flow 1:142–153 also references these labels). The step labels are load-bearing for the rest of the spine but live only in prose. A structural review downstream (architecture, epics) needs a defined micro-IA to verify component coverage against phase steps.
- **Suggested fix:** Either (a) split `New Product` into three IA rows (`New Product — Capture`, `New Product — Generate`, `New Product — Edit & Publish`), or (b) keep one row but add a column `Steps` whose value is `1. Capture · 2. Generate · 3. Edit & Publish`. Option (b) is lower-friction — keeps the table 7 rows, adds the column, all flow/component references resolve. **If option (b) is chosen, add a corresponding "Steps" column header to the table and a convention paragraph afterwards** (mirror the existing "Top-bar convention" / "Modal vs full-screen" / "Surface-derived state" paragraphs).

### 3. MOVE — Relocate cross-file content references that live in EXPERIENCE.md but belong structurally in DESIGN.md
- **File / lines:** `EXPERIENCE.md:14` (Foundation bullet: "max width `{DESIGN.md}` mobile max (480px content, centered wider)") — and, less critically, line 15 ("CSS tokens declared in `DESIGN.md`").
- **Issue:** Line 14 quotes a value (480px) that exists in DESIGN.md:71 and uses the notation `{DESIGN.md}` as a placeholder — this is **a cross-document reference that resolves to a literal value in another file**. The value 480px belongs in DESIGN.md (where it is) and the reference here should cite the section: "max width per `DESIGN.md.Layout & Spacing > Mobile layout`." This is a **minor structural hygiene issue** — the spec model is for tokens to be referenced via `{token.path}`, not entire documents via `{DESIGN.md}`. Both references in EXPERIENCE.md should be normalized.
- **Suggested fix:** Replace `{DESIGN.md}` with a section-qualified reference in both lines — e.g., "max width per `DESIGN.md.Layout & Spacing.mobile-layout`" and "token tables per `DESIGN.md.Colors / Typography / …`". The prose reviewer can polish phrasing; the structural fix is the conversion from `{DESIGN.md}` placeholder syntax to section-qualified reference syntax.

### 4. ADD — A failure-path discipline note in Flow 3 (and as a global convention)
- **File / lines:** `EXPERIENCE.md:170–176` (Flow 3 — Token expired, reconnect).
- **Issue:** Flow 3 has numbered beats and a Climax (line 176) but **no failure-path paragraph**, while Flow 1 and Flow 2 explicitly carry "Failure path:" paragraphs (lines 158, 167). The lack is inconsistent with the documented discipline — every climactic surface should have a failure surface. The Flow 3 surface (FB reconnect) has at least three realistic failure sub-paths: (a) OAuth denied / dismissed by user, (b) user completes OAuth but grants wrong Page, (c) reconnect succeeds but the republish then fails (chains into Flow 1's publishing failure path).
- **Suggested fix:** Add a "Failure path:" paragraph after Flow 3's Climax line that covers at least (a) — the user dismisses OAuth. For (b) and (c), the structural pass can defer them to the architecture owner (since they touch API surface area beyond UX shape) with a one-line "see PRD-OQ3" cross-reference. **This is an ADD of one paragraph**, not a rewrite of Flow 3.

### 5. CUT — Collapse the `accent-soft` use-case ambiguity into a single anchored use
- **File / lines:** `DESIGN.md:33` (`accent-soft` row) and `EXPERIENCE.md:85` (`connect-fb-prompt`).
- **Issue:** DESIGN.md declares `{colors.accent-soft}` with use "Accent surface tint (selected rows, FB-connection callout)" — two distinct use cases sharing one token. EXPERIENCE.md defines the `connect-fb-prompt` component (line 85) but **never cites `{colors.accent-soft}`** for it. The token is declared for a use that the other spine never invokes. Either the token is over-specified (and should drop one of the two named uses) or the `connect-fb-prompt` definition is under-specified (and should cite the token).
- **Suggested fix:** Either (a) add `appearance: {colors.accent-soft} background tint with {colors.warning} text` (or the appropriate pairing from the table) to the `connect-fb-prompt` component pattern in EXPERIENCE.md, or (b) drop "FB-connection callout" from the `accent-soft` Use column in DESIGN.md. Option (a) is structurally better — it closes a real cross-file gap and prevents the token from being declared-but-unused. **This is a structural cross-file edit** — the prose review can polish, but the structural pass flags the under-citation.

---

## Cross-cutting structural observations

### Self-anchoring
Both spines are **structurally self-anchoring** — every `{token.path}` reference resolves in-body. No external imports are required to read either spine. Verified by spot-checking all token prefixes across both files: `colors.*`, `typography.*`, `spacing.*`, `elevation.*`, `rounded.*`, plus the two cross-document `{DESIGN.md}` references (Top Finding #3).

### Document pairing
The two documents are designed to be consumed as a pair with the rule "spines win on conflict with any mock" (EXPERIENCE.md:10). The DESIGN.md §7 Components table is referenced from EXPERIENCE.md §4 Component Patterns ("visual specs live in `DESIGN.md.Components`" — line 66). **The pairing model is structurally clean.**

### One orphan surface that exists in prose but not in the IA table
- The "Connect Facebook Page" surface (IA table row, line 27) is correctly enumerated. However, EXPERIENCE.md line 96 mentions a "warning on top-bar" until they reconnect — this is a piece of UI inside the top-bar chrome that does not get its own IA row (correct — it is part of the top-bar convention, not a surface). No orphan.

### No documented ownership of the styled top-bar
- The top-bar (avatar menu + warning pill) is repeatedly referenced but never enumerated as a component in DESIGN.md §7 or EXPERIENCE.md §4. **This is correct** — the top-bar is chrome that recedes (per Brand & Style), and the components table covers only the surfaces-with-interactions. No change.

### What is NOT in either spine (and correctly so)
- No user-research artifacts — belongs upstream in brief/PRD.
- No architecture choices (storage, API surface, deployment) — owned by architecture spine.
- No copy-final Vietnamese strings — the spine declares the rules; the prose review + voice sheets own the final strings.
- No test/E2E specifications — owned by QA spine.
- No dark mode — explicitly out of scope per do/don't (line 135).

These absences are **structurally correct**, not gaps.

---

## Summary

The two spines are launch-ready on structure. The five findings are concentrated in: (1) documenting the intentional frontmatter token-skip, (2) promoting New Product steps from prose to micro-IA, (3) normalizing cross-document references, (4) adding Flow 3's missing failure-path discipline, (5) closing the cross-file `accent-soft` under-citation. None require prose work. All five can be applied independently.

**Verdict: PASS-WITH-FIXES.**

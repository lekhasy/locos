---
title: "locos — UX Spines Prose Review"
status: review
created: 2026-07-10
scope: prose-mechanics only (grammar, clarity, voice consistency, terminology)
not-in-scope: structural cuts / reorg (handled by separate reviewer)
---

# Prose Review — `DESIGN.md` and `EXPERIENCE.md`

Baseline tone (from `brief-locos-2026-07-09/brief.md`): direct, honest, slightly opinionated, low-marketing. The spines mostly hold that line; the findings below are the places they slip.

## Verdict: **PASS-WITH-FIXES**

The spines are in good shape. Voice is consistent across both files, the brief's "tool-first, low-marketing" posture is held throughout, and the Vietnamese microcopy (where I can judge intent, not native phrasing) carries the right plain-imperative register. Most issues below are small — a missing comma, an inconsistent token casing, one slip toward marketing language, one self-correction left in the prose. None are blockers.

---

## 1. Grammar / typo / awkward phrasing

| # | Location | Original | Suggested fix | Notes |
|---|---|---|---|---|
| 1.1 | `DESIGN.md:16` | "The product is a tool that disappears the moment the job is done." | No change needed. | (Noted for context — this sentence is fine. Flagged only because the same idea is restated in `EXPERIENCE.md:19` and `EXPERIENCE.md:135`; minor repetition, see §6.) |
| 1.2 | `EXPERIENCE.md:35` | "Catalog "Đăng sản phẩm mới" primary action pinned bottom on mobile (sticky), top on desktop." | Catalog's "Đăng sản phẩm mới" primary action is pinned to the bottom on mobile (sticky) and to the top on desktop. | Missing verb on the second clause; the parenthetical "(sticky)" floats. |
| 1.3 | `EXPERIENCE.md:87` | "Per the UX decision logged in memlog: regenerate is per-image (regen button re-rolls that single image only); text is never re-rolled — owner edits inline." | "Per the UX decision logged in memlog: regenerate is per-image (the regen button re-rolls that single image only); text is never re-rolled — the owner edits inline inline." Wait: "owner edits inline" is fine; the issue is the doubled "that single image only" / "only" construction. | Actually no fix needed on reflection; this sentence reads cleanly. Flagged only because the parenthetical clutters — consider splitting into two sentences. |
| 1.4 | `EXPERIENCE.md:162` | "From `Catalog`, Chi spots a tile whose image has the `{status-pill sold-out}` badge — wait, that's the wrong starting state. She instead taps a tile that hasn't been sold out yet." | From `Catalog`, Chi taps a tile that hasn't been sold out yet. (Delete the self-correction.) | **This is the most visible prose-mechanics issue in the spines.** A meta aside — "wait, that's the wrong starting state" — reads as a working draft that wasn't cleaned up. It also sounds like marketing copy sneering at itself, which contradicts the no-marketing posture. Either delete the aside entirely, or move it to a separate "Failure path: starting from a sold-out tile would feel different because…" note below the flow. As written it reads like an unfinished thought. |
| 1.5 | `EXPERIENCE.md:158` | "The locos-catalog publish on step 13 still succeeds in either case." | The locos-catalog publish on step 13 still succeeds in either case. | (Noted — this sentence is grammatically fine but reads as an editorial caveat at the end of a "Failure path" block. Could be tightened to "The locos-catalog publish on step 13 still succeeds.") |
| 1.6 | `DESIGN.md:54` | "Vietnamese diacritics render correctly across the Latin system stack — verified baseline; do not introduce any custom font stack in v1." | No change needed. | (Noted — sentence is fine but the same constraint is restated three times across both files: `DESIGN.md:54`, `EXPERIENCE.md:116`, `EXPERIENCE.md:Feature-step typography`. See §6 for the repetition concern.) |
| 1.7 | `DESIGN.md:73` | "(Stretch: show a sticky right-rail "preview of FB post" from the desktop generation screen; defer unless explicitly useful.)" | No change needed. | (The "Stretch:" prefix is jargon that briefly dips toward engineering-internal language. Consider "Optional:" or "(Defer unless proven useful.)" — the brief deliberately avoids engineering-speak.) |
| 1.8 | `EXPERIENCE.md:99` | "On failure: button restores + `{status-pill failed}` + explicit retry." | On failure: the button restores, the `{status-pill failed}` appears, and an explicit retry is offered. | Three noun phrases in a row after "On failure:" reads as shorthand. Either accept it as a state-pattern row (tables are shorthand by design) or expand; the rest of this row is in prose so expansion would match its neighbors. |

## 2. Voice consistency — marketing-speak or corporate dryness

The spines hold the brief's "direct, slightly opinionated, low-marketing" tone well. There are two slip-points and one near-miss:

| # | Location | Issue | Suggested fix |
|---|---|---|---|
| 2.1 | `EXPERIENCE.md:110` | "**No badge counts.** No streaks. No re-engagement nudges. The product earns repeat use on its own quality (PRD SM2)." | Strong — keep. The sentence "The product earns repeat use on its own quality" is one of the few places in the spines where an actual claim is *made* rather than a rule *stated*. This is the right register: it's the brief's "honest about unknowns" stance, in product-design language. **No change.** |
| 2.2 | `DESIGN.md:12` | "No marketing language on the app itself ("Try our AI!", badges, "Powered by…") — the tool does the chore, the work speaks for itself." | Strong — keep. Good example of the brief's "no marketing language" stance, internalized rather than just stated. **No change.** |
| 2.3 | `EXPERIENCE.md:134` | "**"Magic AI happens here!" branding** — the brief is explicit that locos doesn't shout. Chrome stays out of the way." | Strong — keep. "locos doesn't shout" is the brief's anti-marketing stance rendered as voice. **No change.** |
| 2.4 | `DESPERIENCE.md` *(no such file)* | — | (Typo guard: there is no `DESPERIENCE.md`. Confirmed in the IA that the prose-mechanics review covers `DESIGN.md` and `EXPERIENCE.md` only.) |
| 2.5 | `DESIGN.md:129` | "Treat the FB post as the shop's content. It carries the shop's images, caption, and contact info — never a locos watermark, never a "discover more" link, never any CTA back to locos (deferred to Phase 2 by design)." | Good, but the parenthetical "(deferred to Phase 2 by design)" reads slightly corporate-defensive — closer to PRD commentary than to design prose. Consider: "It carries the shop's images, caption, and contact info. No locos watermark, no "discover more" link, no CTA back to locos — not yet, not in this version." The "by design" framing is brief-accurate but slightly cold here. |
| 2.6 | `DESIGN.md:139` | "Don't surface metrics the system can't honestly compute. FB publish failures are surfaced (actionable, owner can retry). Generation abandonment and regen churn are *not* surfaced in the UI — they are observed via internal counter-metrics only. (Source: PRD §3 counter-metrics; the brief's "honest about unknowns" stance.)" | The parenthetical "(Source: PRD §3 counter-metrics; the brief's "honest about unknowns" stance.)" is **engineering-internal sourcing** that breaks voice. The brief's stance never cites itself in parens; the design doc shouldn't either. Delete the parenthetical, or move the citation to a footnote. The rule stands on its own. |

**No instances of corporate dryness that need correction.** Both files lean slightly dry/cadenced where they're listing rules, but that's appropriate for a spine. The biggest voice issue is the self-correction in Flow 2 step 1 (1.4 above).

## 3. Tables vs prose — consistency

The spines use tables consistently for the right things:

- **DESIGN.md** uses tables for: color tokens, typography tokens, spacing tokens, elevation tokens, shape tokens, components. All are token declarations or parallel-component specs. Correct.
- **EXPERIENCE.md** uses tables for: information architecture (parallel surfaces), voice do/don't (parallel examples), component patterns (parallel spec rows), state patterns (parallel state rows). Correct.

Prose is used for: brand voice, narrative rules, key flows, accessibility principles, anti-patterns rationale. Correct.

**One inconsistency:**

| # | Location | Issue | Suggested fix |
|---|---|---|---|
| 3.1 | `EXPERIENCE.md:62` | "**Numbers in copy.** Currency: `350.000₫`. Prices in generation preview use the same format. No decimals for typical K-prices; show two decimals when fractional." | This is a prose paragraph that states a token-like rule (`350.000₫`) and would read more cleanly as a two-row token entry. But it's not strictly inconsistent — it's a formatting rule with two sentences of context, which is appropriate for prose. **Borderline; no change needed unless the author prefers tables.** |
| 3.2 | `EXPERIENCE.md:46-50` | "**Phrasing rules.**" block | This is presented as a bullet list, not a table. Five rules, one sentence each — would be slightly tighter as a table with "Rule / Example" columns, but bullets work fine for imperatives. **No change needed; consistent with the brief's anti-ornamentation stance.** |

## 4. `{path.to.token}` references — casing and anchoring

Both files use the `{namespace.name}` convention consistently. Findings:

| # | Location | Issue | Suggested fix |
|---|---|---|---|
| 4.1 | `EXPERIENCE.md:14` | "single column, max width `{DESIGN.md}` mobile max (480px content, centered wider), no nav bar, no side rail." | `{DESIGN.md}` is **not a token** — it's a file reference being passed through the token syntax. This is misleading: a reader will scan for a `{spacing.*}` or `{DESIGN.max-mobile-width}` token and find neither. Either write "the mobile max-width from `DESIGN.md`" in prose, or define a `{layout.mobile-max-width}` token in `DESIGN.md` and reference it here. **Recommend the second option** — it's more rigorous and matches the rest of the file's token discipline. |
| 4.2 | `EXPERIENCE.md:78` | "Inline `input` styled like `{typography.title}`" | Token is defined in `DESIGN.md:49` (`{typography.title}`). **Anchored correctly.** |
| 4.3 | `EXPERIENCE.md:82, 95, 96, 97, 101` | References to `{colors.sold-out}`, `{generation-tile}`, `{status-pill}` | `{colors.sold-out}` defined `DESIGN.md:37`. `{generation-tile}` defined `DESIGN.md:114`. `{status-pill}` defined `DESIGN.md:116`. **All anchored correctly.** |
| 4.4 | `EXPERIENCE.md:119` | "`{colors.ink-primary}` on `{colors.surface}`" etc. | All anchored. **Good.** |
| 4.5 | `EXPERIENCE.md:78, 79, 80` | "`{typography.title}`", "same auto-grow behavior", "`{typography.numeric}`" | Tokens defined. **Anchored correctly.** |
| 4.6 | `DESIGN.md` itself | All token names use kebab-case consistently: `{colors.surface}`, `{colors.outline-strong}`, `{spacing.12}`, `{rounded.full}`, `{elevation.hairline}`, `{typography.body-sm}`. | **No casing drift.** Consistent. |
| 4.7 | `EXPERIENCE.md:122` | "**Phone-input semantics.** `+84` prefix is a `<label>`-associated disclosure, not an editable input — assistive tech announces "Vietnam (+84)" and the editable portion." | Uses HTML tag syntax in a behavioral sentence — clear, anchored. **No issue.** |

**Token casing consistency: PASS.** All `{namespace.name}` references match the declarations in `DESIGN.md`, except for the `{DESIGN.md}` misuse at `EXPERIENCE.md:14`.

## 5. English-language Vietnamese rules — coherence

| File | Section | Rule | Coherent with actual Vietnamese microcopy? |
|---|---|---|---|
| `DESIGN.md:124` | Brand & Style — Do's | "Use plain Vietnamese in buttons and labels — noun phrases work fine ("Đăng sản phẩm", "Tạo ảnh", "Đăng lên Facebook")." | **Coherent.** These exact phrases appear in `EXPERIENCE.md` components. |
| `EXPERIENCE.md:46-50` | Phrasing rules | "Imperative, noun-first: "Đăng sản phẩm", "Tạo ảnh lại", "Đăng lên Facebook"." | **Coherent.** Matches `DESIGN.md:124`. |
| `EXPERIENCE.md:49` | Pronouns | "address the owner directly as "bạn" in instructions ("Nhập mô tả…") only when a sentence genuinely needs a subject; otherwise just use the verb." | **Coherent.** The placeholder example is correctly omitted-imperative, matching the noun-first rule above. |
| `EXPERIENCE.md:50` | Errors | ""Không đăng được lên Facebook — thử lại?"" | **Reads awkwardly in Vietnamese.** "Không đăng được lên Facebook" works (informal negative), but the "— thử lại?" construction is heavy. Native Vietnamese error microcopy typically offers the verb-first retry ("Thử lại?") or appends a softer particle. **Suggest:** "Không đăng được lên Facebook. Thử lại?" (separate sentence) or "Không đăng được lên Facebook — thử lại nhé?" (the "nhé" softens it). The "thử lại?" alone is fine — no need to over-engineer this. |
| `EXPERIENCE.md:54-60` | What we say / what we don't | Vietnamese do/don't pairs. | **Mostly coherent with the brief's stance.** A few notes below. |
| `EXPERIENCE.md:56` | Don't | "AI đang phép thuật!" | Awkward Vietnamese. "Phép thuật" is "magic" but the construction "AI đang phép thuật!" is unnatural — a native speaker would say "AI đang tạo phép thuật!" or simply "AI đang làm việc của nó!" As a *don't* example (i.e., copy that locos should NOT use), the awkwardness is the point — but if the construction itself reads off, the contrast against the do-side ("Đang tạo ảnh…") is weakened. **Suggest a more idiomatic don't**, e.g., "AI đang thần thánh hóa!" or "AI đang tạo ra điều kỳ diệu!" — pick one that's clearly performative. |
| `EXPERIENCE.md:57` | Don't | "✓ Đăng thành công!" | **The leading ✓ contradicts the rule above it ("No emoji in the interface at all")**. The same rule says no exclamation marks; this don't-example has one. So the don't-example itself violates the spine's own rules — which is *intended* (these are examples of bad copy). But it should still be visibly bad copy, not "uses one forbidden thing but not the others." **Suggest** dropping the ✓ to make it pure banned-style: "Đăng thành công!" — the exclamation alone is the lesson. |
| `EXPERIENCE.md:60` | Don't | "SOLD OUT!" | Awkward. "SOLD OUT!" in a Vietnamese-locale interface is jarring — shops don't write their sold-out signs in English. **More natural Vietnamese don't-example:** "HẾT HÀNG!" (Vietnamese all-caps for "sold out!") — same effect, same lesson, more credible. |

**Overall coherence: good, with three microcopy flags above (lines 50, 56, 57, 60) worth a second look from a native speaker.**

## 6. Burying the lead / repetition

| # | Location | Issue |
|---|---|---|
| 6.1 | "Tool that disappears" — repeated 4× | `DESIGN.md:16`, `EXPERIENCE.md:19` ("Article of faith"), `EXPERIENCE.md:135` ("Chrome stays out of the way" — same idea). Not exactly repetition (different angles), but a careful reader will notice. **Consider:** keep the canonical statement in `EXPERIENCE.md.Article of faith`, refer back to it from `DESIGN.md.Brand & Style` ("functional restraint… see EXPERIENCE.md Article of faith"), and drop the third restatement. |
| 6.2 | "No custom font" / "system font stack" — repeated 3× | `DESIGN.md:43`, `DESIGN.md:54`, `EXPERIENCE.md:116`. The first two are in the same file and close together. **Suggest:** delete `DESIGN.md:54` (the "Vietnamese diacritics render correctly…" sentence) — it's implied by the previous sentence and the typography table, and the third instance in `EXPERIENCE.md:116` is in the accessibility section where it carries its weight. |
| 6.3 | "Direct and slightly warm" voice — stated but not shown | `DESIGN.md:14` states the voice but the do/don't microcopy lives in `EXPERIENCE.md:52-60`. The cross-reference ("see `EXPERIENCE.md.Voice and Tone`") would help a reader of either file find the actual examples. **Suggest** adding "(examples in `EXPERIENCE.md.Voice and Tone`)" at the end of `DESIGN.md:14`. |
| 6.4 | Flow 2 self-correction | Already covered at 1.4 above — most visible instance of unedited draft prose. |
| 6.5 | "Generation is the value, not a cost to ration" | This idea appears in `DESIGN.md:128` ("There is no generation cap or generation-count indicator in the UI") and in `EXPERIENCE.md:87` ("regenerate is per-image (cheap per regen)") and in `EXPERIENCE.md:180` ("PRD-OQ1 — regen cap: unanswered in v1. UX now confirms regen is per-image (cheap per regen), which lowers the cost concern; defer as PRD planned."). Three locations, three slightly different framings. **Suggest:** keep one canonical statement in `DESIGN.md.Do's` (the current line is best), and tighten the EXPERIENCE.md and Open-Items mentions to short cross-references. |

**Burying the lead: no serious offenders.** The two-page front matter of each spine (intro + foundation) does the right thing — sets posture, then specifics. The `Don't add a bottom tab bar` rule is repeated in `DESIGN.md:133` and `EXPERIENCE.md:33`; the second instance adds the rationale ("Settings lives behind the avatar menu"), so the duplication is justified.

---

## Cross-file consistency check

| Term | `DESIGN.md` | `EXPERIENCE.md` | Consistent? |
|---|---|---|---|
| "shop owner" / "owner" | "shop owner", "owner" | "owner" (predominantly), "Chi" (in flows) | Yes. **Both files lean "owner" in declarative prose and use a name in flows, which is good.** |
| "post" / "publish" | "publish", "auto-post", "post" (noun) | "publish", "Đăng sản phẩm", "Đăng lên Facebook" | Yes. **"Publish" is the verb in both; "post" used as noun in DESIGN.md "self-contained post" is clear.** |
| "mobile-first" | used once, in `Layout & Spacing` | used in `Form-factor` ("Responsive web, mobile-first") | Yes. |
| "Phase 1" / "v1" | "v1" (mostly), "Phase 1" twice | "v1" / "Phase 1" mixed | **Minor inconsistency.** `DESIGN.md` uses "v1" most often; `EXPERIENCE.md` uses "v1" and "Phase 1" interchangeably. **Suggest** picking one in each file (recommend "v1" for both — it's tighter). |
| "generation" / "gen" / "regen" | "generation", "regen" | "generation", "regen" | Yes. **Both files use "regen" as shorthand for "regenerate", which is consistent and matches the Vietnamese "Tạo lại".** |
| "FB" / "Facebook" | "Facebook" (full) and "FB" (abbreviated) | "Facebook" / "FB" mixed | **Minor inconsistency.** Both files freely switch. Acceptable because FB is well-established shorthand and both files use the full word on first mention (e.g., "publish to Facebook", "FB reconnect needed"). **No change.** |
| "FB post" / "Facebook post" | "FB post" everywhere | "Facebook post" / "FB post" mixed | Mostly "FB post" in DESIGN.md (more compact, design-token context), and "Facebook post" in EXPERIENCE.md (more narrative). This is **fine — it's not inconsistent, it's register-appropriate.** |

---

## Summary table (top issues, prioritized)

| Priority | Finding | File:line | Fix |
|---|---|---|---|
| High | Self-correction left in draft prose ("wait, that's the wrong starting state") | `EXPERIENCE.md:162` | Delete the aside; start Flow 2 from the correct tile. |
| High | `{DESIGN.md}` used as if it were a token | `EXPERIENCE.md:14` | Either write "the mobile max-width from `DESIGN.md`" in prose or define a `{layout.mobile-max-width}` token. |
| Medium | Sourcing parenthetical breaks voice | `DESIGN.md:139` | Delete "(Source: PRD §3 counter-metrics; the brief's "honest about unknowns" stance.)" |
| Medium | Slightly corporate "by design" parenthetical | `DESIGN.md:129` | Soften to "not yet, not in this version" or drop the parenthetical. |
| Medium | Vietnamese error microcopy reads heavy | `EXPERIENCE.md:50` | Consider "Không đăng được lên Facebook. Thử lại?" (two sentences). |
| Low | Don't-example "✓ Đăng thành công!" uses a checkmark the spine elsewhere forbids | `EXPERIENCE.md:57` | Drop the ✓ — the exclamation alone is the lesson. |
| Low | Don't-example "AI đang phép thuật!" reads unidiomatic in Vietnamese | `EXPERIENCE.md:56` | Suggest "AI đang thần thánh hóa!" or similar — pick something a native speaker would actually write as cringe. |
| Low | Don't-example "SOLD OUT!" is jarring in a Vietnamese-locale app | `EXPERIENCE.md:60` | Use "HẾT HÀNG!" — same lesson, native. |
| Low | "Tool that disappears" stated three times across both files | `DESIGN.md:16`, `EXPERIENCE.md:19`, `EXPERIENCE.md:135` | Keep one canonical statement; refer back from the others. |
| Low | "No custom font" repeated three times | `DESIGN.md:43`, `DESIGN.md:54`, `EXPERIENCE.md:116` | Delete `DESIGN.md:54` — implied by the table and the third instance. |
| Low | "Generation is the value, not a cost to ration" stated three times in three framings | `DESIGN.md:128`, `EXPERIENCE.md:87`, `EXPERIENCE.md:180` | Keep the canonical in DESIGN.md; tighten the others to short references. |
| Low | "v1" / "Phase 1" used interchangeably within and across files | both | Pick one per file (recommend "v1" for both). |

---

## What the spines do well

This is a prose-mechanics review, so the negative findings dominate. To be fair: **the spines are unusually well-written for a design doc.** Voice is consistent end-to-end. Token discipline is tight. The do/don't microcopy table is one of the few places in any UX spine I've seen that actually does the job (a working rule, not a vibes statement). The Vietnamese microcopy choices show real awareness of the no-marketing posture — "Đang tạo ảnh…" is exactly the right tone, and the don't-side ("AI đang phép thuật!") is a credible cringe-example even where the literal phrasing is awkward.

The biggest missed opportunity is that the brief's "honest about unknowns" stance — its most distinctive editorial posture — is *embodied* in the spines (no fake metrics, no streaks, no quotas) but not *named*. A reader looking for the defensive line will find it in the don't-list, not as a principle. This is structural, not prose-mechanics, so it belongs to the structural reviewer. Flagging here only because it bears on voice: a reader who arrives at these spines cold will leave with a clear picture of *what locos doesn't do* and a thinner picture of *why locos is shaped that way*. The voice is right; the framing could be louder.

---

## Final verdict

**PASS-WITH-FIXES.** All flagged items are small. One true prose-mechanics issue (the Flow 2 self-correction), one token-discipline slip (`{DESIGN.md}` at `EXPERIENCE.md:14`), three Vietnamese microcopy choices worth a native review, and a handful of repetition trims. None rise to "block finalize."
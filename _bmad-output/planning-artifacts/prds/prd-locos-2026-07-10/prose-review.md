# Prose Review — PRD: locos (Phase 1)

**Reviewer:** bmad-editorial-review-prose (prose-mechanics pass only)
**Date:** 2026-07-10
**Source:** `/Users/syle/Documents/Github/locos/_bmad-output/planning-artifacts/prds/prd-locos-2026-07-10/prd.md`
**Reference baseline:** `brief-locos-2026-07-09/brief.md`

---

## Verdict

**PASS-WITH-FIXES.** The PRD reads cleanly and the voice is consistent with the brief — direct, honest, slightly opinionated, with the right amount of structural asymmetry ("Phase 1 wins the shop side because that is cheap and high-value"). The handful of issues below are minor and localized; none are structural.

---

## 1. Grammar, Typos, Awkward Phrasings

### 1.1 Missing comma — `prd.md:14`
> "The shopper-facing discovery search, the distribution loop (image watermark + 'discover more around you' link), and any buyer-acquisition effort are all deferred to Phase 2."

The closing comma before "are all deferred" is a coordinating conjunction joining three subjects and is required for clarity. Fix: insert `,` before `and any`.

### 1.2 Awkward compound modifier — `prd.md:86`
> "...session so the owner is not forced to re-authenticate on every visit. `[ASSUMPTION: session stays valid for ~30 days of inactivity before re-auth is required; exact TTL to confirm.]`"

The `[ASSUMPTION]` parenthetical hangs awkwardly as a separate sentence after the period. Suggest either dropping the period so it reads as a continuation, or rewording: "before re-auth is required. `[ASSUMPTION: exact TTL to confirm.]`" — keeping the assumption tag tighter to what is actually being assumed.

### 1.3 Minor: pluralization / wording in FR3 — `prd.md:85`
"establishes a persistent session so the owner is not forced to re-authenticate" — fine, but the brief uses "logs in by phone + OTP" phrasing. The PRD inverts to passive ("A successful login establishes…"). Consider matching the active voice of the brief for tonal consistency: "A successful login keeps the owner signed in so they do not have to re-authenticate on every visit."

### 1.4 Sentence fragment in CM2 — `prd.md:38`
> "regenerating is expected and welcome (it's the feature); but a persistently *high* number of regenerations before each publish signals the first output is routinely missing the mark."

The semicolon before "but" is non-standard; the second clause is independent. A comma works ("…welcome (it's the feature), but a persistently high…").

### 1.5 Comma splice in UJ-1 step 6 — `prd.md:58`
> "She taps **Publish** — the product is saved to her locos catalog — then taps **Post to Facebook**, and a self-contained post (with her shop's contact info) goes to her Page."

The em-dashes correctly set off the appositive. Fine as written, but the clause "and a self-contained post…goes to her Page" is a third coordinate glued with "and." Consider splitting for breathing room: "…then taps **Post to Facebook**. A self-contained post (with her shop's contact info) goes to her Page."

---

## 2. Voice Consistency

Voice holds up well. The PRD lands in the brief's register: declarative, honest about unknowns, no marketing varnish.

### 2.1 Marketing-speak slip in UJ-1 step 3 — `prd.md:55`
> "She taps 'New product,' snaps/uploads **a few photos** of the dress, and types a rough description ('linen dress, beige, 350k')."

"snaps/uploads" reads slightly breathless. Consider standardizing to "uploads a few photos (or snaps them on her phone)" or just "uploads a few photos." Minor.

### 2.2 Corporate drift in section 6.2 — `prd.md:89`
> "...exchanges this for a Page access token and stores it for reuse."

"for reuse" is a touch corporate/utilitarian compared to the surrounding voice. Consider: "and stores it so subsequent publishes don't require re-authorization" — or simply drop "for reuse" since FR6 makes that point.

### 2.3 Slight tonal shift in NFR7 — `prd.md:125`
> "AI image/text generation carries real per-use cost absorbed by the parent business; the system should make generation volume observable so cost can be monitored as usage grows. (No usage cap in Phase 1.)"

Reads fine, but "absorbed by the parent business" is the kind of phrasing the brief would phrase more directly. Suggest: "…carries real per-use cost. The parent business absorbs it; the system should make generation volume observable so cost can be watched as usage grows."

---

## 3. Parentheticals, Lists, Punctuation

### 3.1 Inconsistent italic convention for in-document references — `prd.md:24, 137, 138, 139`
- Line 24: `(accounts are provisioned manually for known customers)` — italic via the word "manually" in bold, parenthetical in plain text.
- Line 137: `(See FR11.)` — plain.
- Line 138: `(See FR7.)` — plain.
- Line 139: `…for SM1/SM2` — plain.

These are stylistically fine but vary. The PRD uses parentheses liberally throughout; consider standardizing: references to FRs/NFRs/SMs/OQs always italic, e.g., *"(see FR11)"*. Low-priority.

### 3.2 Em-dash usage — `prd.md:14, 33, 37, 58, 68, 85, 88, 96, 98, 103, 104, 105, 106, 108, 122, 124, 125`
Em-dashes are used heavily and consistently for apposition. No issue, but the cluster around lines 85–108 ("— the product is saved…", "— always available", "— regardless of whether…", "— self-contained:", "— it includes…", "— no locos watermark…", "— the product remains in the locos catalog") produces a rhythm of dashes on every FR. Consider varying with colons or commas where the dash adds no meaning (e.g., FR17, FR19, FR20 work fine as plain prose).

### 3.3 Bullet-list parallel structure — `prd.md:65–70, 73–78, 83–86, 89–91, 94–100, 103–109, 112–115, 119–125`
Lists are parallel and clear throughout. One inconsistency:
- Line 99: "The owner can **regenerate** images; there is no regeneration cap in Phase 1."
- Line 100: "The owner can **edit** the generated title, description, and price before publishing."

Both start "The owner can…" — fine. But the surrounding "— **FR8.** A shop owner can start a new product…" and "— **FR10.** The generated model image must…" shift voice mid-list. This is intentional (subject changes), but FR8, FR12, FR13 all begin with "The/ A shop owner can" — consider aligning FR10 to a similar subject-first opening or accept the topical shift. Low priority.

---

## 4. [ASSUMPTION] Tags and OQ References — Consistency

### 4.1 Citation format — `prd.md:85, 91, 97, 100, 121, 129`
Inline `[ASSUMPTION: …]` tags are consistently bracketed with backticks-style code fencing. Good.

However, the **Assumptions Index** (Section 10) and the **Open Questions** (Section 9) use different cross-reference styles:
- A1 through A6 use the form **A* (FR*):** — clear.
- OQ1–OQ4 use the form **OQ*:** with **"(See FR11.)"** / **"(See FR7.)"** later in some cases.

The brief explicitly uses "A1, A2, …" indexing; the PRD sometimes inlines the assumption without the A-tag (e.g., `[ASSUMPTION: user-provided price takes precedence over an AI-suggested one.]` on line 100). All inline tags have a corresponding entry in Section 10 — verified by reading lines 145–151. So coverage is complete, but the A-tag numbering in Section 10 jumps from A3 (FR11/OQ2) to A4 (FR14), skipping the OQ1 caption. That's correct (OQ1 has no inline assumption), but the cross-link from A3 to OQ2 (line 148) suggests "A3 (FR11 / OQ2)" — good. Consistency holds.

### 4.2 One [ASSUMPTION] is slightly orphaned — `prd.md:139`
> **OQ4.** Do we need a lightweight admin view for the team to see which shops are active (for SM1/SM2), or does that live in internal tooling outside the shop app? `[ASSUMPTION: metrics are needed but may live in internal tooling rather than the shop app.]`

The `[ASSUMPTION]` here is inside an Open Question entry but is registered as **A7 (OQ4)** in Section 10. The convention elsewhere is to put the inline `[ASSUMPTION]` inside the FR/NFR it relates to. Inside an OQ, the tag still works but reads ambiguously — is it "we're assuming X" or "we're asking whether X"? Suggest clarifying the OQ text so the assumption is distinct from the question, or move the assumption out of the OQ line into Section 10 directly. Low priority.

### 4.3 OQ owner attribution — `prd.md:137, 138, 139`
OQ2, OQ3, OQ4 name owners ("Syle/product", "architecture", implied). OQ1 (line 136) names no owner. For consistency, either all OQs should name an owner or none should. Suggest: add an owner to OQ1 ("Owner: Syle/product, defer until cost is observable.") — or remove owners from OQ2/OQ3/OQ4.

---

## 5. Success Metrics vs. Counter-Metrics — Voice Distinction

### 5.1 Success metrics (`prd.md:32–34`)
> "**SM1 — Active shops:** number of shops that publish at least one product in a rolling 7-day window."

Direct, quantitative, declarative. Good.

### 5.2 Counter-metrics (`prd.md:37–39`)
> "**CM1 — Abandonment after generation:** high rates of generate-but-never-publish signal quality or trust problems."

Here the metric (high rates of generate-but-never-publish) is fused with its interpretation ("signal quality or trust problems") in one breath. Compare to SM1, where the metric is stated cleanly and interpretation is implicit. This is mostly fine — counter-metrics naturally have an interpretive payload — but consider splitting for parallelism:

> **CM1 — Abandonment after generation:** rate of generation sessions that do not end in a published product. *Watch for:* signal of quality or trust problems.

Same applies (milder) to CM2 and CM3. Not a blocker; a stylistic tightening.

### 5.3 Section header tone (`prd.md:36`)
> "**Counter-metrics (watch for harm):**"

"(watch for harm)" is a good honest framing. Suggest mirroring with success metrics if any parallel exists, e.g., "**Success metrics (signals of value):**" — adds a one-word interpretive frame without going corporate.

---

## 6. Buried Leads and Repetition

### 6.1 Lead is well-placed in Section 1 (`prd.md:12–16`)
The overview leads with the product, then immediately states "Phase 1 scope is deliberately the shop-owner tool only" in bold. Good — the constraint is in the first third of the section.

### 6.2 Mild restatement in Sections 1 and 3 — `prd.md:16` vs `prd.md:41`
- Line 16: "Phase 1 wins the shop side because that is *cheap and high-value*…"
- Line 41: "Deferred (Phase 2): whether locos drives buyers to shops — not measurable in Phase 1, no metric invented here."

Both make the "no shopper-side metric in Phase 1" point, in slightly different framings. Acceptable — they serve different sections. No fix recommended.

### 6.3 Brief lead re-stated twice in Section 1 — `prd.md:14, 16`
"Phase 1 scope is deliberately the shop-owner tool only" (line 14) and "Phase 1 wins the shop side because that is *cheap and high-value*" (line 16) carry the same payload. This is fine for an Overview — it is doing orientation work — but if you want to tighten, one of them could go. Minor.

### 6.4 "Self-contained" used three times within ~15 lines — `prd.md:22, 58, 106`
Line 22 (principle), line 58 (UJ-1 step 6), line 106 (FR18). All three uses are appropriate, but line 22 says the post is "self-contained (product + shop contact)" — already a restatement of FR18. Consider whether the principle needs the parenthetical since FR18 will restate it.

### 6.5 FR15 + FR16 read as a single thought split across bullets — `prd.md:103–104`
> **FR15.** Publishing a product saves it to the shop's locos catalog.
> **FR16.** Posting to Facebook is a distinct "Post / Republish to Facebook" action…

The reader has to hold two FRs to understand "publish vs post." This is structural, not prose — but a one-line connective sentence between them would help: "Publishing is two distinct actions: save to catalog (FR15), then post to Facebook (FR16)."

---

## Summary of Findings (priority-ordered)

| # | Issue | Location | Severity |
|---|---|---|---|
| 1 | Comma missing in three-item coordinate | `prd.md:14` | Low |
| 2 | [ASSUMPTION] inside OQ4 reads ambiguously | `prd.md:139` | Medium |
| 3 | OQ owner attribution inconsistent (OQ1 omits, others name) | `prd.md:136–139` | Low |
| 4 | Em-dash density in Section 6 produces monotonous rhythm | `prd.md:103–108` | Low |
| 5 | Counter-metrics could be split metric/interpretation for parallelism | `prd.md:37–39` | Low |
| 6 | "snaps/uploads" reads slightly breathless vs. brief tone | `prd.md:55` | Trivial |
| 7 | "absorbed by the parent business" slightly corporate for surrounding voice | `prd.md:125` | Trivial |
| 8 | FR15/FR16 could use a one-line connective | `prd.md:103–104` | Low |
| 9 | "self-contained" repeated 3x in ~15 lines (principle + UJ + FR18) | `prd.md:22, 58, 106` | Trivial |

---

## What This Review Did Not Touch

Per instructions, this is a **prose-mechanics pass only**. No recommendations on:
- Cuts or reordering of sections
- Sizing of scope (in/out lists)
- Whether FRs should be merged or split
- Whether OQs should be resolved before launch
- Any structural reorganization

Those are the structural reviewer's domain.
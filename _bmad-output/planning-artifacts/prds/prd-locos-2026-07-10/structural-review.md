# Structural Review: prd-locos-2026-07-10/prd.md

**Reviewer:** bmad-editorial-review-structure (structural pass only — no prose mechanics)
**Date:** 2026-07-10
**Source:** `/Users/syle/Documents/Github/locos/_bmad-output/planning-artifacts/prds/prd-locos-2026-07-10/prd.md`
**Stakes calibration:** launch / chain-top-stakes — internal-to-launch band (moderately high, not investor-grade). Reference: locos product principles.
**Reader type:** humans (internal product team + stakeholders)
**Structure model:** Strategic/Context (Pyramid) — top-down, MECE, evidence-supports-argument.

---

## Document Summary

- **Purpose:** Define Phase 1 of locos (shop-owner posting tool) — the cheap, standalone-valuable half — so internal product, design, and architecture teams have an unambiguous spec to build from and stakeholders have a single artifact to vet.
- **Audience:** Internal product team, design/architecture owners, parent-business stakeholders; downstream consumers are UX, architecture, and epics workflows.
- **Reader type:** humans
- **Structure model:** Strategic/Context (Pyramid)
- **Current length:** ~2,226 words across 10 top-level sections
- **FR inventory:** 25 FRs (FR1–FR25), globally numbered, no orphans, no collisions.

---

## Verdict

**PASS-WITH-FIXES**

The document is structurally sound for a launch-grade PRD: the spine is in the right order, FR IDs are clean, the UJ is well-placed, and counter-metrics are present. There is one reorder that materially improves the reader's journey (move Open Questions ahead of Assumptions Index, or merge them), one missing concern from the Adapt-In Menu that the principles and scope flag (data governance / privacy posture, given shop + Facebook PII), and a small redundancy between §1 Overview and §2 Product Principles that the structural pass should consolidate rather than preserve. None of the findings require prose work — they are cuts, moves, and add-sections only.

---

## Section-by-section structural findings

### §1 Overview (lines 10–17) — 8 lines
- **Verdict:** PRESERVE with one CONDENSE.
- **Concern:** Lines 14 and 16 both restate "Phase 1 = shop-side only; Phase 2 = discovery." Two near-duplicates of the same scope statement separated by two paragraphs. The structural pass should keep the Phase-1/Phase-2 boundary once (line 14) and let the strategic-logic paragraph (line 16) stand on its own.

### §2 Product Principles (lines 18–26) — 9 lines
- **Verdict:** PRESERVE.
- **Note:** This is the right size for a principles block — four bullets, no bloat. The "Tool-first" and "Acquisition is the existing relationship" bullets do useful work explaining *why* certain features are deferred (self-service signup, discovery, etc.) and earn their place.

### §3 Goals & Success Metrics (lines 27–42) — 16 lines
- **Verdict:** PRESERVE.
- **Note:** Primary goal, three success metrics, three counter-metrics, plus an explicit "deferred" line for Phase-2 metric avoidance. The counter-metric on Facebook post failures (CM3) is structurally important — it ties back to NFR6 and FR20 without naming them, which is correct for a top-level metrics block. No change.

### §4 Users & Context (lines 43–60) — 18 lines
- **Verdict:** PRESERVE.
- **Note:** UJ-1 is the right depth for a launch-band PRD (single named protagonist, 7 numbered beats, ends with a sold-out beat that proves catalog management is in scope). The "Accounts are provisioned manually" line is the only scope-relevant content in this section and is correctly placed here rather than in §5.

### §5 Scope (lines 61–79) — 19 lines
- **Verdict:** PRESERVE.
- **Note:** The In/Out split is the right structural move for a launch PRD — readers and reviewers need both halves to prevent scope creep. Each Out line has a one-line reason where it matters (e.g., "Channels beyond Facebook (Zalo, Instagram, TikTok)"). Sized correctly.

### §6 Functional Requirements (lines 80–116) — 37 lines
- **Verdict:** PRESERVE overall; one internal CONDENSE flagged.
- **FR IDs:** FR1–FR25, all present, no duplicates, no gaps, no orphans. Every FR has at least one corresponding scope line or UJ beat — verified by cross-reference.
- **Internal redundancy:**
  - **FR17 + FR18 + FR23** all restate the "locos catalog vs. Facebook post are separate; edits don't propagate; republish to update" rule. FR17 establishes the rule, FR18 enforces the self-contained-post consequence, FR23 re-states the rule for the edit case. This is *not* true redundancy — each one operationalizes the rule for a different decision point — but the prose reviewer may want to make this tighter. **Out of scope for structural pass.**
  - **FR16 + FR21** both restate "Facebook-only publish." Acceptable — FR16 is the *capability* (republish always available), FR21 is the *scope constraint* (no other channels). Both are load-bearing.
- **Subsection grouping:** 6.1 Authentication, 6.2 Facebook Connection, 6.3 Product Creation & AI Generation, 6.4 Publishing, 6.5 Catalog Management. Five feature clusters, each with a coherent narrative. Order is correct: auth → external connection → content creation → publishing → management. No change.

### §7 Non-Functional Requirements (lines 117–126) — 10 lines
- **Verdict:** PRESERVE.
- **Note:** Seven NFRs is right-sized for a launch-band PRD. Localization, responsiveness, scale, latency, security, publish reliability, cost awareness. Each one is single-line with an embedded design target where applicable. The NFR3 "~5,000 shops / ~5,000 publishes/day" line carries an inline `[ASSUMPTION]` flag, which is correct — it is a design band, not a committed SLA.

### §8 Dependencies & Assumptions (lines 127–133) — 7 lines
- **Verdict:** PRESERVE.
- **Note:** Four dependencies, each one-line. Facebook Graph API + app review, SMS/OTP, AI generation, manual account provisioning. The "this is an external gate" framing on the Facebook line is structurally important — it surfaces the timeline risk before the reader gets to OQ3 in the next section.

### §9 Open Questions (lines 134–140) — 7 lines
- **Verdict:** PRESERVE, with one structural flag (see Top Finding #2 below).
- **Note:** Four OQs, each numbered, each with owner. OQ2 is correctly tagged as a "Pre-UX blocker" inline. OQ4 carries an `[ASSUMPTION]` tag that bridges into A7 in the Assumptions Index. Right size.

### §10 Assumptions Index (lines 141–151) — 11 lines
- **Verdict:** PRESERVE.
- **Note:** Consolidated view of inline `[ASSUMPTION]` tags (A1–A7). Each entry cross-references the source FR/NFR/Dependency. This is the right structure for a launch-band PRD — readers can audit every inferred decision in one place. Sizing is correct.

---

## Top findings (priority order)

### 1. MOVE — Move §9 Open Questions and §10 Assumptions Index closer to the front (or merge them) — affects structure, not prose
- **File / lines:** `prd.md:134–151`
- **Issue:** For a launch-band PRD, Open Questions and Assumptions belong *before* the FR/NFR sections they tag. Currently the reader hits FR3, FR7, FR11, FR14 with inline `[ASSUMPTION]` markers and has to flip to the back of the document (lines 145–151) to see the consolidated list. Same for FR11 → OQ2 → A3 (lines 97 → 137 → 147). The current placement treats OQs/Assumptions as appendix material; in a launch PRD they are *load-bearing* for downstream UX/architecture/epics and should be visible before requirements settle.
- **Suggested fix:** Either (a) move §8 Dependencies, §9 Open Questions, §10 Assumptions to the position immediately after §5 Scope (so readers see external gates and unresolved decisions *before* reading FRs that depend on them), or (b) merge §9 and §10 into a single "Open Questions & Assumptions" section with inline numbering (OQ-1, OQ-2, A-1, A-2) so the reader sees them as one consolidated decision log. Option (b) is the lower-friction structural change.

### 2. ADD — Add a "Privacy & Data Handling" subsection under §7 NFRs (or as a new top-level section) — Adapt-In Menu gap
- **File / lines:** `prd.md:117–126` (insert location)
- **Issue:** The Adapt-In Menu flags **data governance** as a concern that should be pulled in when it applies. locos handles: (a) shop owners' phone numbers for OTP, (b) shop owners' Facebook Page tokens (NFR5 mentions scope only), (c) generated product photos and descriptions, and (d) the locos catalog itself. None of the seven NFRs in §7 names what is stored, how long, who has access, or what the deletion story is. NFR5 covers token scope, but not the broader data-handling posture. For a launch-band PRD this is a real gap, especially given the Facebook Page token carries page-management permissions (NFR5) and the catalog carries shop pricing data.
- **Suggested fix:** Add an **NFR8 — Data handling & retention** bullet (or a short §7.1 subsection) covering: data categories stored (PII, tokens, content), retention windows (especially for generated images and catalog entries after a shop is offboarded), and the deletion path. If the parent business already has a privacy posture the PRD should reference it ("conforms to parent-business privacy policy vN") rather than restate it. This is a structural add — prose work is for the prose reviewer.

### 3. CONDENSE — Collapse the Phase 1 / Phase 2 boundary statement to a single instance in §1
- **File / lines:** `prd.md:14` and `prd.md:16`
- **Issue:** Line 14 names the Phase-1/Phase-2 boundary in the scope sense ("Phase 1 scope is deliberately the shop-owner tool only…"). Line 16 names it again in the strategic-logic sense ("This PRD covers only that first, cheap, standalone-valuable half"). The second instance is a re-framing, not new information; for a structural pass, the strategic paragraph can stand alone without restating the boundary that the prior paragraph already established.
- **Suggested fix:** Cut the trailing clause "This PRD covers only that first, cheap, standalone-valuable half — and it is worth building even if Phase 2 never happens" from line 16 and let the "if it ignites later, wonderful; if it doesn't, the shops still got a genuinely useful tool" framing carry the strategic weight. This is a structural cut — the prose reviewer may further tighten the paragraph, but the redundancy itself is a structural fact.

### 4. ADD — Surface a brief "Risks" cluster or flag in §8 Dependencies — Adapt-In Menu gap (risk register)
- **File / lines:** `prd.md:127–133`
- **Issue:** The Adapt-In Menu's "Enterprise initiatives" cluster calls out **Risk and Mitigations** as an optional section. The Facebook app-review dependency (line 129) is the single biggest timeline risk in Phase 1, and it is named correctly, but it lives as a one-line dependency rather than a flagged risk with a mitigation path. For a launch-band PRD, even three to five bullet risks (Facebook app review, AI provider reliability, Vietnamese-language generation quality, SMS deliverability, Facebook Graph API changes) would let downstream architecture/ops plan against them. Current §8 lists dependencies; it does not name *what we do if X fails*.
- **Suggested fix:** Either expand §8 to "Dependencies & Risks" with a short "Key risks" bullet list at the bottom (3–5 items, one-line each, no mitigation prose — that belongs in addendum or architecture), or add a separate §11 "Key Risks" section. The first option is lower-friction and preserves the existing dependency structure.

### 5. PRESERVE — FR ID numbering, scope, and UJ placement are correct
- **File / lines:** `prd.md:80–116` (FRs), `prd.md:49–60` (UJ-1)
- **Note:** FR1–FR25 are globally numbered, stable, with no orphans, no collisions, no duplicate IDs. Every FR has at least one scope line in §5 or one UJ beat in §4 that justifies it. FR10 (model fidelity "soft target, not a hard gate") is a structural call-out worth preserving — it sets the right expectation for downstream architecture (no fixed fidelity score in the spec). The UJ in §4 is the right depth for a launch-band PRD and earns its 18 lines by carrying the seven-step flow that realizes FRs 2, 5, 8–14, 16, 22, 25. **No change recommended.**

---

## Adapt-In Menu coverage check

Cross-referenced against the Adapt-In Menu from `bmad-prd` skill template:

| Concern | Status | Where in PRD |
|---|---|---|
| Cross-cutting NFRs | Present | §7 |
| Constraints & Guardrails (Safety / Privacy / Cost) | **Partial** — Cost in NFR7, Privacy **missing** | See Finding #2 |
| Why Now | Not applicable — timing not load-bearing for Phase 1 | — |
| Aesthetic and Tone | Not applicable — tool-first, brand-neutral spec | — |
| Information Architecture | Deferred to UX (correct) | — |
| Monetization | Out of scope (Phase 1) — named in §5 | §5 Out |
| Platform | Implied via NFR2 — could be one line stronger | §7 NFR2 |
| Stakeholders and Approvals | Implicit (Syle/product) — not surfaced structurally | OQ2, OQ4 |
| Risk and Mitigations | **Missing** | See Finding #4 |
| ROI / Business Case | Out of scope (internal value-add tool) | — |
| Operational Requirements | Light — NFR3, NFR4 carry design bands | §7 |
| Integration and Dependencies | Present | §8 |
| Rollout and Change Management | Not applicable for Phase 1 internal launch | — |
| Data Governance | **Missing** | See Finding #2 |
| Audit Trail / Decision Provenance | Not applicable | — |
| Compliance and Regulatory | Not applicable (no regulated domain) | — |
| API Contracts / Public Surface | Not applicable (no public API) | — |
| Versioning and Deprecation Policy | Not applicable | — |
| Performance Budgets | Present (NFR3, NFR4) | §7 |
| Language / Runtime Targets | Out of scope for PRD (architecture decision) | — |
| Hardware Constraints | Not applicable | — |

**Two genuine gaps** (Findings #2 and #4). Both are structural adds, not prose work.

---

## Addendum decision

**No addendum.md exists for this PRD. Is one warranted?**

**Conditional YES** — but not yet. The PRD currently carries no content that *over-earns* its place in `prd.md` and belongs in addendum. All inline material is at the right level of abstraction (capabilities, not implementation). However:

- **Once architecture work begins**, the following will migrate to addendum:
  - Provider/model choice for AI generation (currently a one-line dep at line 131)
  - Token storage specifics (NFR5 is correct for PRD level; the *how* is architecture)
  - Session TTL mechanism (A1 — "exact TTL to confirm" is architecture)
  - Cost-per-generation model (NFR7 currently stops at "observable"; the actual cost model is architecture)
  - Regeneration cap threshold if/when OQ1 resolves to a cap

- **Once UX work begins**, the following will migrate:
  - Model attribute set (A3 / OQ2 — currently flagged as pre-UX blocker, which is correct)
  - Sold-out visual treatment (FR25)
  - Error-state copy and recovery UX (FR20)

**Recommendation:** Do **not** create `addendum.md` yet. It would be empty or speculative. Create it when architecture and UX work each generate content that needs to live somewhere — that is the natural trigger. Flagging here so the finalize step doesn't pre-emptively create an empty file.

---

## Section sizing audit

| Section | Lines | Verdict |
|---|---|---|
| §1 Overview | 8 | Right-sized |
| §2 Product Principles | 9 | Right-sized |
| §3 Goals & Success Metrics | 16 | Right-sized |
| §4 Users & Context | 18 | Right-sized |
| §5 Scope | 19 | Right-sized |
| §6 Functional Requirements | 37 | Right-sized (5 features × ~7 FRs avg) |
| §7 Non-Functional Requirements | 10 | Right-sized |
| §8 Dependencies & Assumptions | 7 | Right-sized |
| §9 Open Questions | 7 | Right-sized |
| §10 Assumptions Index | 11 | Right-sized |
| **Total** | **152** | Balanced — no section over-earns |

No section is disproportionately long for the value it delivers. §6 is the largest at 37 lines, which is correct — it carries 25 FRs grouped under 5 feature clusters. The header hierarchy is flat and clean: H1 (title), H2 (section), H3 (feature cluster inside §6, UJ inside §4). No awkward nesting. No section needs splitting.

---

## Redundancy audit

True redundancies (identical information repeated without purpose):

1. **§1 line 14 vs. §1 line 16** — Phase 1/Phase 2 boundary stated twice. See Finding #3. **Structural cut recommended.**
2. **§5 Scope In vs. FRs in §6** — many scope lines re-appear as FRs. This is *not* redundancy — scope states the boundary, FRs operationalize it. **PRESERVE.**
3. **§8 Dependencies vs. inline notes in NFRs/FRs** — Facebook is named as a dependency (§8) and as the only publish destination (FR21, NFR5, FR5). This is *not* redundancy — each reference is at the right level for its section. **PRESERVE.**
4. **§10 Assumptions Index vs. inline `[ASSUMPTION]` tags in §6, §7, §8** — by design. The Assumptions Index is the consolidated view; inline tags are the local anchor. **PRESERVE.**

Only one true redundancy (Finding #3).

---

## Hierarchy / nesting check

- H1: Title only (line 8) — correct.
- H2: 10 sections (1–10) — flat, scannable. Correct.
- H3: Only in §4 (UJ-1) and §6 (5 feature clusters). Correct.
- H4: None. Correct — no over-nesting.
- Lists are two levels deep maximum. Bulleted FR lists are flat. Correct.

**No hierarchy issues.**

---

## Summary

- **Total recommendations:** 4 actionable + 1 PRESERVE (intentional)
- **Estimated impact:**
  - Finding #1 (MOVE): zero words removed; structural reorder of two sections, or a merge.
  - Finding #2 (ADD): +30–60 words for a new NFR8 or short §7.1 — fills a real gap.
  - Finding #3 (CONDENSE): ~25 words removed from §1; the strategic paragraph still stands.
  - Finding #4 (ADD): +40–80 words for a "Key risks" cluster or expanded §8 — fills a real gap.
  - Net: roughly break-even on words, materially better on reader journey and concern coverage.
- **Meets length target:** N/A — no length target specified; current length is appropriate for stakes calibration (launch / internal-to-launch band).
- **Comprehension trade-offs:** None. The two ADDs (Findings #2 and #4) add value, not fluff; the CONDENSE (Finding #3) removes a true duplicate; the MOVE (Finding #1) reorganizes existing content without changing it.
- **Verdict:** **PASS-WITH-FIXES** — the four findings are small, surgical, and structural. None require prose work.
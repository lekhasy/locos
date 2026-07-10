# PRD Quality Review — locos (Phase 1)

## Overall verdict
This is a tight, well-judged PRD for an internal value-add tool. It commits to a clear Phase-1 thesis ("win shops cheaply now, shoppers later"), scopes ruthlessly, and lets the reader see what's deferred without apologising for it. The remaining gaps are concentrated in Done-ness clarity (FRs lack testable acceptance bars) and a few Open Questions that look rhetorical but actually bite downstream work — neither is fatal before UX/architecture/epics, but they should be answered (or explicitly handed off) before stories get written. Verdict: PASS-WITH-FIXES.

## Decision-readiness — strong

The PRD is honest about its shape: it states the Phase-1 boundary as a *decision* (§1, "Phase 1 scope is deliberately the shop-owner tool only"), repeats it in the explicit Out list (§4), and re-asserts it in behaviour (FR19: no watermark, FR21: Facebook only). Trade-offs are surfaced, not smoothed — FR17 ("locos never edits or deletes a previously created Facebook post") and the "republishes = new post" model are named as the chosen behaviour, not as "considerations." SM3 (generation-to-publish conversion) and CM2 (regeneration churn) genuinely validate the AI-output-quality thesis rather than measuring vanity activity.

The few Open Questions that exist (OQ1–OQ5) are real and unanswered, not rhetorical. OQ2 and OQ3 will matter to architecture and UX respectively; OQ1 is acknowledged as deferred per decision, which is the right call at this stage.

## Substance over theater — strong

Almost no furniture. The user section (§3) commits to a *single* Phase-1 persona — the shop owner — rather than padding with shopper personas "for completeness," and the rationale is stated ("Phase 1 is the cheap half"). There is no Differentiation section, no Competitive Analysis, no boilerplate vision paragraph — and the PRD is better for their absence. The Counter-metrics (CM1–CM3) are product-specific (abandonment, regeneration churn, FB post failures), not generic safety nets. NFRs are concrete: NFR3 gives an order-of-magnitude target ("thousands of shops, ~one product/day"), NFR7 names the cost awareness driver honestly ("AI generation carries real per-use cost absorbed by the parent business"). The single caveat is NFR4 ("tens of seconds" as an [ASSUMPTION]) — see Done-ness.

## Strategic coherence — strong

The thesis is stated cleanly in §1: winning shops is cheap because the tool does real work on day one; shoppers are deferred. Feature prioritisation follows: auth + FB connect + generate + publish + catalog — nothing extra. Success Metrics validate the thesis (SM1/SM2 measure *active* shop behaviour, the truest signal the tool is helping), and the explicit "Deferred (Phase 2)" line under §2 prevents the reader from inventing a buyer-acquisition metric that Phase 1 cannot support. Counter-metrics guard against the obvious failure modes (CM1 = quality broken, CM2 = output missing the mark, CM3 = integration broken).

Minor observation: SM3 measures conversion of generate→publish, which is correct, but it implicitly assumes owners mostly publish from the first publishable state. If the dominant flow becomes "regenerate 5 times, then publish," CM2 will trip first and SM3 stays healthy — worth keeping an eye on, but not a PRD defect.

## Done-ness clarity — thin

This is the dimension downstream story creation will lean on hardest, and it is the weakest. Most FRs are capability statements, not acceptance statements. Examples that an engineer or QA cannot directly verify from the text:

- **FR3** ("a persistent session with a reasonable expiry") — "reasonable" is the textbook red-flag phrase; needs a duration or a TTL behaviour.
- **FR10** ("the generated model image must depict the actual uploaded product recognizably… acceptable-and-improving quality is expected") — this is a conscious soft gate, but as written it gives no QA any pass/fail bar. Acceptable as a deliberate choice for Phase 1, but it should be re-stated as an explicit Phase-1 acceptance criterion (e.g., "no perceptual-mismatch flag from the owner after first regeneration" as a stand-in) rather than left as a soft clause.
- **FR11** ("a small set of style options; exact list TBD") — handed to OQ3; fine, but should be tagged as an *architecture input blocker*, not just an OQ.
- **NFR3** ("order of magnitude, not a committed SLA") — correctly disclaimed, but means downstream has nothing to design *for*. Recommend restating as a design target band ("design for ~5,000 shops and ~3,000 publishes/day; degrade gracefully beyond").
- **NFR4** ("tens of seconds") — same issue, but at least tagged as an assumption.
- **FR13** ("the owner can edit the generated title, description, and price") — no field constraints. How long can titles be? Can the price be non-numeric? Minor, but epics will have to invent them.

### Findings
- **medium** Done-ness: vague acceptance bar on FR10 (§5.3) — *"acceptable-and-improving quality"* gives no QA a pass/fail bar. *Fix:* state the Phase-1 acceptance as a behaviour (e.g., "owner can always proceed to publish after at most N regenerations" or "no more than X% of first-pass outputs are flagged unusable in CM2"), or explicitly mark it as a soft target with the metric that watches it (CM2 already exists — say so).
- **medium** Done-ness: FR3 session expiry is unstated (§5.1). *Fix:* give a TTL or a re-auth trigger ("re-auth after 30 days idle" / "session bound to refreshable token").
- **medium** Done-ness: NFR3 is disclaimed as "not a SLA" but offers no design target (§6). *Fix:* restate as a design band (e.g., "design for ~5k shops, ~3k publishes/day; gracefully degrade beyond") so architecture has something to size against.
- **low** Done-ness: FR13 omits field constraints on editable title/description/price (§5.3). *Fix:* defer to epics or state minimums here.

## Scope honesty — adequate (leaning strong)

The PRD is unusually disciplined about scope. §4 names what's in and out, FR19 re-confirms the watermark deferral at the behaviour level, and Phase-2 items are tagged in §2 rather than being promised "for later." The `[ASSUMPTION]` tags are used appropriately — at genuine inferences (session TTL, reconnect-on-expiry behaviour, attribute set), not as a hedge on every paragraph. OQ5 explicitly raises the admin-view question that could otherwise have been silently assumed into the app.

The one scope-honesty gap is that **[ASSUMPTION] tags are not indexed at the end** — the rubric calls for an Assumptions Index, and this PRD has at least 7 inline `[ASSUMPTION]` tags scattered across FR3, FR7, FR11, FR14, NFR3, NFR4, OQ5, plus the §7 dependencies note. Not a blocker, but downstream agents will have to re-find them. See Mechanical notes.

### Findings
- **low** Scope: no Assumptions Index despite 7+ inline `[ASSUMPTION]` tags (§5–§7). *Fix:* add a tail-section index so downstream agents can see them at a glance.

## Downstream usability — adequate

This is a chain-top PRD (feeds UX → architecture → epics → stories), so downstream usability matters. Glossary: terms are used consistently — "shop owner," "catalog," "publish," "republish," "sold out" carry the same meaning across UJ-1, §5.4, §5.5. ID scheme is contiguous: FR1–FR25, NFR1–NFR7, UJ-1, SM1–SM3, CM1–CM3, OQ1–OQ5 — no gaps, no duplicates. Cross-references resolve (e.g., FR17 referenced from FR23, FR7 referenced from OQ4).

Two specific concerns for the downstream chain:

1. **OQ3 (model-attribute options)** is a *real* blocker for UX and a *soft* blocker for architecture. The PRD should flag this as "must answer before UX starts," not just leave it as an OQ.
2. **OQ2 (generation latency target)** is an *architecture* question (provider/model choice depends on it). The PRD tags NFR4 but does not route it.

UJ-1 has a named protagonist ("Chi," a small dress shop owner in District 3) — good. No floating UJs.

### Findings
- **high** Downstream usability: OQ3 (model-attribute set) is a UX blocker (§8). *Fix:* either answer it now or explicitly mark it "must resolve before UX begins" with a target date/owner.
- **medium** Downstream usability: OQ2 (latency SLA) is an architecture input, not a generic OQ (§8). *Fix:* tag it as an architecture decision and route to the architect, or accept "tens of seconds" as a design target and move on.
- **low** Downstream usability: OQ5 (admin view for SM1/SM2) — is this in-app or internal tooling? (§8) *Fix:* state the choice in the PRD; otherwise both UX and architecture will assume different defaults.

## Shape fit — strong

This is an internal value-add tool on a brownfield supply business, single operator role per account, Phase 1 deliberately scoped to one half of a two-sided product. The PRD's shape matches the product: capability-spec FRs (not exhaustive persona matrix), single user, one UJ carried end-to-end, operational-style success metrics (active shops, frequency) rather than user-facing satisfaction metrics. There is no over-formalisation (no scoring rubric for personas, no value-vs-effort matrix). The "this is a value-add on an existing business" framing is stated up front and the PRD earns the lightweight rigor all the way through.

No findings.

## Mechanical notes

- **Assumptions Index roundtrip — missing.** At least 7 inline `[ASSUMPTION]` tags (FR3, FR7, FR11, FR14, NFR3, NFR4, OQ5, plus the §7 Facebook-app-approval note). No tail-section index. Recommend adding a "Assumptions & Open Questions — Index" section at the end so downstream agents can scan once.
- **Glossary — implicit, no drift detected.** Domain nouns ("shop," "catalog," "publish," "republish," "sold out," "model image") are used identically across UJ-1, §5, §6. No glossary drift found. A formal glossary entry would help UX, but is not required at these stakes.
- **ID continuity — clean.** FR1–FR25, NFR1–NFR7, UJ-1, SM1–SM3, CM1–CM3, OQ1–OQ5. No gaps, no duplicates.
- **Cross-references — resolve.** FR17 ↔ FR23, FR7 ↔ OQ4, FR11 ↔ OQ3, NFR4 ↔ OQ2, FR3 ↔ session-expiry assumption. All resolve.
- **UJ protagonist naming — good.** UJ-1 carries "Chi" inline as a named protagonist.
- **Required sections for agreed stakes — present.** Overview, Goals & Metrics, Users, Scope (in/out), Functional Requirements, Non-Functional Requirements, Dependencies & Assumptions, Open Questions. No Missing section is material at these stakes.
- **Minor wording nit.** §5.4 header reads "Publishing" but FR16/FR17 use both "publish" (locos) and "post" (Facebook) — these are deliberately distinguished and the glossary is implicit. Worth one sentence in §3 or §5.4 confirming "publish = locos catalog + optionally Facebook; post = Facebook-only action," since UJ-1 uses them as separate steps ("Publish" then "Post to Facebook"). Low-impact, but currently the distinction lives only in the UJ text.
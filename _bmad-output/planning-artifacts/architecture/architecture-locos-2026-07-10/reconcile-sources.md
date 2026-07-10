# Source Reconciliation — locos Architecture Spine

**Spine under review:** `_bmad-output/planning-artifacts/architecture/architecture-locos-2026-07-10/ARCHITECTURE-SPINE.md` (status: draft, altitude: feature, 8 ADs)

**Method:** For each source, surface qualitative content, posture, requirements, and constraints that did not make it into the spine as a load-bearing element (AD or consistency-convention row). The spine's load-bearing layer is the 8 ADs + consistency conventions table; the rest (stack table, structural seed, capability map, deferred, open questions) is reference material. A gap = something the source says that should be either an AD or a row in the conventions table — but isn't.

---

## Source 1: `briefs/brief-locos-2026-07-09/brief.md`

The brief establishes voice, posture, and the strategic bet. Most posture is qualitative, but a few items translate into architectural obligations that aren't currently anchored to an AD.

### Gaps

1. **"Tool-first, do the chore for them" + "Acquisition is the existing relationship."** Together these imply two architectural facts: (a) generation must feel cheap and unrationed (no UI friction around regeneration), (b) there is **no self-service signup** — accounts are provisioned manually by the team. The spine's capability map lists "Shop provisioning (FR1, FR4)" as an AD-5 row but does not make "no public signup" a visible rule. There is no convention row saying "provisioning is operator-only, never user-driven." If a future contributor builds a self-serve flow by default, the spine offers no architectural guardrail. **Suggested home:** a new row in the Consistency Conventions table: "Account provisioning: operator-only via internal tool; no self-service signup path in app code." (Binds FR1, FR4; complements AD-5.)

2. **"Shop owns the customer" as an architectural posture.** The spine picks this up in AD-3's "prevents" line ("'the shop owns the customer' being violated"), but the *posture itself* — that locos never inserts itself between shopper and shop — has architectural weight beyond FB-post mutability. Specifically: the FB post is **self-contained** (product + shop contact, no locos CTA back to locos in Phase 1) and this is a *content* rule, not just an API-call rule. AD-3 covers the mutation rule (no edit/delete); it doesn't say "the post body must not include locos.com links or watermarks." Today that's deferred, but the spine doesn't explicitly state that **Phase-1 post bodies exclude any locos-driven attribution**. **Suggested home:** AD-3 rule extension (one sentence: "Post body composition lives entirely in the shop's content + shop contact info; no locos URL, watermark, or CTA in Phase 1."), or a conventions row for "FB post content boundaries."

3. **"Honest about unknowns" — buyer-lift attribution.** The brief explicitly refuses to invent a metric for buyer-lift. The spine doesn't have an architectural statement that locos **does not instrument buyer-side telemetry** in Phase 1. This is a quiet constraint that's easy to violate by default (someone adds a `redirect_via_locos` parameter, a watermark with a tracking link, etc., "just in case"). **Suggested home:** a brief note under AD-3's "Phase 1 post body composition" or a conventions row: "No Phase-1 instrumentation of buyer-side telemetry; locos does not observe post→shop conversion."

---

## Source 2: `briefs/brief-locos-2026-07-09/addendum.md`

The addendum is research/parked material. Most of it is explicitly out-of-scope (Phase 2, monetization). One observation is load-bearing for Phase-1 architecture.

### Gaps

1. **"AI generation cost controls (quotas/caps) as posting volume scales" is parked in the addendum, but PRD NFR7 (cost observability) is in scope and PRD OQ1 (regen cap) is open.** The spine carries cost observability as a capability-map row and OQ1 in Open Questions — which is consistent — but the addendum framing of "cost controls as posting volume scales" is the *why* behind NFR7 + OQ1 being live concerns. The spine doesn't carry any forward-looking guardrail that says "if per-shop generation cost exceeds X, revisit OQ1." That may be fine for a feature-altitude spine, but the addendum's posture ("watch this, don't ration yet") deserves at least a one-line framing in the Deferred section so the spine and addendum agree on the seam. **Suggested home:** one line in the Deferred section clarifying "Cost controls (quotas / per-shop caps) live behind OQ1; revisit when NFR7 observability surfaces cost pressure."

2. **Two-sided cold start + geographic density seeding.** The addendum names the Phase-2 launch pattern (micro-dense neighborhoods first). The spine's Deferred section mentions "Multi-region / HA" and "Search / discovery" but doesn't name the *density-seeding* constraint that will govern Phase-2 shop provisioning (the parent business seeds shops in a small radius, then expands). This is a Phase-2 concern, so technically out of scope for an altitude="feature" spine, but the brief/addendum both call it out as the strategic lever. **Suggested home:** a one-liner in Deferred noting the Phase-2 launch shape ("density-first seeding, not blanket citywide") so future contributors see the why behind "Phase 2 features aren't built yet."

(Of the two gaps, #1 is the one worth folding in. #2 is informational and probably belongs in the brief itself, not the architecture spine.)

---

## Source 3: `prds/prd-locos-2026-07-10/prd.md`

The PRD is the strongest source for load-bearing gaps. Multiple FRs and NFRs either lack a home in the ADs or live only in the capability map.

### Gaps

1. **NFR6 (reliability of publish) has no AD and no conventions row.** NFR6 says "Publishing is resilient — a transient Facebook or generation failure is surfaced and retryable, never silently dropped." AD-3 prevents edit/delete (different concern). AD-2 makes generation async (different concern). AD-6 gives idempotency for jobs (related but not the same). The actual rule — "every publish attempt that fails transiently produces a recoverable artifact (job, log, retry affordance); nothing is silently lost" — is nowhere anchored. The capability map's "FB publish / republish" row points at AD-1/AD-3/AD-5/AD-8 but doesn't name the retry/recoverability posture. **Suggested home:** either a new AD (AD-9 — "Publish attempts are recoverable: every job writes its terminal state to a durable row before declaring success; the UI offers a retry surface for the three failure modes named in EXPERIENCE.md") OR a new conventions row: "Failure surfaces are first-class: transient failures publish a `{status-pill failed}` + retry; partial generation failures show per-tile error; total failures collapse the panel but preserve inputs. No silent drops."

2. **Counter-metrics (CM1, CM2, CM3) have no architectural home.** PRD §3 names three counter-metrics as the way the system is *evaluated* for harm. The spine has a cost-observability row in the capability map (NFR7) but nothing on CM1 (abandonment), CM2 (regen churn), or CM3 (FB post failures). CM3 is the same surface as NFR6's "retryable" half, so AD-9 above could carry it. CM1/CM2 require the system to *emit* signals on session-level events (generation started, generation abandoned, regeneration requested, publish completed). Today nothing in the spine says those events are logged. **Suggested home:** an extension to the Logging conventions row, or a new conventions row: "Counter-metric events are logged: generation_started, generation_abandoned, regeneration_requested, publish_attempted, publish_succeeded, publish_failed. Used to compute PRD CM1/CM2/CM3. No UI surface on these events."

3. **FR23 (catalog edits update locos record only; FB posts untouched) is bound to AD-3 implicitly but the spine's AD-3 rule doesn't say "catalog edits are versioned or carry enough state that a future republish uses the latest content."** This is the *race* concern the user flagged: a re-publish racing with an in-flight regeneration on the same product. The spine does not address concurrency. AD-6 gives job idempotency *for regenerations* but not for the cross-job case (regenerating image X while user edits title and republishes). **Suggested home:** an AD-9 about concurrency (covers race + NFR6 + CM3): "All writes to a product are linearized at the row level (shopId, productId); an in-flight regeneration locks image slots so a republish either waits or reads the prior committed set; no concurrent-write corruption."

4. **OQ4 (admin view for team to see active shops) is in PRD §9 Open Questions and is mentioned in the spine's Deferred section ("whether internal team metrics live in this app or external internal tooling — out of scope here; deferred").** That is fine. However, the spine doesn't say where success metrics SM1/SM2 are *computed*. If they're not in this app (per OQ4 defer), the system still has to emit the underlying events (active-shop-per-rolling-7-days, products-published-per-shop-per-week). That's the same observability gap as CM1/CM2/CM3 above. **Suggested home:** same conventions row as Gap #2 ("Counter-metric events are logged"). SM1/SM2/SM3 events are a strict subset of the same emission set.

---

## Source 4: `ux-designs/ux-locos-2026-07-10/DESIGN.md`

DESIGN.md is the visual identity reference. It has posture, not requirements.

### Gaps

1. **"No webfonts in Phase 1 — keeps first-paint fast and removes a third-party dependency in a tool whose load is already tens of seconds for AI generation (per NFR4)."** This is an explicit architectural constraint stated in the design doc. The spine's Stack table doesn't list font strategy at all. If a future contributor adds Google Fonts to the Next.js app "for prettier typography," they violate a design-doc decision that has architectural weight. **Suggested home:** a one-line row in the Stack table under Typography: "No webfonts in Phase 1; system font stack only (see DESIGN.md Typography). Removes a third-party render-blocking dependency."

2. **"Single rule for imagery: all generated product photos and owner-uploaded photos sit on `{colors.surface}` with a 1px `{colors.outline}` frame. No drop shadows behind photos."** This is purely visual and doesn't belong in the architecture spine. **No gap.**

3. **"No dark mode toggle in Phase 1"** and **"No bottom tab bar in Phase 1"** and **"No carousel auto-advance"** are stated as anti-patterns. The first two are deferrals / scope decisions. They live in the brief's Out-of-scope list and don't need to be duplicated in the spine. **No gap.**

(Of the three checked, only Gap #1 is load-bearing for the spine.)

---

## Source 5: `ux-designs/ux-locos-2026-07-10/EXPERIENCE.md`

EXPERIENCE.md is the behavioral spine — it has multiple architectural weight moments.

### Gaps

1. **Per-image regen without text regen (logged in UX decision + EXPERIENCE.md "Generation image set semantics").** Each product has N generated images; per-image regen re-rolls a single image; **text is never re-rolled — owner edits inline.** This is not the same as FR12 ("owner can regenerate images") which leaves the granularity open. The architectural implication: the regeneration job operates on a **single image slot**, not on the whole product's image set. AD-2 covers "AI generation is always async" and AD-6 covers "regen idempotency by `(shopId, productId, imageIndex, inputFingerprint)`" — and the latter *does* include `imageIndex`, so this is already covered. **Confirm AD-6's `imageIndex` field is the explicit home; no gap.**

2. **Owner can delete a generated image (PRD FR-extension, newly discovered in EXPERIENCE.md).** The spine calls this out explicitly in Open Questions: "PRD FR-extension (UX-derived): owner can delete a generated image from a product before/after publish. UX contract is in `EXPERIENCE.md`; this spine assumes the corresponding FR will be added to the PRD and that `core/product/delete-image.ts` + an `adapters/postgres` tombstone row will be the implementation." **The spine flags it as an assumption, not as an AD.** The implementation hint is already there (tombstone, like AD-4 deletes), but the spine doesn't make the **invariant** explicit: deleting a generated image is tombstone-on-row (consistent with AD-4's "Deletes are tombstone-on-row, never delete-bytes-during-retention"); it does not delete the underlying generated bytes (those are content-addressable and may be referenced by future regens or other products). **Suggested home:** an explicit row in the capability map: "Generated image deletion (UX-derived, pending PRD FR)" → governed by AD-4. **Or** a one-line addition to AD-4's rule: "Generated image deletion by an owner is a tombstone on the product-image row; the underlying content-addressable bytes persist for retention."

3. **Image-action overlay UX (regenerate + delete per image).** Covered by AD-2 (async regen), AD-4 (immutable bytes), and the FR-extension handling above. UX-derived, not architectural. **No gap.**

4. **Sold-out toggle UX.** Covered in the capability map's "Catalog list/edit/delete/sold-out (FR22–FR25)" row. Sold-out is **not** in Phase 1 an inventory system — it's a single boolean per product. The spine correctly defers "listing-freshness / sold-out handling" as a Phase-2 concern. **No gap.**

5. **Phase-1 user framing ("shop is the only Phase-1 user; search is Phase 2").** The spine's Deferred section lists "Search / discovery / Phase 2 features. Out of scope; not in the spine." This correctly frames it as out-of-scope. The brief's posture that "under-invest, on purpose, in shopper acquisition" is not directly architectural but is referenced indirectly via "OQ4 admin view … deferred." **No additional gap.**

6. **Concurrency / runtime race (the user's question 7).** EXPERIENCE.md Flow 1 step 10 has Chi regenerating a single image while two others "continue / finish as expected." That's per-image concurrency within a generation job — covered by AD-6's `imageIndex` keying. The user's flagged race is a **different** one: republish racing an in-flight regeneration on the same product. That is the PRD §6.4 case (FR9 + FR12 + FR16). As noted in PRD Gap #3, the spine has no concurrency AD. **Suggested home:** same as PRD Gap #3 — a concurrency AD or convention.

---

## Final Summary

### Which gaps are worth folding in before finalize, ranked

**Rank 1 — Concurrency / recoverability AD (combines PRD Gap #3, PRD Gap #1, PRD Gap #2, EXPERIENCE Gap #6).** The spine has no architectural rule for: (a) what happens when a regen races a republish on the same product, (b) how transient failures are surfaced and made retryable, (c) how counter-metric events are emitted. Today AD-3 prevents FB edit/delete; AD-2 makes generation async; AD-6 gives per-job idempotency; but none of them say "what does it look like at the row level when two writes compete." This is the highest-risk gap because it's exactly the kind of thing that surfaces as data corruption in production, not in development. **Suggested landing:** new AD-9 ("All writes to a product are linearized at `(shopId, productId)`; in-flight regeneration locks image slots; republish reads committed set; no concurrent-write corruption"). Could also house NFR6's "never silently dropped" rule.

**Rank 2 — Counter-metric / success-metric event emission conventions row (PRD Gap #2 + Gap #4).** The system needs to *emit* events that feed CM1/CM2/CM3 and SM1/SM2/SM3, even though the dashboard for those metrics lives elsewhere (OQ4 defer). Without an explicit event-emission rule, the metrics can't be computed. **Suggested landing:** new conventions row: "Counter-metric events are logged: generation_started, generation_abandoned, regeneration_requested, publish_attempted, publish_succeeded, publish_failed, shop_login, product_published. Used to compute PRD CM1/CM2/CM3 and SM1/SM2/SM3. No UI surface on these events."

**Rank 3 — "Shop owns the customer" content boundary under AD-3 (Brief Gap #2).** The brief posture is load-bearing for Phase-1 post composition: the FB post body must not include locos attribution, watermarks, or CTAs. Today AD-3 says "we never edit/delete"; it doesn't say "we never insert our own links." A new contributor adding a "powered by locos" footer to the FB post body would not violate AD-3 as written. **Suggested landing:** one-line rule addition under AD-3: "Post body composition includes only shop-provided content + shop contact info; no locos URL, watermark, or CTA in Phase 1 (Phase-2 distribution loop adds these)."

**Rank 4 — Generated-image deletion as a tombstone-on-row invariant (EXPERIENCE Gap #2).** The spine currently flags the FR-extension as a placeholder in Open Questions. It should be promoted to an invariant under AD-4: generated image deletion is tombstone-on-row, not byte-deletion. Otherwise an implementer might write a hard `DELETE FROM images WHERE …` that violates content-addressable immutability. **Suggested landing:** one-line rule addition under AD-4: "Generated image deletion by an owner is tombstone-on-row; the content-addressable bytes persist for the retention window."

**Rank 5 — Operator-only account provisioning (Brief Gap #1).** The brief's "acquisition is the existing relationship" implies an architectural fact: no self-serve signup path exists in app code. AD-5's "shop is the unit of all data" is related but doesn't make the operator-only rule visible. **Suggested landing:** new conventions row: "Account provisioning: operator-only via internal tooling; no self-service signup path exists in app code." Lower-priority because FR1 + FR4 + the absence of any signup route in the structural seed already make this true by omission — but explicit is better than implicit for a load-bearing brief posture.

### Verdicts on what NOT to fold in

- **No webfonts in Phase 1 (DESIGN.md):** useful but low-stakes; the structural seed and Next.js conventions make it hard to accidentally introduce webfonts. Could be a one-liner in the Stack table if there's appetite, but not load-bearing.
- **Cost-controls revisit framing (Addendum):** the spine's Open Questions already carry OQ1; the Deferred section already references cost. Adding "revisit when cost observability surfaces pressure" duplicates existing text.
- **Density-first Phase-2 seeding (Addendum):** genuinely Phase-2, doesn't belong at altitude="feature."
- **Counter-metrics surfaced vs. un-surfaced in UI (DESIGN.md):** covered implicitly by the existing posture (no streaks, no badges); doesn't need an AD.

### Overall verdict

**MINOR-GAPS.** The spine is structurally complete and the 8 ADs cover the load-bearing architectural decisions correctly. The most consequential gap is **concurrency / recoverability** (Rank 1) — without an explicit rule for republish-vs-regen races and transient-failure surfaces, the system can ship with silent corruption. The remaining gaps (event emission, post-body content boundary, generated-image deletion invariant, operator-only provisioning) are real but smaller, and each can be folded in as a small convention-row or one-line AD extension.
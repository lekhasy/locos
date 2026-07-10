# Brief → PRD Reconciliation

This pass compares the Phase-1 PRD against the source brief (`brief.md`) and `addendum.md`, flagging anything that should be reflected in a Phase-1 PRD but is missing, under-specified, silently dropped, or contradicted. Phase 2 deferrals are deliberately not flagged.

---

## 1. Mission & Strategic Framing — LARGELY DROPPED

The brief's single most distinctive editorial move is its **strategic posture**: locos is "deliberately not a bet-the-company venture," a "value-add tool built on top of an existing business," whose mission is "to help our shop customers succeed and deepen that relationship." The marketplace upside is "optionality," not the product. The brief frames locos's structural advantage as sidestepping the two-sided cold-start trap by *not* asking shops to "join a marketplace."

**In the PRD:**
- Section 1 Overview compresses this into one dry sentence: "built as a value-add on top of an existing business that already supplies these shops."
- The "strategic logic" sentence captures the cheap-shops / expensive-shoppers asymmetry, which is good.
- **Missing:** The mission language ("help our shop customers succeed and deepen that relationship"), the explicit "upside optionality" framing, the cold-start framing, and the honest posture that the relationship with shops must carry Phase 1 on its own.
- **Risk:** Without this framing, downstream agents may read Phase 1 as "step 1 of building a marketplace" rather than "a retention tool whose marketplace upside is contingent." This shifts design priorities (e.g., pulling users toward Phase-2 surfaces prematurely) and changes how success and failure are interpreted.

**Recommendation:** Add a short "Strategic posture" subsection in Section 1 (or a Section 1.5) preserving the "value-add on existing relationship," "mission = help shops succeed," and "marketplace = optionality" framings. The cold-start framing explains why Phase-1 UX can be shop-only without feeling incomplete.

---

## 2. Brand Voice & Qualitative Intent — NEARLY ABSENT

The brief is unusually voice-rich for a product document. Distinctive qualitative elements:

- **"locos is not a checkout"** — explicit positioning.
- **"Find it, then contact or visit the shop directly"** — the shopper intent is non-transactional, and that same non-transactional feel carries into how the tool should *feel* to shop owners (you're handing them something they own, not capturing them into a flow).
- **"Self-contained"** social posts are described with the deliberate phrase "so no one has to visit locos to buy" — Phase 1 must never look like it's trying to steal the customer from the shop owner. This is a brand and trust property, not just a functional one.
- **Tone of help:** the brief repeatedly frames the tool as doing a chore the owner *already wanted to do*. The product should feel like an assistant, not a funnel.
- **"Honest about the gap"** — the brief explicitly names the buyer-side network as "unproven and under-built by choice. We're naming it, not hiding it." The PRD inherits this on the metrics side (it says the demand metric is "not measurable in Phase 1, no metric invented here") but loses the *posture*: the explicit stance that the team is choosing to be transparent about gaps rather than perform confidence.

**In the PRD:**
- No tone/voice guidance.
- No "locos is not a checkout" or non-transactional framing.
- FR18 captures the functional content of "self-contained" but loses the *why* — that the post must let a shopper act without needing locos.
- The honest-unknowns posture survives only in the metrics paragraph and the Open Questions list. It is not carried as a principle that informs design (e.g., when generation is imperfect, say so to the owner rather than fake confidence).

**Recommendation:** Add a brief "Product principles / brand posture" section covering at minimum: (a) locos is a tool for the shop owner; the shop remains the relationship, (b) locos is not a checkout and not trying to capture the customer, (c) be transparent with owners about AI limits, (d) help the shop succeed is the success criterion. This can live as a short preface to functional requirements or as its own section.

---

## 3. The "Existing Supply Business" Channel — UNDER-SPECIFIED

The brief's single biggest structural claim: **"We already have the shops."** This is the moat. The PRD mentions in Section 1 that "Accounts are provisioned manually by the locos team (these are known customers of the parent business)" and lists "Manual account-provisioning process owned by the locos/parent-business team" as a dependency. But the *implications* of this channel are dropped:

- The manual provisioning is not just an auth choice — it is **the acquisition mechanism for Phase 1.** The PRD never says: shops come to us through the parent business, not through marketing.
- Because of that channel, the locos team has direct, ongoing relationship leverage (the parent already talks to these shops regularly) — meaning onboarding, re-engagement, and feedback collection are easier than for a typical SaaS. None of this is in the PRD.
- The brief's risks section calls out that **"the posting-convenience value must carry the relationship on its own until we can answer"** whether locos sends customers. The PRD does not surface this — that Phase 1's *job* is to make the tool so useful that shops continue using it without yet proving buyer lift. This is the practical test of the strategic bet, and it deserves to be in the PRD as the lens for prioritizing features.

**Recommendation:** Add a short "Go-to-market context" or "Distribution context" note: how shops reach locos (via parent business), what assumptions that creates, and the Phase-1 test that tool value alone must carry the relationship.

---

## 4. Honest-Unknowns Posture — PARTIALLY CAPTURED, NOT PRINCIPLED

The brief's stance is: "We're flagging this as an unknown rather than inventing a metric." The PRD replicates this in SM/CM metrics and several `[ASSUMPTION: ...]` tags. Good.

But two specific brief unknowns are under-handled:

- **Buyer-lift attribution:** The brief says we don't yet have a method for it and names possible future proxies (discovery-link taps, contact/directions taps, shop-reported lift). The PRD says "not measurable in Phase 1, no metric invented here" — which is correct as far as it goes, but the *reason this matters* (the strategic test of whether the marketplace optionality ever pays off) is not stated. Future agents reading the PRD should understand why this gap is allowed to stand rather than treating it as an oversight.
- **Demand-side habit unproven:** The brief explicitly says the "discover more around you" loop may or may not work, and that this decides whether the optionality ever pays off. The PRD defers this cleanly but doesn't frame it as a known unknown that influences how Phase-1 team should *feel* about success (Phase-1 success is defined narrowly on purpose, and that's fine).

**Recommendation:** Consolidate the unknown posture into a single "What we're choosing not to know yet" callout that names (a) buyer-lift attribution, (b) demand-side habit, and why both are deliberate rather than forgotten.

---

## 5. AI Generation Quality — TENSION BETWEEN BRIEF AND PRD

The brief frames AI generation as a chore-saving, day-one-valuable tool whose quality will improve. The PRD's FR10 says "Perfect visual fidelity is not a Phase-1 acceptance gate — acceptable-and-improving quality is expected as underlying AI improves." This is consistent.

But the PRD does not carry forward the brief's risk: **if the model image is wrong (wrong product, wrong color, mangled logo, hallucinated detail), the owner has no way to know.** The brief's Risks section implicitly assumes AI will work well enough; the PRD inherits that assumption without surfacing it as a real failure mode. Specifically:

- No FR addresses **"the generated image must depict the actual product recognizably" as a quality expectation with an owner-visible signal** — e.g., when an image looks wrong, the owner can flag it or regenerate without penalty.
- No mention of what happens when generation fails outright (timeout, unsafe-output rejection, content moderation block). NFR4 mentions latency; no NFR mentions failure modes.
- The brief is honest about "listing-decay or sold-out handling" as a known future need; the PRD includes "mark sold out" in FR25, which is good — but does not include "edit a sold-out listing" or any concept of product lifecycle (e.g., relisting after a restock). Likely fine to defer, but should be acknowledged.

**Recommendation:** Add an NFR or FR subgroup on generation failure modes (timeout, unsafe-output rejection, model unavailability), and a UX expectation that owners are told clearly when output is uncertain. Optionally flag relisting as an explicit Phase-2 lifecycle item.

---

## 6. The "Self-Contained Post" — FUNCTIONAL CAPTURED, BRAND MISSING

FR18 says each Facebook post includes images, Vietnamese caption, and shop contact info. Good. But the brief emphasizes this with the specific framing: "no one has to visit locos to buy." The PRD's functional requirement doesn't say *why* self-containment matters — it presents it as a content requirement, not a brand-and-trust requirement.

This matters because: a shop owner seeing the locos-generated post should not feel like locos is trying to drive traffic *away* from their Page. The PRD doesn't say that, and a future agent might be tempted to add an attribution link "for analytics" — which would violate the brief.

**Recommendation:** Add a one-line rationale to FR18 (or its surrounding context) stating that the post must be complete on its own and must not require the shopper to visit locos. Consider adding an explicit "no locos-driven off-platform links, no click-tracking pixels" guideline.

---

## 7. Inventory Freshness / Sold-Out — GAP

FR25 covers "mark sold out." But the brief's Risks explicitly call out: "Fashion sells out fast; stale listings will erode shopper trust once the buyer side matters. v1 has no listing-decay or sold-out handling — a known future need." The PRD includes FR25, which is an improvement over the brief, but does not mention:

- **Re-stocking / relisting** — when a sold-out item returns, what happens? PRD does not say.
- **No listing-decay / no auto-archive** — fine to defer, but should be named so it isn't forgotten when Phase 2 begins.
- **Owner effort to keep catalog fresh** — the brief implies this matters for future trust; Phase-1 PRD should at least acknowledge that sold-out-marking is a manual chore with no nudge/reminder in v1.

**Recommendation:** Add an explicit note that sold-out handling is owner-initiated with no automated nudges or auto-archive in Phase 1; flag relisting as a known gap.

---

## 8. Edit / Republish Loop — IMPLIED, NOT FRAMED

The user journey (UJ-1, step 6) describes: a week later the owner edits the price and republishes, creating a fresh Facebook post; the old post is left untouched. FR17 and FR23 cover this functionally. But the brief's strategic frame implies something subtle: **the republish-as-fresh-post design is a deliberate tradeoff** (avoid touching the shop's existing public content; let the shop own its Page). This is a brand-respect decision, not just a technical one.

The PRD captures the mechanics but loses the *why* — which is exactly the kind of qualitative intent a functional-requirements structure tends to lose, as the prompt asks us to watch for.

**Recommendation:** Add a one-line rationale to FR16/FR17 noting that locos never edits or deletes content on the shop's Page because the shop owns its public presence; edits reach Facebook via a new post. (NFR6's "resilience" framing is adjacent but not the same point.)

---

## 9. Per-Channel Customization — CORRECTLY DEFERRED, BUT BRIEF HAS A NUANCE

The brief says: "For auto-posted channel content, v1 uses a single basic 'default profile.' Per-channel customization comes in a later phase." The PRD reflects this in Section 4 ("Phase 1 uses one default profile"). Good.

But the brief earlier also says the shop connects **"their shop's Facebook Page"** (singular) and the addendum implicitly assumes a small number of channels in the long run. The PRD's FR5 says "a shop owner can connect **one** Facebook Page" — this is reasonable for Phase 1 but should be explicit that it is a deliberate Phase-1 limit, not an architectural ceiling, in case downstream agents design as if multi-Page is impossible.

**Recommendation:** Small wording adjustment: "Phase 1 supports one connected Facebook Page per shop."

---

## 10. Counter-Metric "Regeneration Churn" (CM2) — Missing the Right Cost Story

The brief's Risks call out: "AI generation cost. Model-image generation has a real per-use cost, and locos is free — acceptable now as part of the retention play, but worth watching as posting volume grows. The parent business absorbs the cost; v1 has no usage cap." NFR7 ("Cost awareness") and CM2 ("excessive regenerations per publish") together touch this. Good.

But the PRD does not say: **the parent business absorbs the cost.** That is the qualitative context that explains why there's no usage cap and why CM2 is a watch-metric rather than a hard limit. Without this, a future agent might propose a regeneration cap or pricing tier, which would contradict the strategic bet.

**Recommendation:** Add a one-line note that locos is free in Phase 1, with cost absorbed by the parent business, and that no pricing/quotas are part of v1.

---

## 11. "Active Shops" Metric & Onboarding — Thin

SM1/SM2 measure shops posting at least once in a 7-day rolling window, and posting frequency. Good. But the brief implies the parent-business channel gives locos direct onboarding leverage (the parent can nudge shops to start, can show them the tool, can collect feedback in person). The PRD's OQ5 ("do we need any lightweight admin view") is the right question but framed as a tooling afterthought.

This is a borderline flag — the PRD is correctly cautious not to over-scope Phase 1 — but it is worth noting that **onboarding and re-engagement are not just product features; they are business motions the PRD doesn't speak to.** The brief's voice suggests the team will personally onboard shops in early weeks. The PRD is silent.

**Recommendation:** Either add a small "Launch & onboarding" section noting the parent-business-led onboarding motion, or explicitly mark it as out-of-PRD-scope but worth flagging in a separate ops doc.

---

## 12. Addendum-Sourced Items — Mostly Out of Scope, One In

The addendum's landscape scan, business-model norms, and known hard problems are mostly Phase 2 / parking-lot material. Not flagging them.

However, the addendum's "Known Hard Problems" section names **inventory freshness** and **geographic density** — both of which the Phase-1 PRD touches on lightly (sold-out FR25, HCMC scope) but neither gets an honest "this is a known Phase-1 limitation." Geographic density is fine (single-city is in scope). Inventory freshness has the gaps noted in §7 above.

---

## 13. Contradictions with the Brief

None of the PRD's functional claims directly contradict the brief. The contradictions are all of the omission / soft-contradiction kind:

- **PRD frames Phase 1 as "the cheap, high-value first half"** of building the marketplace. **Brief frames Phase 1 as a retention tool with marketplace as *optionality*.** Same words, different posture; the brief's framing is more honest about the contingency of Phase 2 ever paying off.
- **PRD's CM2 ("excessive regenerations")** implicitly treats regenerations as a problem to be minimized. **Brief's posture:** regenerations are a feature — the owner gets the image right before posting, which is exactly the chore we said we'd save. Both can be true (we want enough regenerations to indicate use, not so many that they indicate failure), but the PRD's framing tips toward "minimize" without that balance.

---

## Summary of Highest-Leverage Fixes

If only a handful of changes are made, these are the ones most likely to preserve the brief's intent in a functional-requirements PRD:

1. **Add a strategic-posture section** carrying forward the "value-add on existing relationship," "help shops succeed," and "marketplace is optionality" framings.
2. **Add brand-posture principles** including "locos is not a checkout," "shop owns the customer," "be honest about AI limits."
3. **Add a "what we are choosing not to know yet" callout** covering buyer-lift attribution and demand-side habit.
4. **Add rationales to FR16/17/18** capturing *why* self-containment and never-edit-old-posts are brand and trust decisions, not just functional ones.
5. **Add a cost/parent-absorbs note** to NFR7 explaining why no cap or pricing exists in v1.
6. **Note onboarding via the parent-business channel** as a non-product motion that Phase-1 success depends on.
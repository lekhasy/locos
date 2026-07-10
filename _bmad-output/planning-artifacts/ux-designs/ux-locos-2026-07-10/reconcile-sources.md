---
title: "locos — Reconcile: Source Docs vs UX Spines"
status: working
created: 2026-07-10
---

# locos — Source Reconciliation

Reading `brief.md` + `addendum.md` + `prd.md` against the two UX spines (`DESIGN.md`, `EXPERIENCE.md`) to surface qualitative content, framing, or product principles that did NOT survive the FR/NFR translation. The goal is to flag things the parent should consider folding in before finalize — not to audit functional coverage (that's already correct).

---

## 1. Brief (`brief-locos-2026-07-09/brief.md`)

### Overlaps (UX already captures)

- **Tool-first, do-the-chore posture.** `DESIGN.md.Brand & Style` opens with "functional restraint… the tool does the chore, the work speaks for itself"; `EXPERIENCE.md.Article of faith` says "The product is a tool that disappears." Solid match.
- **Shop owns the customer.** `EXPERIENCE.md` Flow 1 climax states the post is "self-contained, with all contact info" and the owner is "back at her catalog within two taps" — the shopper transacts with the shop, not locos. Aligns with brief's anti-checkout stance.
- **Rejected patterns: streaks, "magic AI", empty-state illustrations.** `EXPERIENCE.md.Inspiration & Anti-patterns` explicitly rejects streaks and "Magic AI happens here!" branding, and the empty-state component is described as functional, not motivational. Matches the brief's resistance to growth-theater.
- **Acquisition is the existing relationship.** `EXPERIENCE.md.Interaction Primitives` says "No badge counts. No streaks. No re-engagement nudges." — embodies the no-viral-growth decision.

### Gaps (qualitative ideas not yet in UX)

1. **The "honest about the gap" / buyer-lift attribution posture isn't explicitly stated as a UX principle.** The brief is unusually direct: demand attribution is not measurable, and we refuse to invent a metric. The UX avoids fake metrics operationally (no badges, no streaks) but DESIGN.md's Do/Don't list never articulates *why* — i.e., a positive principle like "don't surface shop-side metrics we can't honestly compute." If a future contributor proposes a "posts this week" widget or a "views" counter, there's no defensive line in the design doc.
2. **"Up-side optionality, not the plan" framing is missing from the brand voice section.** The brief frames locos as not-bet-the-company; DESIGN.md says "not a fashion-magazine surface, not branded ecommerce, not a generic SaaS dashboard" but doesn't say *what it is* in the strategic sentence the brief offers — i.e., a value-add on an existing supply business. Without that, the tone could drift toward "marketplace launch" energy later.
3. **The brief's "we won't pretend the technical moat is the moat" honesty is not reflected.** The UX is a tool, which is fine — but DESIGN.md.Do's currently has nothing that prevents the UX from later drifting into "discover the network of HCMC shops" framing (e.g., empty-state copy that hints at a future marketplace). A defensive "What this is not" line in DESIGN.md would be useful but doesn't yet exist as a *strategic* claim.
4. **The "default content profile, per-channel customization deferred" framing.** The brief calls this out as deliberate; the UX mentions FR21 and Phase-2 deferral in EXPERIENCE.md.Phase scope but the per-channel *post content* being a single profile (e.g., FB post content equals the locos catalog content) is implicit, not stated as a principle. A reviewer could ask "why doesn't the FB post have a different caption length?" — and the answer should be in DESIGN.md, not buried in PRD FR21.
5. **The "self-contained FB post so the shopper needs nothing beyond the post" rule has no visual consequence stated.** The UX has `fb-republish` and the product card pattern but nothing in DESIGN.md says *what the post carries*. The brief treats this as load-bearing (it's the anti-extraction guarantee). A short declarative line in Do's ("FB post carries title + caption + price + shop contact; nothing else") would lock it.

---

## 2. Brief Addendum (`brief-locos-2026-07-09/addendum.md`)

### Overlaps (UX already captures)

- **No buyer-side / no shopper surface in Phase 1.** Addendum's "Deferred / Later-Phase Notes" (shopper acquisition, watermark, per-channel customization) is honored by EXPERIENCE.md.Phase scope explicitly listing them as out.
- **Sold-out handling IS in scope for v1, even though addendum lists "listing-freshness / sold-out handling" as deferred.** UX correctly diverges here from the addendum's parked list — `sold-out-toggle` is a real component, `product-card` has a sold-out variant, and Flow 2 walks through it. PRD FR25 confirms. (Worth noting: addendum is a parking lot, not a source of truth, so this divergence is correct, but the UX should be aware.)

### Gaps (qualitative ideas not yet in UX)

1. **Inventory freshness framing is absent.** Addendum names this as "a known future need." UX has sold-out *marking* but nothing about *visibility of freshness to the owner* — e.g., a shop that hasn't edited/touched a product in 30 days may look "stale" once Phase 2 reads it. v1 probably shouldn't surface this (per "tool that disappears"), but the addendum's listing-decay mention deserves at minimum an Open Item flag — or an explicit "do not surface staleness in v1" stance — so a future contributor doesn't add an "X days since update" badge.
2. **AI generation cost observability is acknowledged at PRD level (NFR7) but invisible in UX.** Addendum's "AI generation cost controls as posting volume scales" pairs with PRD NFR7 ("system should make generation volume observable so cost can be monitored"). The UX correctly does NOT expose a usage counter to the owner (that would contradict "tool that disappears" and "honest about unknowns"). But this *decision* — "we deliberately don't show generation counts to the owner, even if we have them" — is not recorded anywhere. If "show how many generations you've used" gets proposed later, the defensive line is missing.
3. **Monetization-parked context has no UX handle, and that's probably correct.** Addendum notes "locos is free for now." UX correctly does not surface billing, plans, or limits. No gap here, but worth confirming that "no quotas, no caps" survives into design intent — DESIGN.md could add one defensive Don't ("Don't show 'X of N generations remaining'" type meters).

---

## 3. PRD (`prd-locos-2026-07-10/prd.md`)

### Overlaps (UX already captures)

- **Counter-metrics posture (CM1/CM2/CM3) are deliberately NOT user-visible.** UX has no "you abandoned X generations" or "you regenerated Y times" surfaces. Aligns with PRD's "watch for harm" framing — these are internal, not shop-facing. Also aligns with brief's "honest about unknowns."
- **Sold-out flow.** PRD FR25 + FR17 ("never edits/deletes FB post") are honored in EXPERIENCE.md Flow 2 climax ("locos listing and Facebook post both remain… does not retroactively edit the FB post").
- **Phase 2 deferrals.** Search, watermark, discovery link, multi-channel — all out per EXPERIENCE.md.Phase scope.
- **No self-service signup.** EXPERIENCE.md.Auth model ("Phone-number OTP only… No self-service signup, no password") matches FR1/FR4.
- **Edit-then-republish path.** PRD FR23 + FR16 + FR17 are reflected in `fb-republish` ("Đăng lại lên Facebook — visible whether previously posted or not. Always creates a new post").
- **SM2 repeat-use framing.** UX's absence of streaks/nudges (and the rationale "earns repeat use on its own quality") matches the PRD's "Posting frequency: average products published per active shop per week" — measured internally, not forced.

### Gaps (qualitative ideas not yet in UX)

1. **CM3 ("Facebook post failures: any non-zero baseline") has a UX handle, but CM1 and CM2 don't — and that asymmetry isn't articulated.** The UX *does* surface FB publish failure (status pill + "Đăng lại") because it's owner-actionable. It does NOT surface generation-abandonment or regen-churn because nothing the owner can do would change. This asymmetry — "we surface failures you can act on, we hide metrics you can't" — is an *honest-about-unknowns* principle in action, but it's not named in DESIGN.md or EXPERIENCE.md. A reviewer could later propose "your generation success rate" or "you regenerate 3× on average" widgets without seeing why those break the brief.
2. **PRD-OQ1 (regen cap) is parked as "defer as PRD planned," but the UX's per-image regen design (cheap per regen) is the *reason* the cap can stay uncapped.** EXPERIENCE.md.Open Items notes the cost concern is "lowered… by per-image regen" but doesn't restate the brief/PRD's framing that the tool must NOT ration the value. This is the operational meaning of "Tool-first, do the chore for them" and deserves to be a principle line, not just an open item.
3. **"Self-contained FB post" (PRD FR18) is implemented but the brand-voice implication isn't.** PRD says "Each Facebook post is self-contained: it includes the generated images, the Vietnamese caption, and the shop's contact information, so a shopper needs nothing beyond the post to reach the shop." EXPERIENCE.md captures this in Flow 1 climax but DESIGN.md has no declarative rule about *what the FB post carries or doesn't carry*. A defensive line ("FB post is owner-content only; no locos branding, no CTA back to locos, no link") would prevent a future contributor from adding a "View on locos.vn" footer to the post copy.

---

## 4. Cross-Source Summary

The spines are well-built on the *functional* axis — FRs, NFRs, flows, components, accessibility, tokens all line up. Where they get thinner is on the *posture* axis: the strategic "this is not that" statements the brief/PRD make about locos (anti-marketplace energy, no fake metrics, tool-not-platform, don't ration the value) are *embodied* in UX choices but rarely *named* as principles a future contributor can read and apply. A second pair of eyes looking at the spines sees a clean tool. A third pair, scanning for places to add a "share with shoppers" button or a "you're a top shop" badge, sees nothing in the design doc that says "don't."

## 5. Recommended Folds Before Finalize

Three gaps are worth folding in. All are *additions*, not corrections — they cost almost nothing and harden the posture the brief and PRD have already committed to.

### Fold A — Articulate the "don't surface metrics we can't honestly compute" principle
**Source:** Brief §"Honest about the gap" + PRD §3 Counter-metrics posture.
**Suggested landing point:** DESIGN.md, a new short "Principles" subsection near the top (before Brand & Style), or as a final bullet under Do's: "Don't surface shop-side numbers (post counts, generation counts, success rates) to the owner — we don't fake metrics we can't honestly compute. Failures the owner can act on get explicit retry surfaces; metrics they can't move do not appear."

### Fold B — Name the "no rationing" principle operationally
**Source:** Brief §"Tool-first, do the chore for them" + PRD §2 Product Principles + PRD FR12 (no regen cap).
**Suggested landing point:** DESIGN.md, same Principles block as Fold A, or as a final Do bullet: "Generation is the value, not a cost to ration. No generation counters, no remaining-quota meters, no 'spend wisely' copy — even when usage is observable internally." This locks the OQ1 decision in plain language.

### Fold C — Declarative rule on what the Facebook post carries (and doesn't)
**Source:** Brief §"Shopper surface / distribution mechanic" + PRD FR18 + PRD FR19 (no watermark, no discovery link in v1).
**Suggested landing point:** EXPERIENCE.md.Component Patterns, as a behavioral note on `fb-republish`, or DESIGN.md.Do's: "The FB post is owner-content only — title, caption, price, shop contact. No locos watermark, no 'view on locos.vn' link, no CTA back to locos. The post is self-contained because the shopper transacts with the shop, not with us." This is the operational form of "the shop owns the customer."

These three folds take ~10 lines total, survive the existing structure, and turn the *embodied* posture into *named* posture. Nothing else in the reconcile rises to "block finalize"; the rest are observations for the parent's judgment.
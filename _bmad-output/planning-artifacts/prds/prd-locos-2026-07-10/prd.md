---
title: "PRD: locos"
status: final
created: 2026-07-10
updated: 2026-07-10
---

# PRD: locos — Phase 1 (Shop-Owner Posting Tool)

## 1. Overview

locos is an AI-powered posting tool for independent fashion shops in Ho Chi Minh City, built as a value-add on top of an existing business that already supplies these shops. A shop owner uploads a few photos of a new product and a rough description; locos generates a finished listing — a Vietnamese title, marketing copy, a price, and images of a model wearing the product — which the owner can edit, save to their locos catalog, and post to the shop's Facebook Page.

**Phase 1 scope is deliberately the shop-owner tool only.** The shopper-facing discovery search, the distribution loop (image watermark + "discover more around you" link), and any buyer-acquisition effort are all deferred to Phase 2. Published products are still stored in locos's catalog, so Phase 2 search has data to build on.

The strategic logic (from the product brief): locos's **mission is to help our shop customers succeed** and to deepen the parent business's relationship with them. The discovery marketplace is **upside optionality**, not the plan — if it ignites later, wonderful; if it doesn't, the shops still got a genuinely useful tool. Phase 1 wins the shop side because that is *cheap and high-value*: the tool does real work for the owner on day one, with zero shoppers required. Winning shoppers is expensive and deliberately deferred.

## 2. Product Principles

These hold across every requirement below; when a design choice is ambiguous, resolve it toward these.

- **The shop owns the customer.** locos is not a checkout and never inserts itself between a shopper and the shop. Every Facebook post is self-contained (product + shop contact) so the shopper transacts directly with the shop. We never pull shoppers onto locos at the shop's expense.
- **Tool-first, do the chore for them.** The product's job is to remove the content-creation grind. Generating and regenerating is the value we promised, not a cost to ration.
- **Acquisition is the existing relationship.** Shops come through the parent business's trusted channel (accounts are provisioned manually for known customers). That channel is the moat and the go-to-market; the app does not need viral growth mechanics in Phase 1.
- **Honest about unknowns.** Whether locos ever drives buyers to shops is unproven and unmeasured in Phase 1; we don't fake a metric for it. The tool must earn its keep on posting value alone.

## 3. Goals & Success Metrics

**Primary goal:** Get shops actively and repeatedly using the tool to post products.

**Success metrics:**
- **SM1 — Active shops:** number of shops that publish at least one product in a rolling 7-day window.
- **SM2 — Posting frequency:** average products published per active shop per week (repeat use is the truest signal the tool is helping).
- **SM3 — Generation-to-publish conversion:** share of generation sessions that end in a published product (proxy for output quality being "good enough to post").

**Counter-metrics (watch for harm):**
- **CM1 — Abandonment after generation:** share of generation sessions that end without a publish. *Watch for:* sustained elevation, signaling that output quality or trust is wrong.
- **CM2 — Regeneration churn:** average regenerations per successful publish. *Watch for:* persistently high counts signaling the first output is routinely missing the mark. (Some regeneration is expected and welcome — it is the feature.)
- **CM3 — Facebook post failures:** share of publish attempts that fail to reach the connected Page. *Watch for:* any non-zero baseline, or sudden step changes after Facebook API changes.

Deferred (Phase 2): whether locos drives buyers to shops — not measurable in Phase 1, no metric invented here.

## 4. Users & Context

**Primary (and only Phase-1) user — the shop owner.** A wide variety of independent HCMC fashion shops, typically not big chains; small operators who already sell through their Facebook fanpage and feel the content-creation grind. Mobile-first, but also use desktop. Vietnamese-speaking.

Accounts are **provisioned manually** by the locos team (these are known customers of the parent business). There is no public self-service signup.

### User Journey UJ-1 — Publishing a new product

Chi runs a small dress shop in District 3. A new batch of linen dresses arrived this morning.

1. Chi opens locos on her phone, enters her **phone number**, receives an **OTP** by SMS, enters it, and is logged in.
2. (First time only) She connects her shop's **Facebook Page** by logging into Facebook and authorizing locos.
3. She taps "New product," snaps/uploads **a few photos** of the dress, and types a rough description ("linen dress, beige, 350k").
4. locos generates a **Vietnamese title, description, price, and images of a model wearing the dress.** She picks a **female model** in a casual style.
5. The first model image isn't quite right, so she **regenerates**. The second is good. She tweaks the **title** and confirms the **price**.
6. She taps **Publish** — the product is saved to her locos catalog — then taps **Post to Facebook**, and a self-contained post (with her shop's contact info) goes to her Page. A week later she edits the price and **republishes**, creating a fresh post; the old one is left untouched.
7. Later, a dress sells out; she opens her catalog and **marks it sold out.**

## 5. Scope

**In (Phase 1):**
- Phone-OTP login against manually provisioned accounts.
- One-time Facebook Page connection (token exchange).
- Product creation: photo upload + rough description → AI-generated Vietnamese title, description, price, and model-wearing images.
- Model-attribute selection; unlimited regeneration; owner editing before publish.
- Publish to locos catalog; post/republish to the connected Facebook Page (a distinct, always-available action).
- Catalog management: view, edit, delete, mark sold out.
- Responsive web (desktop + mobile), Vietnamese UI.

**Out (Phase 2 / later):**
- All shopper-facing discovery and search.
- Distribution loop: image watermark + "discover more around you" link on posts.
- Any buyer-acquisition effort.
- Channels beyond Facebook (Zalo, Instagram, TikTok).
- Per-channel post customization (Phase 1 uses one default profile).
- Self-service signup, monetization/billing, geographies beyond HCMC, on-platform transactions.

## 6. Functional Requirements

### 6.1 Authentication & Accounts
- **FR1.** The locos team can manually create a shop account; there is no public self-service signup.
- **FR2.** A shop owner logs in by entering their phone number, receiving a one-time passcode (OTP) via SMS, and entering that OTP.
- **FR3.** A successful login establishes a persistent session so the owner is not forced to re-authenticate on every visit. `[ASSUMPTION: session stays valid for ~30 days of inactivity before re-auth is required; exact TTL to confirm.]`
- **FR4.** Only accounts provisioned by the locos team can authenticate; an unknown phone number cannot log in or self-register.

### 6.2 Facebook Page Connection
- **FR5.** A shop owner can connect one Facebook Page by logging into Facebook and authorizing locos; locos exchanges this for a Page access token and stores it for reuse.
- **FR6.** Connection is a one-time action; subsequent publishes reuse the stored token without re-authorization.
- **FR7.** If the stored token becomes invalid/expired, the owner is prompted to reconnect, and publishing to Facebook is blocked until they do. `[ASSUMPTION: reconnect-on-expiry is the desired behavior.]`

### 6.3 Product Creation & AI Generation
- **FR8.** A shop owner can start a new product by uploading a few photos of the item and entering a rough free-text description, optionally including a price.
- **FR9.** From those inputs, locos generates a Vietnamese product **title**, **marketing description**, **price**, and one or more **images of a model wearing the product.**
- **FR10.** The generated model image must depict the **actual uploaded product** recognizably. Perfect visual fidelity is an explicit **soft target, not a hard acceptance gate** for Phase 1 — "good enough that owners publish it" is the bar, watched via CM1 (abandonment) and CM2 (regeneration churn) rather than a fixed fidelity score. Quality is expected to improve as underlying AI improves.
- **FR11.** Before generating, the owner can select **model attributes** (e.g., gender and style/vibe). `[ASSUMPTION: attribute set = gender + a small set of style options. This exact set is a UX blocker — must be resolved before UX design begins (see OQ2); owner: Syle/product.]`
- **FR12.** The owner can **regenerate** images; there is no regeneration cap in Phase 1.
- **FR13.** The owner can **edit** the generated title, description, and price before publishing.
- **FR14.** If the owner provided a price in their description, the generated price defaults to it; the owner can always override. `[ASSUMPTION: user-provided price takes precedence over an AI-suggested one.]`

### 6.4 Publishing
- **FR15.** Publishing a product saves it to the shop's locos catalog.
- **FR16.** Posting to Facebook is a distinct **"Post / Republish to Facebook"** action, **always available** on any product — regardless of whether it has been posted before. Each use creates a **new** Facebook post with the product's current content.
- **FR17.** locos **never edits or deletes** a previously created Facebook post. To reflect an edit on Facebook, the owner republishes, producing a new post.
- **FR18.** Each Facebook post is **self-contained**: it includes the generated images, the Vietnamese caption (title + description + price), and the shop's contact information, so a shopper needs nothing beyond the post to reach the shop.
- **FR19.** Phase-1 Facebook posts carry **no** locos watermark and **no** discovery link (deferred to Phase 2).
- **FR20.** If a Facebook post fails, the owner is clearly notified and can retry (republish); the product remains in the locos catalog regardless.
- **FR21.** Facebook is the only publish destination in Phase 1.

### 6.5 Catalog Management
- **FR22.** A shop owner can view a list of the products they have published.
- **FR23.** A shop owner can edit a product's title, description, price, and images. Edits update the **locos catalog record only**; existing Facebook posts are untouched (see FR17), and changes reach Facebook via republish.
- **FR24.** A shop owner can delete a product from their locos catalog.
- **FR25.** A shop owner can mark a product as **sold out** (distinct from deleting it). A shop owner can also delete any single generated image from a product (Phase-1 UX-required FR-extension; accepted by Architecture via AD-4 tombstone-on-row semantics; addressed in epics Story 3.4 + Story 5.4).

## 7. Non-Functional Requirements

- **NFR1 — Localization:** The UI and all AI-generated content are in Vietnamese.
- **NFR2 — Responsive web:** The app works on both desktop and mobile browsers, with mobile as a first-class experience (owners photograph products on their phones).
- **NFR3 — Scale:** The system is designed to grow to the order of **thousands of shops**, each publishing roughly **one new product per day**. Design target for architecture to size against: **~5,000 active shops and ~5,000 product publishes/day** (plus generation traffic, which runs higher due to regenerations). `[ASSUMPTION: order-of-magnitude design band, not a committed SLA.]`
- **NFR4 — Generation latency:** AI generation should keep the owner in the flow. Design target: **on the order of tens of seconds** per generation; treated as an architecture input rather than an open question. No hard cap is enforced in Phase 1.
- **NFR5 — Security:** OTPs and stored Facebook Page tokens are handled and stored securely; tokens are scoped to the minimum permissions needed to post to a Page.
- **NFR6 — Reliability of publish:** Publishing is resilient — a transient Facebook or generation failure is surfaced and retryable, never silently dropped.
- **NFR7 — Cost awareness:** AI image/text generation carries real per-use cost that the parent business absorbs; the system should make generation volume observable so cost can be monitored as usage grows. (No usage cap in Phase 1.)
- **NFR8 — Data handling:** locos stores shop-owner phone numbers, Facebook Page tokens, generated product content (titles, descriptions, images, prices), and catalog records. Phase 1 needs a clear story for: (a) retention windows — long enough to support the product workflow, short enough that offboarding a shop doesn't leave their content behind; (b) deletion on shop-owner request and on account removal; (c) token revocation when a Page is disconnected. Specifics are owned by architecture; what the PRD needs from the design is that none of these paths are forgotten.

## 8. Dependencies, Assumptions & Key Risks

- **Facebook Graph API** access to post to Pages, including whatever app review / permissions (e.g., page management + content publishing) are required. This is an external gate that could affect timeline. `[ASSUMPTION: Facebook app approval is obtainable for this use case.]`
- **SMS/OTP provider** capable of delivering to Vietnamese mobile numbers reliably.
- **AI generation capability** for both Vietnamese marketing text and product-on-model imagery (provider/model choice is an architecture decision, not fixed here).
- **Manual account-provisioning process** owned by the locos/parent-business team.

**Key Phase-1 risks (named so they aren't silent):**
- **Facebook app review delay or rejection** — pushes the entire FB-posting path. Mitigation: keep the locos catalog publishable without Facebook, so the tool still has standalone value while awaiting approval.
- **AI provider outage or quality regression** — breaks the core generation flow. Mitigation: keep generations observable and retryable; regenerate is already the explicit UX.
- **Vietnamese-text or on-model image quality does not clear the "good enough to publish" bar** — would show up as elevated CM1/CM2. Already instrumented via the counter-metrics.
- **SMS deliverability gaps in Vietnam** — gates login. Mitigation: provider fallback and a manual-backup path for the locos team.
- **Facebook Graph API breaking changes** — would surface as CM3 step changes; resilience built in via NFR6.

## 9. Open Questions

- **OQ1.** Should regeneration ever be capped (cost control), and if so how? Owner: Syle/product. Deferred per decision; revisit when generation cost per shop is observable.
- **OQ2.** **Resolved 2026-07-10.** Model attributes = gender (Nữ / Nam) + style preset (Casual / Chic / Thời thượng / Tối giản). See `ux-locos-2026-07-10/EXPERIENCE.md` component `attribute-row` and epics FR11 mapping. (See FR11.)
- **OQ3.** Facebook Page token-expiry handling specifics and how owners are notified to reconnect. Owner: architecture. (See FR7.)
- **OQ4.** Do we need a lightweight admin view for the team to see which shops are active (for SM1/SM2), or does that live in internal tooling outside the shop app? Owner: Syle/product.

## 10. Assumptions Index

Consolidated view of the inline `[ASSUMPTION]` tags above, for quick review and resolution:

- **A1 (FR3):** Session TTL ~30 days of inactivity before re-auth. *To confirm.*
- **A2 (FR7):** Reconnect-on-expiry is the desired Facebook token behavior.
- **A3 (FR11 / OQ2) — RESOLVED 2026-07-10:** Model attributes = gender (Nữ / Nam) + style preset (Casual / Chic / Thời thượng / Tối giản). See `ux-locos-2026-07-10/EXPERIENCE.md`.
- **A4 (FR14):** Owner-provided price takes precedence over an AI-suggested one.
- **A5 (NFR3):** ~5,000 shops / ~5,000 publishes per day is a design band, not an SLA.
- **A6 (Dependencies):** Facebook app approval for Page posting is obtainable for this use case. *External gate — validate early.*
- **A7 (OQ4):** Success metrics live in internal tooling (e.g., the parent business's existing observability stack), not in the shop-facing app. To confirm.

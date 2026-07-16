---
stepsCompleted: [1, 2, 3, 4, 5, 6]
---

# Implementation Readiness Assessment Report

**Date:** 2026-07-10
**Project:** locos

## Document Inventory

### PRD Files Found

**Whole Documents:**
- `_bmad-output/planning-artifacts/prds/prd-locos-2026-07-10/prd.md` (~15.8 KB, modified 2026-07-10)

**Sharded Documents:**
- None

### Architecture Files Found

**Whole Documents:**
- None

**Sharded Documents:**
- Folder: `_bmad-output/planning-artifacts/architecture/architecture-locos-2026-07-10/`
  - `ARCHITECTURE-SPINE.md` (~23.3 KB, modified 2026-07-10 14:24)
  - `reconcile-sources.md` (~19.2 KB)
  - `reviewer-adversarial.md` (~23.2 KB)
  - `.memlog.md` (sidecar)

### Epics & Stories Files Found

**Whole Documents:**
- `_bmad-output/planning-artifacts/epics.md` (~37.9 KB, modified 2026-07-10, currently staged in git)

**Sharded Documents:**
- None

### UX Design Files Found

**Whole Documents:**
- None

**Sharded Documents:**
- Folder: `_bmad-output/planning-artifacts/ux-designs/ux-locos-2026-07-10/`
  - `DESIGN.md` (~11.1 KB)
  - `EXPERIENCE.md` (~16.9 KB)
  - `prose-review.md`, `reconcile-sources.md`, `structural-review.md` (review sidecars)
  - `mockups/` directory
  - `.working/` directory (in-progress sidecar)

### Brief Files Found

**Whole Documents:**
- `_bmad-output/planning-artifacts/briefs/brief-locos-2026-07-09/brief.md`

## Issues Found

No duplicates detected — each document type exists in exactly one canonical location.

No missing documents — all four required artifacts (PRD, Architecture, Epics, UX) are present.

## Files Selected for Assessment

- PRD: `prds/prd-locos-2026-07-10/prd.md`
- Architecture: `architecture/architecture-locos-2026-07-10/ARCHITECTURE-SPINE.md`
- Epics & Stories: `epics.md`
- UX Design: `ux-designs/ux-locos-2026-07-10/DESIGN.md` + `EXPERIENCE.md`
- (For grounding: `briefs/brief-locos-2026-07-09/brief.md`)

## PRD Analysis

Source: `prds/prd-locos-2026-07-10/prd.md` (final, updated 2026-07-10). Scoped to **Phase 1 (Shop-Owner Posting Tool)** for HCMC independent fashion shops.

### Product Principles (cross-cutting)

- Shop owns the customer — locos is never the checkout.
- Tool-first: generation is the value, not a rationed cost.
- Acquisition via the parent business's trusted channel; no viral mechanics.
- Honest about unknowns — no fake buyer-acquisition metrics.

### Functional Requirements Extracted (25 total)

**6.1 Authentication & Accounts**
- **FR1.** Locos team can manually create a shop account; no public self-service signup.
- **FR2.** Shop owner logs in by phone number + OTP via SMS. `[ASSUMPTION A1: ~30-day session TTL]`
- **FR3.** Successful login establishes a persistent session. *(Note: PRD labels this as the persistent-session requirement; numbering anomaly — PRD reads FR3 = persistence, FR1-FR4 = auth domain.)*
- **FR4.** Only provisioned accounts can authenticate; unknown phones cannot register.

**6.2 Facebook Page Connection**
- **FR5.** Owner can connect one Facebook Page by OAuth and authorize locos to exchange and store a Page access token.
- **FR6.** Connection is one-time; subsequent publishes reuse the stored token.
- **FR7.** If the stored token is invalid/expired, the owner is prompted to reconnect and FB publishing is blocked until then. `[ASSUMPTION A2: reconnect-on-expiry desired]`

**6.3 Product Creation & AI Generation**
- **FR8.** Owner starts a new product: photo upload + rough free-text description, optionally a price.
- **FR9.** Locos generates a Vietnamese title, marketing description, price, and one or more model-wearing images.
- **FR10.** Generated model images must depict the uploaded product recognizably; perfect fidelity is a soft target (CM1/CM2-instrumented, not a fixed score).
- **FR11.** Before generating, the owner can select model attributes (e.g., gender and style/vibe). `[OQ2 — pre-UX blocker; A3: attributes = gender + small style set]`
- **FR12.** Owner can regenerate images; no regeneration cap in Phase 1.
- **FR13.** Owner can edit generated title, description, price before publishing.
- **FR14.** If owner provided a price in the description, the generated price defaults to it; the owner can always override. `[A4]`

**6.4 Publishing**
- **FR15.** Publishing a product saves it to the shop's locos catalog.
- **FR16.** "Post / Republish to Facebook" is a distinct always-available action; each invocation creates a new Facebook post.
- **FR17.** Locos never edits or deletes a previously created Facebook post; edits reach FB only via republish.
- **FR18.** Each FB post is self-contained: images + Vietnamese caption (title + description + price) + shop contact.
- **FR19.** Phase-1 FB posts carry no locos watermark and no discovery link.
- **FR20.** On FB post failure, the owner is clearly notified and can retry (republish); product remains in the locos catalog regardless.
- **FR21.** Facebook is the only publish destination in Phase 1.

**6.5 Catalog Management**
- **FR22.** Owner can view a list of products they have published.
- **FR23.** Owner can edit title, description, price, images; edits update the locos record only; existing FB posts are untouched (FR17); FB changes reach via republish.
- **FR24.** Owner can delete a product from the locos catalog.
- **FR25.** Owner can mark a product as sold out (distinct from delete).

**Total FRs: 25**

### Non-Functional Requirements Extracted (8 total)

- **NFR1 — Localization:** UI and all AI-generated content are in Vietnamese.
- **NFR2 — Responsive web:** Works on desktop and mobile browsers; mobile first-class.
- **NFR3 — Scale:** Design band ~5,000 active shops and ~5,000 publishes/day (plus generation traffic). `[A5 — order-of-magnitude, not an SLA]`
- **NFR4 — Generation latency:** Order of tens of seconds; architecture input, not a hard cap.
- **NFR5 — Security:** OTPs and stored FB Page tokens handled/stored securely; tokens scoped to minimum permissions.
- **NFR6 — Reliability of publish:** Resilient — transient FB or generation failures are surfaced and retryable, never silently dropped.
- **NFR7 — Cost awareness:** Generation volume observable so cost can be monitored. (No usage cap in Phase 1.)
- **NFR8 — Data handling:** Retention windows, deletion on owner request and on account removal, token revocation on Page disconnect — design must not forget these paths. Specifics owned by architecture.

**Total NFRs: 8**

### Additional Requirements & Constraints

**Constraints / Out of Scope (Phase 2):** shopper-facing discovery & search, distribution loop (watermark + "discover more around you"), buyer-acquisition effort, channels beyond Facebook (Zalo, Instagram, TikTok), per-channel post customization, self-service signup, monetization/billing, geographies beyond HCMC, on-platform transactions.

**External dependencies (gating risks):**
- Facebook Graph API access (page management + content publishing permissions, app review).
- SMS/OTP provider for Vietnamese mobile numbers.
- AI generation for Vietnamese marketing text and product-on-model imagery.
- Manual account-provisioning process owned by the locos/parent-business team.

**Named Phase-1 risks:**
- Facebook app review delay/rejection → mitigation: locos catalog must be publishable standalone.
- AI provider outage / quality regression → mitigation: regenerations + observability.
- Vietnamese text or on-model image quality below "good enough" bar → CM1/CM2 instrumentation.
- SMS deliverability gaps in Vietnam → provider fallback + manual backup path.
- Facebook Graph API breaking changes → CM3 step changes; NFR6 resilience.

**Open Questions (must be resolved or accepted before downstream work):**
- **OQ1:** Regeneration cap policy? Owner: Syle/product. (Deferred — revisit when cost per shop is observable.)
- **OQ2:** Model-attribute options beyond gender — pre-UX blocker. Owner: Syle/product. **Must be resolved before UX design.**
- **OQ3:** FB Page token-expiry handling specifics and reconnect UX. Owner: architecture. **Note:** this contradicts the PRD's call-out — FR7 already documents the desired UX, so OQ3 likely needs closure rather than re-litigation.
- **OQ4:** Admin view for SM1/SM2 in shop app vs internal tooling? Owner: Syle/product.

### PRD Completeness Assessment

**Strengths:** Numbered FRs and NFRs, clean Phase-1/Phase-2 scoping, explicit product principles, named counter-metrics (CM1-CM3) tied to specific failure modes, and `[ASSUMPTION]` / open-question tags in line. The product principles make trade-offs resolvable when requirements collide.

**Gaps / risks surfaced:**
1. **Numbering anomaly**: Auth domain reads FR1, FR2, FR3-as-persistence, FR4 — i.e., persistence has been slipped to FR3 within the same numbered list. This is an editorial issue but functional coverage is intact (4 auth requirements).
2. **OQ2 (model attributes) is open** but treated as a pre-UX blocker. Since UX is already produced (`ux-locos-2026-07-10/`), the chosen attribute set should be retrievable from UX artifacts — this needs cross-validation in step 4.
3. **OQ1 / OQ3 / OQ4** are listed as open but several (e.g., FR7 reconnect-on-expiry) already document the desired behavior in FR text. They look like revisit-only open questions; should not block implementation but resolution status should be tracked.
4. **NFRs are soft by design** ("order of tens of seconds," "design band") — fine for Phase 1, but the architecture spine needs to confirm it sizes against these targets explicitly.
5. **No explicit accessibility / internationalization NFRs** beyond Vietnamese UI — out of scope for Phase 1 appears intended but isn't stated.

**PRD is sufficient to drive epic and story coverage validation.** Coverage validation proceeds against the 25 FRs + 8 NFRs above.

## Epic Coverage Validation

Source: `_bmad-output/planning-artifacts/epics.md` (Phase 1, 5 epics, 20 stories plus a Story 1.0 local-dev setup story). Scope note in epics: **application code that runs locally on a developer machine**; hosting/deployment/operator-provisioning deferred to a separate deployment-runbook artifact.

### Epic Inventory

| Epic | Title | Stories | FRs |
|------|-------|---------|-----|
| 1 | Authentication & Account Access | 1.0, 1.1, 1.2, 1.3 | FR1–FR4 |
| 2 | Facebook Page Connection | 2.1, 2.2, 2.3 | FR5–FR7 |
| 3 | Product Creation & AI Generation | 3.1, 3.2, 3.3, 3.4, 3.5 | FR8–FR14 |
| 4 | Publishing to Facebook | 4.1, 4.2, 4.3, 4.4 | FR15–FR21 |
| 5 | Catalog Management | 5.1, 5.2, 5.3, 5.4, 5.5 | FR22–FR25 |

### Coverage Matrix

| FR | PRD Requirement (paraphrase) | Epic Coverage | Status |
|----|------------------------------|---------------|--------|
| FR1 | Manual account provisioning | Epic 1 / Story 1.0 (dev seed stand-in) + Story 1.3 (provisioned-only enforcement) | Covered |
| FR2 | Phone + OTP login | Epic 1 / Story 1.1 | Covered |
| FR3 | Persistent session | Epic 1 / Story 1.2 | Covered |
| FR4 | Unknown phones cannot register | Epic 1 / Story 1.3 | Covered |
| FR5 | One-time FB Page OAuth connection | Epic 2 / Story 2.1 | Covered |
| FR6 | Token reuse at publish time | Epic 2 / Story 2.2 | Covered |
| FR7 | Token expiry → reconnect prompt, FB publishing blocked until reconnect | Epic 2 / Story 2.3 | Covered |
| FR8 | New product start: photos + rough description | Epic 3 / Story 3.1 | Covered |
| FR9 | Generate Vietnamese title, description, price, model images | Epic 3 / Story 3.3 | Covered |
| FR10 | Generated model image depicts the product (soft target) | Epic 3 / Story 3.3 (instrumentation via CM1/CM2, NFR7) | Covered |
| FR11 | Model-attribute selection before generation | Epic 3 / Story 3.2 | Covered (OQ2 closed in UX, attributes: gender (Nữ/Nam) + style preset (Casual / Chic / Thời thượng / Tối giản)) |
| FR12 | Unlimited per-image regeneration (no whole-batch re-roll) | Epic 3 / Story 3.4 (regenerate-one-image flow) | Covered |
| FR13 | Edit title, description, price before publishing | Epic 3 / Story 3.4 (inline edit surface) | Covered |
| FR14 | Owner-typed price defaults over generated | Epic 3 / Story 3.5 | Covered |
| FR15 | Publish saves to locos catalog | Epic 4 / Story 4.1 | Covered |
| FR16 | Republish always available; each invocation = new FB post | Epic 4 / Story 4.3 | Covered |
| FR17 | Locos never edits/deletes existing FB posts | Epic 4 / Story 4.3 (CI grep test) + AR-3 | Covered |
| FR18 | Self-contained FB post (images + caption + shop contact) | Epic 4 / Story 4.2 | Covered |
| FR19 | No watermark, no discovery link on Phase-1 posts | Epic 4 / Story 4.2 | Covered |
| FR20 | Publish failure surfaced & retryable; locos catalog safe | Epic 4 / Story 4.4 | Covered |
| FR21 | Facebook is the only publish destination in Phase 1 | Epic 4 / Story 4.2 (implicit — no adapter for any other channel) | Covered |
| FR22 | Catalog list view | Epic 5 / Story 5.1 | Covered |
| FR23 | Edit product (catalog record only; FB via republish) | Epic 5 / Story 5.3 | Covered |
| FR24 | Delete product from locos catalog | Epic 5 / Story 5.5 (tombstone-on-row) | Covered |
| FR25 | Mark sold out + delete-generated-image extension | Epic 5 / Story 5.4 (sold-out) + Epic 3 / Story 3.4 (image delete via UX-DR12) | Covered (FR-extension acknowledged in PRD §6.5) |

### NFR Coverage in Epics

| NFR | Where addressed |
|-----|-----------------|
| NFR1 Vietnamese UI/content | All Vietnamese copy in ACs (UX-DR20); Intl.NumberFormat('vi-VN', …) for VND (Stories 3.5, 5.x) |
| NFR2 Responsive web | UX-DR3, UX-DR4, Story 3.1 (direct camera on mobile), Story 5.1 (responsive grid breakpoints) |
| NFR3 ~5,000 shops / ~5,000 publishes/day | Implicit via architecture (AR-1 hexagonal, AR-2 async jobs, AR-5 multi-tenant). **Not explicit in any story AC** — sizing concern, not a behavior gate. |
| NFR4 Async generation, "tens of seconds" | Epic 3 / Story 3.3 (async job, polling ≤3s, skeleton UI) |
| NFR5 Security (OTP + token handling) | AR-7 (Clerk owns identity; locos stores no phone/OTP), AR-8 (encrypted tokens), Stories 1.1 (Clerk OTP), 2.2 (decryption closure) |
| NFR6 Reliability of publish | AR-9 (cross-unit atomic writes), AR-11 (publish state machine), Story 4.4 (failure surface) |
| NFR7 Cost awareness | AR-13 (event emission); Story 3.3 emits `generation_started/completed/failed` (volume observable) |
| NFR8 Data handling (retention, deletion, token revocation) | Story 5.5 (tombstone-on-row), Story 5.3 (edit propagates via republish only), Story 2.3 (token re-issuance revoke path via store-replace) — specifics owned by architecture |

### Missing Requirements

**None.** All 25 FRs are mapped to an Epic + Story in the epics' FR Coverage Map. All 8 NFRs are addressed, mostly through architecture invariants (AR-*) rather than per-story ACs — appropriate since NFRs in this PRD are design bands rather than behavioral gates.

### Observations (non-blocking)

1. **Story 1.0 is a local-dev setup story**, not a feature story. Its inclusion in Epic 1 is pragmatic for the local-only scope called out in the epics' overview. Acceptable as a Phase-1 ground for the dev cycle; should be retired (or split into deployment-runbook) before hosting phase.
2. **FR11 closed OQ2:** the epics adopt gender (Nữ/Nam) + a four-style preset (Casual / Chic / Thời thượng / Tối giản). This pre-UX blocker has therefore been resolved between PRD and epics — but neither PRD OQ2 nor epics records the resolution explicitly. **Recommendation:** update PRD OQ2 to "Resolved — see epics FR11 mapping" before sprint planning, to keep the source-of-truth clean.
3. **FR12 vs Story 3.4 split**: the FR coverage map lists FR12 against Story 3.4, which is the "generation result + inline edits" story (not a dedicated regen story). Story 3.4's AC does include per-image regen via the `image-action-overlay`'s "Tạo lại" button. Coverage is real but visually compressed; a future micro-story could split regen from inline-edit cleanly.
4. **FR25 split** is correctly documented in the FR Coverage Map footnote ("FR-extension flagged by UX and accepted by Architecture via AD-4"). OK.
5. **NFR3 scale is implicit.** No story AC says "sustain 5,000 shops / 5,000 publishes." Architecture sizing is the enforcement surface; sprint planning should confirm this is sized in, not deferred silently.

### Coverage Statistics

- **Total PRD FRs:** 25
- **FRs covered in epics:** 25
- **Coverage percentage:** 100%

**No missing requirements.** Proceeding to step 4 (UX alignment).

## UX Alignment Assessment

### UX Document Status

**Found.** Two top-level docs + 2 HTML mockups + sidecar reviews at `_bmad-output/planning-artifacts/ux-designs/ux-locos-2026-07-10/`:
- `DESIGN.md` (final, 2026-07-10) — visual identity (colors, typography, spacing, components)
- `EXPERIENCE.md` (final, 2026-07-10) — behavioral spine (IA, voice, state patterns, flows)
- `mockups/mock-catalog.html`, `mockups/mock-generation-result.html`
- `imports/` is empty (no upstream imports).

Architecture frontmatter explicitly `binds: PRD-FR1..FR25, PRD-NFR1..NFR8, UX-IA surfaces` — sources include both UX docs.

### UX ↔ PRD Alignment

| PRD Anchor | UX Treatment | Status |
|------------|--------------|--------|
| FR2 (phone + OTP) | `phone-input` + `otp-cell` components, ARIA-correct | Aligned |
| FR3 (persistent session) | NFR-driven; UX assumes cookie-backed Clerk session | Aligned (implementation via Clerk) |
| FR5/6/7 (FB Page connection + reuse + reconnect) | `connect-fb-prompt`, Flow 3 reconnect, status-pill warning | Aligned |
| FR8 (new product: photos + description) | New Product step 1: `photo-tile` (max 6, camera-direct) + `description-input` | Aligned |
| FR9 (Vietnamese title/description/price/images) | "Vietnamese UI" foundation, Intl.NumberFormat for VND | Aligned |
| FR11 (model attributes) | `attribute-row`: gender (Nữ/Nam) + style preset (Casual / Chic / Thời thượng / Tối giản). **OQ2 resolved in UX.** PRD still listed as open. | **Open — minor** |
| FR12 (per-image regeneration) | `image-action-overlay` "Tạo lại" → re-rolls single image | Aligned |
| FR13 (edit title/desc/price) | `editable-title` / `-description` / `-price` | Aligned |
| FR14 (price default from description) | `editable-price` defaults to parsed description price; empty invalid | Aligned |
| FR16/17 (republish available; never edit/delete FB) | `fb-republish` always visible; no edit/delete surface | Aligned |
| FR18/19 (self-contained post; no watermark/discovery link) | "Đăng lên Facebook" body matches shop content only | Aligned |
| FR20 (failure surfaced; locos catalog safe) | `status-pill failed` + "Đăng lại" affordance; `connect-fb-prompt` variant | Aligned |
| FR22 (catalog list) | Catalog grid; responsive breakpoints 1/2/3 columns | Aligned |
| FR23/24 (edit/delete product) | Product Detail action surface; tombstone-on-row | Aligned |
| FR25 (mark sold out + delete generated image) | `sold-out-toggle` + `image-action-overlay`'s "Xoá" button. **Image-delete is a UX-required FR-extension; flagged in UX doc but not yet added to PRD.** | Aligned at UX+epics; PRD should be amended. |
| NFR1 (Vietnamese) | "All UI in Vietnamese"; "Vietnamese formatting" | Aligned |
| NFR2 (responsive web) | 480px column, breakpoints, pull-to-refresh | Aligned |
| NFR3 (5K shops / 5K publishes) | Not UX-observable | N/A |
| NFR4 (tens-of-seconds latency) | Generation skeleton tiles + polling; UX explicitly accepts async | Aligned |
| NFR5/8 (security, data handling) | No PII surfaces; tombstone-on-row semantics implicit via state | Aligned |
| NFR6/7 (resilience, cost awareness) | Failure affordance per surface; no cost counter in UI (per UX "Don't"s) | Aligned |
| PRD-OQ1 (regen cap) | UX confirms per-image regen (cheap per regen) → defer as PRD planned | Aligned (deferred) |
| PRD-OQ3 (FB token-expiry UX shape) | Flow 3 covers UX; specifics passed to architecture | Aligned |
| PRD-OQ4 (admin view) | Out of UX scope by intent (per Architecture "Deferred" list) | Aligned |
| PRD product principles | UX explicitly inherits: shop owns customer, tool-first, no badge UI, "magic AI" anti-pattern rejected, no streaks | Aligned |

### UX ↔ Architecture Alignment

Architecture's `Capability → Architecture Map` (ARCHITECTURE-SPINE.md §Capability Map) is a direct trace matrix for every PRD capability to a code path under one or more invariants (AD-1..AD-11). Spot-checks:

| UX behavior | Architectural invariant | Status |
|-------------|------------------------|--------|
| Generation is async (UX gen-tile + polling) | AD-2 (HTTP returns `{jobId}` ≤ 2s; UI polls ≤ 3s) | Aligned |
| "Đăng lại lên Facebook" re-creates a new post, never edits | AD-3 (`core/Publishing` exposes only `createPost`) + UX-`fb-republish` | Aligned |
| Per-image regen without breaking the rest | AD-6 (per-image `jobKey`) + AD-4 (content-addressable storage) | Aligned |
| Token reconnect surfaces UI affordance | AD-7 (Clerk-owned auth) + AD-8 (`withDecryptedToken` callback, revocation via `revoke(shopId,pageId)`) | Aligned |
| Tombstone-on-row for delete (image and product) | AD-4 (content-addressable + tombstone-on-row) | Aligned |
| Locos-catalog publish succeeds even if FB disconnected | AD-3 (post body composition) + AD-11 (publish state machine separate from product write) | Aligned |
| Multi-shop isolation | AD-5 (every repository method takes `shopId`) | Aligned |
| Worker-job boundary: every job verifies shop is active | AD-10 (`verifyShopActive(shopId)` as first statement) | Aligned |

### Alignment Issues

**None that block implementation.** All FR and NFR mappings are covered from PRD → epics → UX → architecture. A few housekeeping items are tracked below.

### Warnings / Housekeeping (non-blocking)

1. **PRD OQ2 status stale.** UX has resolved it (gender + four-style preset in `attribute-row`), but the PRD still lists OQ2 as open. **Recommendation: amend PRD §9 OQ2 to "Resolved — see `ux-locos-2026-07-10/EXPERIENCE.md` and epics FR11 mapping" before sprint planning**, so the source-of-truth is clean.
2. **PRD FR-extension (delete generated image) flagged in UX but not yet in PRD.** UX Open Items recommends the PRD add this requirement. Epics have already absorbed it (Story 3.4 + Story 5.4 cover image delete + sold-out). **Recommendation: amend PRD §6.5 to formally include image-delete as part of FR25** (or as a new FR), to keep PRD as the contract source-of-truth.
3. **UX attribute style-preset copy "(names tentative, must read naturally in Vietnamese)".** Acceptable to ship — Phase 1 copy review can iterate, and the names read naturally today. Tracked for the copy-review pass at sprint planning.
4. **UX doesn't enumerate every architectural invariant.** Architecture adds tenants like `cuid2` IDs, VND-as-integer storage, `env.ts` Zod-validated env loader — UX is silent on these because they're invisible to the owner. Expected; no action required.
5. **Architecture OQ3 (token-expiry specifics)** is still open ("who else gets notified, recovery path when reconnect fails"). UX owns the owner-facing prompt (Flow 3); architecture owns the rest. Owner remains `architect` until resolved. Not a Phase-1 blocker.

### Architecture supports UX?

**Yes.** Every UX surface has a documented code path under named AD-* invariants. The hexagonal boundary (AD-1) means UI libraries are cleanly swappable; DESIGN.md's explicit "no shadcn, MUI, Tailwind" requirement is consistent with the architecture's anti-vendor-lock posture but not enforced by any AD (it's a DESIGN.md constraint the dev agent must honor). Acceptable for Phase 1.

Proceeding to step 5 (epic quality review).

## Epic Quality Review

Applied create-epics-and-stories best practices to all 5 epics + 20 stories (Story 1.0 is local-dev setup).

### 🔴 Critical Violations

**None.**

### 🟠 Major Issues

**None.**

### 🟡 Minor Concerns

1. **Story 3.5 (Price default from owner description) is granular to a sub-AC.** The price-default-from-description behavior is a single UX behavior inside the result-and-edit surface. Strict BDD practice would fold it into Story 3.4. Splitting it as a discrete story forces an explicit verification step and a clean AC; defensible. If trimmed, merge into Story 3.4 AC.
2. **Story 1.0 (Local development setup) is developer-experience, not user-value.** The epics' overview explicitly carves this out as a substitute for the deferred deployment-runbook, and the Phase-1 scope is "application code that runs locally on a developer machine." Acceptable here, but it does mean **Epic 1's standalone user value is empty catalog + login** until at least Epic 3 ships — that's normal for incremental delivery; just flag it for sprint planning so the "Epic 1 alone" claim is interpreted accordingly.
3. **Database/entity creation timing not addressed in any AC.** Best practice is each story creates the tables it needs. Architecture has a structural seed (`db/migrations`) and Story 1.0 initializes the dev schema. **Sprint planning recommendation:** confirm the migration strategy. If schema-per-story is desired, add explicit ACs ("this story creates `product` table") to Story 3.1 or 4.1; if all-at-once is desired (current de facto), accept the small deviation.
4. **No CI/CD pipeline story.** Typical greenfield practice is to set up CI early. Architecture mentions a CI grep test (Story 4.3, AD-3) but does not stand up the CI host. Phase-1 scope is local-only, so likely correct to defer; confirm at sprint planning.
5. **PRD numbering quirk carried into epics.** The PRD's 6.1 numbering anomaly (persistence labeled FR3 within an auth block) is reproduced verbatim in the epics' FR Coverage Map (FR1-FR4 are all under Epic 1). Coverage is intact; this is purely cosmetic.

### User-Value Focus Check

| Epic | User-centric title? | User outcome? | Standalone user value? |
|------|---------------------|---------------|------------------------|
| 1 | Yes — "log in with phone + OTP, stay signed in" | Owner can authenticate | Yes (login + persistent session). Empty catalog until Epic 3+. |
| 2 | Yes — "connect FB Page once; reconnect if expired" | Owner can publish to their Page | Indirect — value realized in Epic 4 |
| 3 | Yes — "photos + rough description → finished listing" | Owner can produce a product | Yes — owner can save and edit a product. Full FB publishing in Epic 4. |
| 4 | Yes — "publish to FB; republish always; failures retryable" | Owner can publish and republish | Yes — but requires Epic 3 (product) and Epic 2 (Page) first |
| 5 | Yes — "browse, edit, delete, mark sold-out" | Owner can manage catalog | Yes — but requires Epic 3+4 |

✅ All epics deliver user value. No "setup database" / "create models" / technical milestones.

### Epic Independence Validation

**Backward-only dependencies observed.** No epic references a later epic.

| Epic | Requires prior epics? | Direction |
|------|----------------------|-----------|
| 1 | — | Standalone (with the empty-catalog caveat above) |
| 2 | Epic 1 (must be logged in) | Backward only |
| 3 | Epics 1 + 2 (must be logged in; Page is not required to create a product, only to publish) | Backward only |
| 4 | Epics 1 + 2 + 3 (must have a product and a Page) | Backward only |
| 5 | Epics 1 + 3 + 4 (must be logged in and have products) | Backward only |

✅ No forward references (no Epic N+1 features invoked from Epic N).

### Story Quality Assessment

- **All stories use Given/When/Then format** with explicit, testable outcomes.
- **Story ACs include failure paths** (e.g., Story 1.1 SMS fallback, Story 3.3 total-failure collapse, Story 4.4 retry surface).
- **Architectural invariants are encoded as testable ACs** (Story 2.2 token closure; Story 4.3 grep test for absent `updateFbPost`/`deleteFbPost`/`editFbPost`).
- **Story 1.3 explicitly bans self-service surface** (testable route-scan AC).

✅ Quality is high. ACs are concrete and verifiable.

### Dependency Analysis — Within-Epic

| Story | Depends on | Direction |
|-------|-----------|-----------|
| 1.0 | None (foundational) | — |
| 1.1 | 1.0 (env + Clerk wired) | Backward |
| 1.2 | 1.1 (must log in first) | Backward |
| 1.3 | 1.1 (login flow must exist) | Backward |
| 2.1 | 1.1 (must be logged in) + 1.0 (Clerk wired) | Backward |
| 2.2 | 2.1 (token must exist) | Backward |
| 2.3 | 2.1 (token must exist) + 2.2 (callback must work) | Backward |
| 3.1 | 1.1 (auth) + 1.0 (filesystem storage adapter) | Backward |
| 3.2 | 3.1 (photos + description must exist) | Backward |
| 3.3 | 3.2 (attributes must be selected) | Backward |
| 3.4 | 3.3 (generation must have run) | Backward |
| 3.5 | 3.4 (price field must render after generation) | Backward |
| 4.1 | 3.4 (must have generated images + edited text) | Backward |
| 4.2 | 4.1 (product persisted) + 2.1 (Page connected) | Backward |
| 4.3 | 4.2 (publish pattern must exist) | Backward |
| 4.4 | 4.2 (publish state machine must exist) | Backward |
| 5.1 | 4.1 (products persisted) | Backward |
| 5.2 | 5.1 (catalog routing) | Backward |
| 5.3 | 5.2 (product detail must load) | Backward |
| 5.4 | 5.2 (product detail must load) | Backward |
| 5.5 | 5.2 (product detail must load) | Backward |

✅ All within-epic dependencies are backward (no forward references).

### Special Implementation Checks

- **Starter template:** Architecture does not specify a starter template (no `create-next-app` reference). Story 1.0 ACs include `npm install && npm run db:migrate && npm run db:seed && npm run dev`, which is post-install bootstrapping. Greenfield setup is implicit in Story 1.0. Acceptable; if a strict greenfield setup story is desired, recommend adding a "Story 0" before 1.0 that calls `npx create-next-app@latest` with explicit TypeScript, ESLint, App Router, and tests disabled. Current setup is local-only with explicit deps in Story 1.0, so the integration is straightforward. **YM.**
- **Greenfield indicators:** Story 1.0 covers local dev bootstrap. CI/CD deferred. Logging is `pino` to stdout (Story 1.0 AC). Acceptable for Phase 1.

### Best Practices Compliance Checklist

- [x] Epic delivers user value (all 5)
- [x] Epic can function independently (yes — backward refs only)
- [x] Stories appropriately sized (with one minor over-granularity note on Story 3.5)
- [x] No forward dependencies
- [~] Database tables created when needed (not explicit in ACs — see Minor Concern 3)
- [x] Clear acceptance criteria (Given/When/Then throughout)
- [x] Traceability to FRs maintained (FR Coverage Map explicit)

### Summary

The epics & stories artifact is structurally sound and ready to drive sprint planning, with five minor concerns to acknowledge at sprint planning (one over-granularity, one empty-catalog caveat, one schema-timing question, one missing CI bootstrap, one cosmetic PRD numbering reproduction). None are blocking; all are trackable in a single "sprint-planning decisions" note before Epic 1 / Story 1.0 begins.

Proceeding to step 6 (final assessment).

## Summary and Recommendations

### Overall Readiness Status

**READY.** All four artifacts (PRD, Architecture, Epics, UX) exist, are complete, and form a complete trace matrix. PRD FRs are 100% covered in epics; NFRs are addressed through architecture invariants; UX explicitly binds to the spine and to PRD FRs/NFRs. No critical or major issues block Phase 4.

**One minor housekeeping cycle is recommended before sprint planning begins.** This is a 30-minute exercise — not a planning re-run.

### Critical Issues Requiring Immediate Action

**None.** No critical issues identified.

### Recommended Next Steps

Before sprint planning (closing the housekeeping cycle):

1. **Amend PRD §9 OQ2 → "Resolved — see `ux-locos-2026-07-10/EXPERIENCE.md` and epics FR11 mapping. Attributes: gender (Nữ/Nam) + style preset (Casual / Chic / Thời thượng / Tối giản)."** Keeps PRD as the contract source-of-truth.
2. **Amend PRD §6.5 to formally include image-delete as part of FR25** (or split as a new FR): "Owner can delete any single generated image from a product." Already absorbed by epics Story 3.4 + 5.4; PRD needs to match.
3. **Decide the migration-creation pattern at sprint planning.** Confirm all-at-once (Story 1.0) or schema-per-story. Currently the structural seed treats it as all-at-once — valid for Phase 1 but worth a deliberate decision.
4. **Decide whether Story 3.5 stays separate or folds into Story 3.4.** Either is correct.
5. **Decide whether a CI bootstrap story is needed** before Story 4.3's CI grep test lands. If so, add an Epic 0 / "Story 0.5" between Story 1.0 and 1.1, or add it inline to Story 1.0's AC.

UX-side (low-cost):

6. **Final Vietnamese copy review** of the four style-preset names (Casual / Chic / Thời thượng / Tối giản) before Story 3.2 ships. Acceptable to ship today and iterate; flagging for awareness.

Architecture-side (medium-term):

7. **Resolve Architecture OQ3** (FB token-expiry side-channels: who gets notified, recovery path when reconnect fails) before fb-publish ships in Sprint 4+. Not a Phase-1 blocker for sprint planning itself.

After these housekeeping items:

8. **Commit `epics.md` to git.** Currently staged but not committed. Sprint planning should run from a clean working tree.
9. **Proceed to `bmad-sprint-planning`** (skill `bmad-sprint-planning`). This will produce the ordered sprint plan that `bmad-create-story` (action: `create`) will pull the first story from.

### Minor Concerns Catalog (recap)

| # | Source | Concern | Severity | Action |
|---|--------|---------|----------|--------|
| 1 | PRD | OQ2 marked open but resolved in UX/epics | Minor | Amend PRD §9 |
| 2 | PRD | FR-extension (delete generated image) not in PRD §6.5 | Minor | Amend PRD §6.5 |
| 3 | PRD | Auth domain numbering anomaly (persistence = FR3 within the FR1-FR4 block) | Minor | Cosmetic edit |
| 4 | PRD | No accessibility/i18n NFRs beyond Vietnamese UI; should state out-of-scope intent | Minor | Optional PRD edit |
| 5 | UX | Style preset names marked "(tentative, must read naturally in Vietnamese)" | Minor | Copy review at sprint planning |
| 6 | UX/PRD | Architecture OQ3 (token-expiry side-channels) still open | Minor | Architecture decision before Story 4.2 ships |
| 7 | Epics | Story 1.0 is dev-setup, not user-value | Minor | Acknowledge (already documented in epics overview) |
| 8 | Epics | Story 3.5 granularity vs Story 3.4 | Minor | Decide at sprint planning |
| 9 | Epics | Migration-creation timing not in ACs | Minor | Decide at sprint planning |
| 10 | Epics | No CI/CD pipeline story | Minor | Decide at sprint planning |

### Issue Counts by Category

- **Document inventory:** 0 issues (no duplicates, no missing artifacts)
- **PRD analysis:** 5 minor concerns
- **Epic coverage:** 0 missing FRs (25/25 covered); 0 missing NFRs; 5 minor observations
- **UX alignment:** 0 blocking issues; 5 housekeeping items
- **Epic quality:** 0 critical, 0 major, 5 minor concerns
- **Architecture alignment:** 0 gaps; explicit binding to PRD FRs/NFRs and UX surfaces

**Total issues identified:** ~10 minor concerns across 6 categories. **0 critical, 0 major, 10 minor.** Implementation is **READY** to proceed.

### Final Note

This assessment identified 10 minor concerns across the categories of PRD hygiene, epics' structure, UX alignment, and architecture open questions. None are blocking. The recommended next cycle closes housekeeping in under an hour and lets you move to `bmad-sprint-planning` cleanly. The artifacts as currently committed (or, in the case of `epics.md`, staged) are sufficient to drive Phase 4 implementation.

---

**Assessment complete.** Report saved to `_bmad-output/planning-artifacts/implementation-readiness-report-2026-07-10.md`.

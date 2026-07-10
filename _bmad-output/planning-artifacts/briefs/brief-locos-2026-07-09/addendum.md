---
title: "locos — Brief Addendum"
status: final
created: 2026-07-10
updated: 2026-07-10
---

# locos — Addendum

Depth parked out of the main 1-2 page brief body. For downstream use (PRD, architecture, GTM).

> **Sourcing caveat:** The landscape scan below was produced from an AI research agent's training knowledge (through early 2026). Live web search was unavailable in the session, so specific figures (take rates, resale-market sizes, competitor mechanics) are **unverified** and should be re-checked before any external use.

## Competitive / Comparable Landscape

Local-fashion-discovery is a thin field; nearest analogs come from adjacent spaces:

- **Google Shopping "available nearby" / local inventory ads** — filters retail to a radius, surfaces in-store stock. Aggregates existing retailer feeds rather than being a shop-first discovery surface.
- **Yelp** — proximity + category discovery, strong local SEO, but not commerce-native or product-level.
- **Nextdoor "For Sale" / Local Finds** — neighborhood commerce feed; mostly secondhand one-off listings, no shop inventory.
- **Faire** — connects independent boutiques with brands, but B2B wholesale; "geography" is a shipping zone, not shopper proximity.
- **Vinted / Depop / Poshmark** — peer-to-peer resale fashion; no physical shops, no local-shop geo angle.
- **Instagram Shopping / TikTok Shop** — discovery-led social commerce, but no "physically available near me" filter. These are also locos's real *behavioral* competition for shopper attention.
- **GOAT** — local-availability for resale sneakers; closest "fashion + proximity" analog.

**locos's distinct position:** shop-first (real independent boutiques as supply), tool-led acquisition, proximity-native discovery, non-transactional.

## Known Hard Problems in Hyperlocal Marketplaces

- **Two-sided cold start.** Standard fix: seed supply first, city-by-city, and use the marketplace as the sales pitch. locos's parent-business channel is a stronger version of this.
- **Inventory freshness.** Listings go stale as items sell. Tactics used: structured catalogs, auto-decrement on SKU, daily sync nudges, decay scoring in ranking, treating listings as ephemeral.
- **Geographic density.** A launch zone needs a minimum threshold of shops and shoppers before results feel non-empty. Tactic: launch micro-dense neighborhoods first.

## Business-Model Norms (locos is free for now — parked for future reference)

- **Commission / take rate:** ~8-15% typical for transactional local marketplaces.
- **Merchant subscriptions:** recurring SaaS for the storefront side, often subsidizing the marketplace commission.
- **Promoted listings / ads:** ranking-slot sponsorship — usually the highest-margin revenue once organic supply is dense.
- **Hybrid trend:** free buyer side, freemium listings, commission on sales, plus paid placement.

Relevance to locos: if monetization is revisited, natural fits are **promoted placement among shops** and **premium tool features** (per-channel customization, unlimited regenerations).

## Deferred / Later-Phase Notes

- Per-channel post customization (v1 uses one default profile).
- Listing-freshness / sold-out handling.
- AI generation cost controls (quotas/caps) as posting volume scales.
- A designed method for approximating buyer-lift attribution.
- Shopper-acquisition strategy (Phase 2).

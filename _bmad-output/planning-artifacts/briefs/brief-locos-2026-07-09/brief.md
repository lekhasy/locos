---
title: "Product Brief: locos"
status: final
created: 2026-07-09
updated: 2026-07-10
---

# Product Brief: locos

## Executive Summary

**locos is an AI-powered posting tool for independent fashion shops — and it quietly builds a map of local fashion underneath them.** A shop owner snaps a few photos of a new product, adds a rough description, and locos generates a polished listing: a clean title, marketing copy, a price, and images of a model wearing the item. One click publishes it to the shop's Facebook fanpage (and other channels) *and* to locos.vn. What used to take a photoshoot and an afternoon of caption-writing now takes minutes.

locos is deliberately **not** a bet-the-company venture. It is a value-add tool built on top of an existing business that already supplies these shops. The mission is to help our shop customers succeed and deepen that relationship. The local-discovery marketplace — shoppers searching for fashion near them — is real, but it is **upside optionality**: if the network effect ignites, wonderful; if it doesn't, our customers still get a genuinely useful tool, and our core relationship gets stickier.

That framing is also locos's structural advantage. Every local marketplace dies from the same disease: no shops will list for an empty audience, and no shoppers will come to an empty catalog. locos sidesteps it. Shops don't come to "join a marketplace" — they come for a tool that does a real chore for them: valuable on day one, with zero shoppers. And because we already have a trusted channel to these shops, we can seed supply cheaply where everyone else has to buy it. The listing on locos is a byproduct of the shop doing something it already wanted to do.

## The Strategic Bet

The economics drive the whole design: **pulling shops onto locos is cheap; pulling shoppers onto locos is expensive.** Shops come willingly because the tool saves them real time and money. Shoppers, meanwhile, already discover fashion by scrolling Facebook, TikTok, and Instagram — changing that habit costs marketing money we're choosing not to spend yet.

So the sequencing is intentional:

- **Phase 1 (now):** Win the supply side. Get shops using the tool regularly. Under-invest, on purpose, in shopper acquisition.
- **Phase 2 (later):** Once local inventory is dense, figure out how to pull shoppers in — including switching on the distribution loop (image watermark + "discover more around you" link) that turns shop marketing into locos reach.

Everything below should be read through that lens. When locos looks "thin" on the buyer side, that is a decision, not an oversight.

## The Problem

**For the shop owner (our primary user).** Small independent fashion shops in Ho Chi Minh City live and die on their Facebook fanpages. But producing content that sells is a grind: good product photos, a model to show the fit, a caption that converts, a price — then re-posting it all across their channels. Most can't afford models or photographers, so their listings look amateur and convert worse than they should.

**For the shopper (secondary, for now).** There's no good way to find fashion in nearby shops. Discovery is scattered across hundreds of fanpages you'd have to already follow — and if you want "a white linen dress somewhere near me today," Facebook's feed can't answer it: it shows what you follow, not what's around you.

## The Solution

**The shop-owner tool (the wedge).**
1. Shop owner takes a few photos of the product and writes a rough description (optionally including a price).
2. locos's AI generates a finished listing: title, marketing description, price, and images of a model wearing the product.
3. The owner can edit the title / description / price and regenerate the images until it's right.
4. One click publishes to locos.vn and auto-posts to Facebook and other channels.

For auto-posted channel content, v1 uses a single basic "default profile." Per-channel customization comes in a later phase.

**The distribution mechanic (Phase 2).** In v1, the Facebook post is **self-contained** — it has everything a shopper needs (the product and the shop's contact info), so no one has to visit locos to buy. locos is not a checkout. Later, when we turn to shopper acquisition, every generated image gains a `locos.vn` watermark and each social post gains a short "discover more around you" link — turning each shop's own marketing into free reach for locos. That loop is deferred with the rest of the demand side.

**The shopper surface (deliberately lightweight for now).** A shopper shares their location and types a search. locos returns matching products from all nearby shops within a configurable maximum distance. No transactions, no account-heavy funnel — find it, then contact or visit the shop directly.

## What Makes This Different

- **We already have the shops.** The existing supply business gives us a trusted, pre-built channel to seed inventory — the single hardest thing in local marketplaces. This is the real moat. It is not a technical moat, and we won't pretend it is.
- **Tool-first, marketplace-second.** Value lands on day one for the shop, independent of whether any shopper ever shows up. That breaks the cold-start trap.
- **Distribution can be embedded, not bought (Phase 2 lever).** When we switch it on, the watermark + discovery link turn supply-side marketing into demand-side acquisition at zero incremental cost — a ready-made growth loop waiting for the moment we want shoppers.
- **Honest about the gap.** The shopper-side network is unproven and under-built by choice. We're naming it, not hiding it.

## Who This Serves

**Primary — the shop owner.** A wide variety of independent fashion shops in HCMC; typically *not* big chains or large stores. Mostly small operators who already sell through Facebook and feel the content grind.

**Secondary — the local shopper.** Someone in HCMC looking for fashion near them — likely younger and mobile-first, comfortable discovering and buying through social.

## Success Criteria

**Primary signal (supply, what we can measure and control):**
- Number of shops actively using the tool, and **how frequently they post** through locos. Repeat posting is the clearest proof the tool is genuinely helping.
- Retention / relationship strength with our existing supply-business customers.

**Honest open question (demand attribution):**
- Whether locos actually drives more buyers to the shops is currently **not measurable**, and we don't yet have a method for it. We're flagging this as an unknown rather than inventing a metric. A future proxy — discovery-link taps, "contact" or "directions" taps on listings, or shop-reported lift — could approximate it; that's still to be designed.

**Deliberately deferred (demand, Phase 2):**
- Weekly active shoppers, searches, discovery-link engagement. Not a Phase-1 focus.

## Scope

**In (v1):**
- Photo + rough description → AI-generated title, description, price, and model images.
- Owner editing of title/description/price and image regeneration before publish.
- Publish to locos.vn.
- Auto-post to Facebook (and other channels) using a single default content profile.
- Self-contained social posts carrying the shop's own contact info.
- Shopper-side: location + text search returning nearby products from all shops, with a configurable max distance.

**Out (later phases):**
- The distribution loop: `locos.vn` image watermark + "discover more around you" link on social posts (Phase 2, with shopper acquisition).
- Per-channel content customization.
- Any serious investment in shopper acquisition.
- Monetization of any kind.
- Geographies beyond Ho Chi Minh City.
- On-platform transactions or payments.

## Risks & Open Questions

- **Buyer-lift attribution.** We can't yet prove locos sends customers to shops. If shops ask whether locos actually sold anything for them, the posting-convenience value must carry the relationship on its own until we can answer.
- **Demand-side habit is unproven.** The "discover more around you" loop may or may not build real shopper usage. Deferred by design — but it's the thing that decides whether the optionality ever pays off.
- **Inventory freshness.** Fashion sells out fast; stale listings will erode shopper trust once the buyer side matters. v1 has no listing-decay or sold-out handling — a known future need.
- **AI generation cost.** Model-image generation has a real per-use cost, and locos is free — acceptable now as part of the retention play, but worth watching as posting volume grows. The parent business absorbs the cost; v1 has no usage cap.

## Vision

If Phase 1 works, locos becomes the default way independent Vietnamese fashion shops market their products — the thing they reach for every time a new item lands. If the buyer side then ignites, locos becomes the live map of local fashion: open it, share your location, and see what's actually available in nearby shops right now — something no single Facebook feed can offer.

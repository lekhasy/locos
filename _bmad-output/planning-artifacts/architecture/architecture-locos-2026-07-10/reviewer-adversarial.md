# Adversarial Review — Architecture Spine (locos)

**Reviewer posture:** Cynical. I assume two builders each obey every AD to the letter, share no context beyond the spine, and produce code in parallel. Where their code can disagree at runtime, the spine has a hole.

**Scope reviewed:** `/Users/syle/Documents/Github/locos/_bmad-output/planning-artifacts/architecture/architecture-locos-2026-07-10/ARCHITECTURE-SPINE.md`

**Verdict:** **STRUCTURAL-HOLES**

The spine is well-shaped at the core/`ports/`/`adapters/` boundary and nails down several sharp contracts (AD-3, AD-4, AD-6, AD-8). But the spine systematically under-specifies the *coordination* surface between the two unit-owners (Next.js handler and pg-boss worker) — exactly where two builders most plausibly diverge. Eight structural holes, three of which would produce a security incident if both sides "obeyed the rules."

---

## H-1 — Cross-request transaction visibility is unenforced (CRITICAL)

**Scenario.** Builder A writes the Next.js handler for `app/api/products/route.ts` (create product). They wrap two `repository.insert(...)` calls (product row, then a default revision row) in a single Postgres transaction using a Drizzle `db.transaction(...)` — sensible. Builder B writes `jobs/generate-product.ts`; after the AI call lands, it does `repository.loadProduct(shopId, productId)` and `repository.insertRevision(...)`. They do *not* wrap the read+write in a transaction — there's no rule forcing them to. Both obey AD-5 (every repo call carries `shopId`) and AD-1 (no SDK imports in core).

**Consequence.** If Builder A's request handler is mid-transaction committing a `products` row and a `revisions` row, and the worker poll fires at the same instant, the worker can read a `products` row that exists but a `revisions` row that does not yet (or vice versa). The worker writes a new revision with `parent_revision_id` pointing at a row the request handler hasn't yet committed. The user sees "Revision 2 exists" with a broken FK once the request commits — or worse, the request commits but the worker's revision gets orphaned on rollback of an outer request-handler transaction. The spine has no rule about *transaction boundaries* and no rule saying "any write that another unit may read must be atomic with its sibling rows."

**Suggested fix.** New **AD-9 — Cross-unit write atomicity**. Rule: any write to a `shop`, `product`, `image`, or `revision` row that may be read by a unit other than the writer must be committed in a single Postgres transaction with all sibling rows the read depends on. The worker MUST NOT rely on read-after-write from an in-flight Next.js handler; the handler MUST NOT release the row to the job queue before its transaction commits. Enforced via: (a) job payload only carries `shopId`+`productId`+`inputFingerprint`, never the new row id, and the worker fetches the latest committed row inside its own transaction; (b) the Drizzle transaction wrapper is required at every write site that returns a `jobId` to the client.

---

## H-2 — "Shop" has two plausible owners (HIGH)

**Scenario.** The spine lists `core/shop/` for the Shop aggregate but never specifies which unit is the canonical writer. Builder A (Next.js) interprets "shop provisioning" as `app/(auth)/onboarding/route.ts` calling `core/shop/provision.ts` on first Clerk webhook — and writes a `provision()` service. Builder B (worker) writes `core/shop/recompute-usage.ts` because the PRD's cost-observability needs a periodic rollup. Both believe they own the `shop` row. Builder A's webhook handler updates `shop.last_seen_at`; Builder B's worker overwrites it with `null` when computing the rollup because they don't know the column exists.

**Consequence.** Cross-writer invariants on the Shop aggregate silently erode. Worse: the "offboarding" path (`core/shop/offboarding.ts`) is mentioned as a tombstone-on-row, but neither the Next.js route nor the worker entrypoint is named as the caller, so one builder builds the route and the other builds the cron and the two fire in conflicting order.

**Suggested fix.** Strengthen **AD-5** with a sub-rule: *every aggregate has exactly one canonical writer*. State the writers explicitly in the capability map (Next.js handler writes Shop on provisioning + last-seen; worker writes only the derived read-model fields). Alternatively, introduce **AD-10 — Aggregate writer rule**: "Shop is owned by the Next.js app (Clerk webhook + user action). Worker reads Shop only; if it needs derived fields, it writes to a separate read-model table, never to `shops`."

---

## H-3 — `PageToken` boundary is enforceable in principle but not in rule (HIGH)

**Scenario.** AD-8 says "the decrypted token never leaves that adapter's stack frame." Builder A writes `adapters/facebook/graph-client.ts` correctly — decrypts inside, calls FB, discards. Builder B is implementing the same flow in a *test* under `app/api/products/[id]/fb-post/route.ts` and decides that "for dev" they need to log the token; they add `console.log(decrypted)` inside the route handler. AD-8 says "the decrypted token never leaves that adapter's stack frame to be logged or persisted in plaintext" — but that's about *the adapter*; the rule doesn't say "no code path outside `adapters/facebook/` may decrypt." AD-8 implicitly assumes there's only one place that decrypts, but the spine never says *the route handler must not hold a decrypted token*. If Builder B's Next.js handler happens to call a *different* FB SDK helper that Builder C wrote and put in `lib/` (not `adapters/`), the encrypted column can be read in clear text outside the adapter boundary.

**Consequence.** A plaintext token ends up in application logs (which pino ships to a local file on the WSL host). The encryption-at-rest invariant is silently broken.

**Suggested fix.** Strengthen **AD-8** with a sharper rule: *only `adapters/facebook/` may import `ports/PageTokenRepository`*. State that any code outside `adapters/facebook/` may not hold a decrypted token reference (it must be passed as opaque bytes that the FB adapter interprets). Add a lint rule (or a `ports/PageTokenRepository.load` return type) such that `load()` returns the ciphertext to *any* caller except `adapters/facebook/`, where it returns the decrypted token. Alternatively, define `ports/PageTokenRepository` to expose only `withDecryptedToken(shopId, pageId, fn: (token) => Promise<T>): Promise<T>` — no caller ever holds the token.

---

## H-4 — Auth on worker jobs is mentioned but not bound (HIGH)

**Scenario.** The conventions table says "background worker jobs receive `shopId` as a job argument and re-check via the auth adapter (no silent bypass for scheduled jobs)." Builder A reads this and adds `await auth.getCurrentShop(shopId)` at the top of `jobs/fb-publish.ts`. Builder B reads the same line and interprets "re-check" as "verify the shopId is non-empty and matches the job argument's type" — they don't actually call Clerk. Both believe they satisfied the rule. Even more pernicious: the spine never says *what* the worker is checking against. The shop could have been offboarded (tombstoned) between job submit and job execution, or the Clerk user could have been deleted.

**Consequence.** A scheduled republish for an offboarded shop fires anyway. Or a worker job for `shopId=foo` fires after `foo` was deactivated. No way to distinguish "rule satisfied" from "rule satisfied in spirit" — both are "re-check via the auth adapter" at the word level.

**Suggested fix.** Promote the conventions row to a standalone **AD-7b — Worker-job authentication**: every pg-boss job MUST, as its first non-logging statement, invoke `ports/Auth.verifyShopActive(shopId)` and abort with `DomainError: ShopInactive` if it returns false. Spell out the failure mode (offboarded shop, deleted Clerk user, mismatched clerk_user_id vs the shop's stored `clerk_user_id`). Make it a load-bearing invariant with a bound NFR.

---

## H-5 — Generation idempotency vs. concurrent edit (HIGH)

**Scenario.** Shop owner submits a generation at 12:00:00 with description = "red dress". Worker picks it up at 12:00:05. At 12:00:04 the shop owner edits the description to "blue dress" in `app/(shop)/products/[id]/page.tsx` (FR13 — edit title/description/price). The current revision row now points at "blue dress". The job's `inputFingerprint` was hashed from the "red dress" text, so the idempotency key is stable — but the worker, when it goes to write the new revision, reads `currentRevisionId` (now "blue dress") and persists the generated images *against the blue-dress revision*, throwing away the relationship to the red-dress state the user actually asked to generate from.

**Consequence.** The user sees "red dress was generated" but the new revision row is tied to "blue dress." The shop owner doesn't notice until they look at revision history. Or worse — if the worker's idempotency-key includes the revision id (an alternative interpretation of `inputFingerprint`), every edit causes a new generation, defeating the idempotency.

**Suggested fix.** Strengthen **AD-6** with: the `inputFingerprint` MUST be computed by core at job-creation time and stored *in the job payload* alongside the snapshot of the inputs (description text, image reference, etc.). The worker MUST write the new revision against the snapshot's `revisionId`, not against `currentRevisionId` read at execution time. Additionally: an edit between job-submit and job-execution MUST NOT cancel the in-flight job, but MUST record the user-visible state as "regenerated against older content" (or similar) so the shop owner can see the discrepancy. Spell out the interaction with FR13.

---

## H-6 — Content-addressable collisions across shops (HIGH)

**Scenario.** Two shops upload byte-identical images (e.g., the same manufacturer-supplied product photo). AD-4 says files are named by sha256 of the bytes. Both rows now point at `originals/<same-sha>.jpg`. Shop A offboards (NFR8 — "deletes gated by adapter-level soft-delete"). The offboarding logic deletes the underlying bytes because "no row references this image anymore" — but Shop B still has a `product_images` row pointing at the same path. The path is a tombstone with no bytes behind it; Shop B's regenerate and view flows 404.

**Consequence.** Catastrophic data loss for any unrelated shop whose upload collides. This is the classic content-addressable-storage ownership problem.

**Suggested fix.** Strengthen **AD-4** with an explicit ownership rule. Two options: (a) namespace by shop: `originals/{shopId}/{sha256}.{ext}` (gives up some of AD-4's flatness but solves the problem); or (b) keep flat names but add a reference-count column in the image row; deletion decrements and only removes bytes when count==0; offboarding soft-deletes the row but bytes are removed only when the count crosses zero. Either way, make it explicit. Today AD-4 prevents byte drift but doesn't prevent byte loss.

---

## H-7 — Repository signatures don't prevent cross-shop reads; AD-5 is parameter-shaped, not authz-shaped (MEDIUM)

**Scenario.** A future builder writes `core/audit/cross-shop-rollup.ts` for NFR7 cost observability. They add a `repository.loadAllProducts()` method whose signature is `loadAllProducts(filters)` — no `shopId` because the *purpose* is cross-shop. They argue this is "audit, not application data." AD-5's text says "every `core/` data access goes through repositories whose method signatures take `shopId` as a required argument. There is no 'load by primary key' at the core — only 'load this shop's X.'" The new method bypasses both clauses (it does take a parameter list, just not `shopId`). AD-5 has no enforcement hook.

**Consequence.** A future cross-shop read lands in production. The spine says "no cross-shop reads today" but doesn't make that a structural rule.

**Suggested fix.** Strengthen **AD-5** with: "The set of repository methods is closed. Adding a method that does not take `shopId` is an architectural change that requires an ADR; a code-review check (e.g., custom ESLint rule: `core/**/repositories/*.ts` must declare `shopId` as the first parameter of every exported function) makes this an automatic reject." Alternatively, add **AD-11 — Cross-shop reads are forbidden at the type level**: the `core/` layer does not import `pg` or Drizzle directly, and any cross-shop read must live outside `core/` (e.g., in a separate `internal/` adapter gated by an environment flag).

---

## H-8 — FB publish failure modes not enumerated (MEDIUM)

**Scenario.** AD-3 is excellent on the create-post rule but the spine doesn't enumerate what `create-post.ts` does on a stuck API call (FB returns neither success nor failure within a reasonable timeout), on a successful publish whose `postId` we then drop (e.g., the worker crashes between receiving the response and writing the row), or on FB rate-limiting after 10 republishes of the same product. Builder A might handle the stuck case by treating it as a retry — which conflicts with AD-3 if a partial-side-effect post was actually created. Builder B might write the locator best-effort and lose it on crash.

**Consequence.** Inconsistent state between locos's `fb_posts` table and FB's reality. Either a phantom post (locos doesn't know it exists, but a shopper does) or a missing locator (locos thinks it failed, but a shopper sees the post).

**Suggested fix.** New **AD-12 — FB publish outcome contract**. Spell out: (a) the publish job must write a `fb_publish_attempts` row with status=`pending` *before* the FB API call; (b) on success, status=`published` with `postId`; (c) on confirmed-failure, status=`failed` with reason; (d) on stuck/timeout, status=`unknown` and a separate reconciliation job (out of scope for Phase 1 spine, but enumerated as a deferred item). On republish throttling, the rule is: the worker reads the last successful `postId` and surfaces it to the user; if FB throttles, the worker re-queues with exponential backoff. Without this, two builders will invent two different strategies and neither will match the operator's expectation.

---

## H-9 — NFR7 (cost observability) lives in the capability map, not as an AD (MEDIUM)

**Scenario.** The capability map says `adapters/gemini` + `adapters/fashn` log per-call cost to structured log and `db/aggregate-cost.sql` reads it back. But the spine has no AD requiring per-call cost logging, no AD requiring the schema for the log fields, no AD requiring what counts as "cost" (input tokens? output tokens? FASHN per-image price?). Builder A logs `{provider, model, input_tokens, output_tokens, usd}` from Gemini and `{provider, model, duration_ms, status}` from FASHN (because FASHN doesn't expose per-call price as a number). Builder B logs `{provider, model, ms}` for both. The rollup in `db/aggregate-cost.sql` reads a schema that doesn't exist.

**Consequence.** NFR7 is unenforced. Two builders can disagree silently.

**Suggested fix.** Promote cost observability to **AD-13 — Cost observability**: every AI adapter call MUST emit a structured log record at the end of the call (success or failure) with the minimum field set `{event: "ai.call", provider, model, shop_id, job_id, input_tokens?, output_tokens?, duration_ms, status, cost_usd_or_null}`. The aggregator reads that schema. Bind to NFR7 explicitly. Note that FASHN may need `cost_usd_or_null` because the API may not return price — the rule then says "log null rather than estimate silently."

---

## H-10 — Webhook handler is not enumerated as an adapter surface (MEDIUM)

**Scenario.** PRD FR6 implies a webhook handler for FB Page connection status (the "owner disconnecting a Page from leaving a token row that still works" case in AD-8). The spine lists `app/(shop)/connect-fb/*` for the user-facing flow but does not list a webhook receiver route. Builder A adds `app/api/webhooks/facebook/route.ts` (Next.js route handler). Builder B adds an `adapters/facebook/webhook-listener.ts` (pg-boss job). Both obey AD-1 (Next.js is an adapter boundary; the webhook handler is fine in `app/api/`). The webhook handler in `app/api/` directly decrypts the token to verify the signature — bypassing `adapters/facebook/`. This is the same hole as H-3 but for a different surface.

**Consequence.** Token decryption logic and FB signature verification can end up in two places. AD-1 keeps the *core* clean, but the *adapter boundary* between Next.js handlers and `adapters/` is not enforced for webhook receivers.

**Suggested fix.** Strengthen **AD-1** with: "Any Next.js route handler that performs adapter-level work (webhook signature verification, token decryption, third-party SDK calls) MUST be in `app/api/` and MUST delegate to an `adapters/` module. Webhook receivers are explicitly out-of-scope for route-handler-direct-execution." Or list every webhook receiver route in the structural seed.

---

## H-11 — Retry behavior on publish path is left implicit (MEDIUM)

**Scenario.** PRD NFR6 says "publishing is resilient — transient failures surfaced and retryable." The spine's capability map lists `jobs/fb-publish.ts` but doesn't say whether it self-retries, what counts as "transient," or how retries are exposed to the user. Builder A's `fb-publish.ts` retries 3 times with exponential backoff (silent). Builder B's `fb-publish.ts` fails-fast and surfaces the error to the user. Both obey all 8 ADs.

**Consequence.** Inconsistent UX (one shop sees a successful publish that took 30s; another sees a hard error after 5s for the same FB-side blip). Inconsistent billing (one shop's failed transient attempt still hit FASHN retry if generation was tied to publish, etc.).

**Suggested fix.** Strengthen **AD-3** with a sub-rule: `createPost(productId, currentRevisionId)` retries on declared-transient errors (`FacebookGraphError.transient=true`) up to N=3 with exponential backoff, and surfaces non-transient errors to the caller unchanged. Spell out which FB error codes count as transient (`#5xx`, `#4xx-with-retry-after`, etc., listed explicitly).

---

## H-12 — Image regeneration semantics vs. "stale edit" aren't enumerated (LOW)

**Scenario.** Builder A writes `jobs/regenerate-image.ts` to read `currentRevisionId` at execution time (matches AD-6's idempotency-key-only view). Builder B writes `jobs/regenerate-image.ts` to read the *input fingerprint from the job payload* (the snapshot). These are exactly the two interpretations of AD-6 surfaced in H-5, but for regeneration specifically. The same problem repeats: two builders, two valid readings.

**Consequence.** Same as H-5 — inconsistent behavior depending on which builder wrote first.

**Suggested fix.** Already addressed by H-5's fix. Listed separately because regen and first-generation are two separate jobs in the structural seed.

---

## H-13 — Capabilities map conflates "where it lives" with "who invokes" (LOW)

**Scenario.** The capability map column "Lives in" tells you the file path. The "Governed by" column tells you the AD. There is no column for "who can *trigger* this code path" — the next.js route vs. the worker vs. either. Two builders working on FR7 (token expiry handling) might disagree on whether the expiry check is "Next.js polling on page load" vs. "worker periodic job."

**Consequence.** Conflicting implementations of the same surface.

**Suggested fix.** Add a column "Trigger surface(s)" to the capability map: for each row, list whether it's user-triggered (Next.js route), worker-triggered (pg-boss job), or webhook-triggered.

---

## H-14 — pg-boss workers are in `adapters/pg-boss/jobs/`, but orchestrator functions are in `core/` — the boundary is unclear (LOW)

**Scenario.** `core/publishing/create-post.ts` is listed in the structural seed. `jobs/fb-publish.ts` is listed in `adapters/pg-boss/jobs/`. The spine says "the Next.js app and the background worker are themselves adapters at the boundary — they call into `core/`, not into other adapters directly." This is good. But the orchestrator `create-post.ts` lives in `core/publishing/`, and the worker `fb-publish.ts` calls into it. Builder A writes the orchestrator to do "submit job + return jobId" (Next.js handler use case). Builder B writes the *same file* to do "execute job body" (worker use case) — because both call sites are in scope. Two functions diverge in the same file.

**Consequence.** Single-file, dual-responsibility. Probably caught in review, but architecturally it's a soft spot.

**Suggested fix.** Clarify the structural seed: `core/publishing/create-post.ts` is the *pure orchestrator* (no I/O, no job submission); it returns a plan. `adapters/pg-boss/jobs/fb-publish.ts` is the job handler that executes the plan. The Next.js route calls `core/publishing/submit.ts` (a different file) which produces the job and returns `{jobId}`. State this separation.

---

## H-15 — Deferred item "OQ4 admin view" could re-introduce cross-shop reads (LOW)

**Scenario.** The deferred section lists "OQ4 admin view" but doesn't bind it. A future builder, seeing it as a deferred-but-soon item, might scaffold a Next.js route at `app/admin/*` that calls a `repository.loadAllShops()`. This is exactly the hole H-7 names. The spine acknowledges the risk by deferring but doesn't fence it off.

**Suggested fix.** Add a note to H-7's fix: OQ4, when picked up, requires its own AD that gates admin reads behind a separate auth context (e.g., a `superadmin` role in Clerk) AND keeps the data-access path structurally separate from `core/`.

---

## Summary score

**STRUCTURAL-HOLES.** The spine's core/ports/adapters discipline (AD-1, AD-4, AD-8) is solid. But the spine systematically under-specifies:

- cross-unit transaction boundaries (H-1)
- aggregate-owner rules (H-2)
- adapter-boundary enforcement beyond `core/` (H-3, H-10)
- worker-job auth (H-4)
- idempotency vs. concurrent edit (H-5, H-12)
- storage ownership on collision (H-6)
- publish-failure semantics (H-8)
- retry behavior (H-11)
- cost-observability schema (H-9)
- repository envelope (H-7, H-15)
- capability-map ambiguities (H-13, H-14)

Three of these (H-1, H-3, H-6) would surface as security incidents or data-loss incidents if both builders obeyed the spine as written.

### Suggested additions / strengthening, ranked

1. **AD-9 — Cross-unit write atomicity** (H-1)
2. **Strengthen AD-8** with `withDecryptedToken` envelope or single-importer rule (H-3)
3. **AD-12 — FB publish outcome contract** (H-8)
4. **Strengthen AD-4** with reference-counting or shop-namespacing for collision safety (H-6)
5. **AD-13 — Cost observability schema** (H-9)
6. **AD-7b — Worker-job authentication** (H-4)
7. **Strengthen AD-6** with snapshot-in-job-payload rule (H-5, H-12)
8. **Strengthen AD-5** with method-set closure or lint rule (H-7, H-15)
9. **AD-10 — Aggregate writer rule** (H-2)
10. **Strengthen AD-1** with webhook-receiver rule (H-10)
11. **Strengthen AD-3** with retry semantics (H-11)
12. **Capability map trigger-surface column + structural seed clarification** (H-13, H-14)
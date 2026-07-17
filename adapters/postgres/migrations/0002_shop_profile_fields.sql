-- Story 1.3 — add shop profile fields captured by the sales-rep surface.
-- Spec: Sprint Change Proposal 2026-07-16 Rev C §4.1 / §4.1 AC #9.
--
-- display_name  : the rep-supplied shop name shown on every UI list / detail.
--                 NOT NULL because every shop has *some* display name,
--                 even if the rep enters a placeholder.
-- address       : physical address. NOT NULL DEFAULT '' — an address is
--                 always expressed as a string (even if unknown).
-- contact_phone : shop contact phone. NULLABLE — phone numbers are a
--                 "may not have one yet" field, not a required string.
--                 NULL distinguishes "not provided" from "explicitly empty".
--
-- Existing seed row from migration 0001 stays valid without a backfill.
-- Subsequent creates from /rep/shops/new write real values for all three.
--
-- Tombstone-on-row semantics (AD-4) are unchanged: deleted_at is preserved.

ALTER TABLE "shop"
  ADD COLUMN IF NOT EXISTS "display_name" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "address" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "contact_phone" text;

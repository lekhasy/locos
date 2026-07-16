-- Story 1.0 — initial schema (hand-written; equivalent to `drizzle-kit generate`).
-- Creates the minimum table set: shop, page_token, product.
-- Subsequent stories extend (never drop) this schema.

-- Enable pgcrypto for gen_random_uuid(); swap to app-layer cuid2 for locos ids.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS "shop" (
  "id" text PRIMARY KEY NOT NULL,
  "clerk_user_id" text NOT NULL UNIQUE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);

CREATE TABLE IF NOT EXISTS "page_token" (
  "id" text PRIMARY KEY NOT NULL,
  "shop_id" text NOT NULL REFERENCES "shop" ("id"),
  "page_id" text NOT NULL,
  "encrypted_token" text NOT NULL,
  "scope" text NOT NULL,
  "expires_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "revoked_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "page_token_shop_idx" ON "page_token" ("shop_id");
CREATE INDEX IF NOT EXISTS "page_token_page_idx" ON "page_token" ("page_id");

CREATE TABLE IF NOT EXISTS "product" (
  "id" text PRIMARY KEY NOT NULL,
  "shop_id" text NOT NULL REFERENCES "shop" ("id"),
  "title" text NOT NULL,
  "description" text NOT NULL,
  "original_image_paths" jsonb NOT NULL,
  "generated_image_path" text,
  "price_vnd" bigint NOT NULL,
  "sold_out" boolean NOT NULL DEFAULT false,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "deleted_at" timestamptz
);

CREATE INDEX IF NOT EXISTS "product_shop_idx" ON "product" ("shop_id");
CREATE INDEX IF NOT EXISTS "product_sold_out_idx" ON "product" ("sold_out");

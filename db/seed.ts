/**
 * db/seed.ts — dev seed for Story 1.0 AC #5.
 *
 * Inserts (idempotently):
 *   - one `shop` row linked to a Clerk dev user (placeholder clerk_user_id
 *     — replace after first real Clerk login in dev)
 *   - one encrypted `page_token` row for a dev Facebook Page
 *   - one sample `product` row with placeholder title/desc/price
 *
 * Story 1.0 places the dev fixtures deterministically. Story 1.3 enforces
 * "provisioned-only" login at the Clerk boundary; seed remains the only
 * way to add a phone number to the provisioned list while running locally.
 *
 * Re-runs are no-ops: ON CONFLICT DO NOTHING against deterministic keys.
 */

import sodium from 'libsodium-wrappers';
import { Client } from 'pg';
import { env } from '@/env';
import { describeError, logger } from '@/adapters/logger';

const DEV_SHOP_ID = 'locosdevshop000000000001';
const DEV_PAGE_TOKEN_ID = 'locosdevtoken00000000001';
const DEV_PRODUCT_ID = 'locosdevproduct000000001';
const DEV_CLERK_USER_ID = 'user_dev_clerk_replace_me';
const DEV_PAGE_ID = 'page_dev_facebook_replace_me';

async function encryptToken(plaintext: string, secret: string): Promise<string> {
  await sodium.ready;
  const key = Buffer.from(secret, 'base64');
  if (key.length !== 32) {
    throw new Error(
      `LOCOS_HOST_SECRET must decode to 32 bytes (got ${key.length}). Re-generate with: ` +
        `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`,
    );
  }
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
  const ciphertext = sodium.crypto_secretbox_easy(
    Buffer.from(plaintext, 'utf8'),
    nonce,
    key,
  );
  // Layout: nonce || ciphertext. Caller stores the whole base64 string;
  // the adapter at call time splits at byte 24 to recover nonce + ciphertext.
  return Buffer.concat([nonce, ciphertext]).toString('base64');
}

async function run() {
  const client = new Client({ connectionString: env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('BEGIN');

    // 1) shop
    const shopId = DEV_SHOP_ID;
    const { rowCount: shopInsert } = await client.query(
      `INSERT INTO shop (id, clerk_user_id) VALUES ($1, $2)
       ON CONFLICT (clerk_user_id) DO NOTHING
       RETURNING id`,
      [shopId, DEV_CLERK_USER_ID],
    );

    let resolvedShopId = shopId;
    if (shopInsert === 0) {
      const { rows } = await client.query<{ id: string }>(
        'SELECT id FROM shop WHERE clerk_user_id = $1',
        [DEV_CLERK_USER_ID],
      );
      resolvedShopId = rows[0].id;
    }

    // 2) page_token (encrypted)
    const encrypted = await encryptToken('DEV_FB_PAGE_ACCESS_TOKEN_PLACEHOLDER', env.LOCOS_HOST_SECRET);
    await client.query(
      `INSERT INTO page_token (id, shop_id, page_id, encrypted_token, scope, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [
        DEV_PAGE_TOKEN_ID,
        resolvedShopId,
        DEV_PAGE_ID,
        encrypted,
        'pages_manage_posts',
        new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // +60d placeholder
      ],
    );

    // 3) sample product
    await client.query(
      `INSERT INTO product (id, shop_id, title, description, original_image_paths, generated_image_path, price_vnd)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT DO NOTHING`,
      [
        DEV_PRODUCT_ID,
        resolvedShopId,
        'Váy linen mùa hè — beige tự nhiên',
        'Mẫu dev fixture. Sửa trong Story 1.1 khi có flow publish thực.',
        JSON.stringify(['originals/dev-shop/linen-dress-front.jpg', 'originals/dev-shop/linen-dress-detail.jpg']),
        'generated/dev-shop/linen-dress-model-01.jpg',
        350_000, // VND integer (smallest unit)
      ],
    );

    await client.query('COMMIT');
    logger.info(
      { shopId: resolvedShopId, devClerkUserId: DEV_CLERK_USER_ID },
      'dev seed complete (idempotent)',
    );
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

run().catch((err) => {
  logger.error({ errorMessage: describeError(err) }, 'seed failed');
  process.exit(1);
});

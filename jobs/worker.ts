/**
 * jobs/worker.ts — Graphile Worker entrypoint.
 *
 * Story 1.0 stub: boots the worker, verifies the queue exists, and idles.
 * Handlers land in later stories:
 *   - generate-product  (Story 3.3)
 *   - regenerate-image  (Story 3.4)
 *   - fb-publish        (Story 4.x)
 *
 * Architecture invariant: AD-10 ("Worker-job boundary is explicit. Every job
 * re-verifies the shop.") — first statement of every future handler will be
 * `verifyShopActive(shopId)`. This stub doesn't have shops yet.
 */

import { run } from 'graphile-worker';
import { env } from '@/env';
import { describeError, logger } from '@/adapters/logger';

async function main() {
  logger.info('starting graphile-worker (Story 1.0 stub — no handlers registered yet)');

  const runner = await run({
    connectionString: env.DATABASE_URL,
    concurrency: 1,
    noHandleSignals: false,
    // No taskList in Story 1.0 — handlers attach in later stories.
    taskList: {},
    pollInterval: 1000,
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down worker');
    await runner.stop();
    process.exit(0);
  };

  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error(
    { errorMessage: describeError(err) },
    'worker boot failed',
  );
  process.exit(1);
});

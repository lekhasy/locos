/**
 * pino structured logger — single instance for the whole app.
 *
 * Architecture Consistency Convention:
 *   "Structured JSON: { timestamp, level, trace_id, shop_id, job_id, event, … }.
 *    Never log PII: phone numbers, OTP codes, FB tokens, image bytes, generated
 *    image URLs (signed-URL fragments logged instead, never the full token)."
 *
 * In dev: logs to stdout (JSON). pino-pretty is intentionally NOT bundled to
 * keep the dep tree small — pipe through `npx pino-pretty` if a human-readable
 * stream is desired.
 *
 * LOG_LEVEL comes from `process.env.LOG_LEVEL` (validated in env.ts at boot).
 * We read it indirectly here so this module stays importable from client code
 * — `env.ts` transitively imports `@next/env` (uses Node `fs`) which would
 * otherwise pull `fs` into the browser bundle. pino auto-detects LOG_LEVEL
 * from process.env when `level` is not set.
 *
 * Future stories emit metric events through this same logger (AR-13):
 *   shop_login, product_created, generation_started, generation_completed,
 *   generation_failed, regeneration_requested, publish_attempted,
 *   publish_succeeded, publish_failed, reconnect_required,
 *   product_sold_out_toggled.
 */

import pino from 'pino';

export const logger = pino({
  base: { service: 'locos' },
  // In Next.js dev we want readable timestamps and lighter JSON; in prod, full structured.
  timestamp: pino.stdTimeFunctions.isoTime,
  // Redact the obvious PII paths defensively even if a caller slips.
  // Wildcard forms catch nested fields like { err: { phone } } or { data: { otp } }
  // that the top-level paths would miss.
  redact: {
    paths: [
      'phone',
      'phone_number',
      'otp',
      'otp_code',
      'token',
      'fb_token',
      'page_token',
      'access_token',
      '*.phone',
      '*.phone_number',
      '*.otp',
      '*.otp_code',
      '*.token',
      '*.fb_token',
      '*.page_token',
      '*.access_token',
    ],
    censor: '[REDACTED]',
  },
});

export function describeError(err: unknown): string {
  if (err instanceof AggregateError) {
    const details = err.errors
      .map((e) => (e instanceof Error ? `${e.name}: ${e.message}` : String(e)))
      .join('; ');
    return details ? `${err.name}: ${details}` : err.name;
  }
  if (err instanceof Error) return `${err.name}: ${err.message}`;
  return String(err);
}

export const metric = (event: string, payload: Record<string, unknown> = {}) =>
  logger.info({ event, ...payload }, event);

export type Logger = typeof logger;

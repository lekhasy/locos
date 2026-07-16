/**
 * getCurrentShop — domain service for resolving the authenticated shop.
 *
 * AD-1: this function accepts the AuthPort via parameter. `core/` never
 * imports from `adapters/`, so callers (server components, route handlers,
 * server actions) inject the Clerk-backed adapter at the boundary.
 *
 * AD-7: returns `null` for unauthenticated users or when no shop row exists
 * for the authenticated Clerk user. Story 1.3 will tighten the second branch
 * (provisioned-only enforcement); Story 1.1 just reads.
 */

import type { AuthPort } from '@/ports/auth';
import type { Shop } from './shop';

export async function getCurrentShop(authPort: AuthPort): Promise<Shop | null> {
  return authPort.getCurrentShop();
}
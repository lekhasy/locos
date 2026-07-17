import 'server-only';
import { redirect } from 'next/navigation';
import { isSalesRep } from '@/adapters/clerk/rep';

/**
 * Server-side authorization for rep-only actions.
 *
 * The `/rep` layout already redirects non-reps to `/catalog`, so any
 * legitimate browser navigation is covered. Server actions are also
 * endpoints — a determined caller could POST a valid action payload
 * directly without the layout ever running. This guard closes that gap
 * by re-checking `publicMetadata.role === 'sales_rep'` at the action
 * boundary and mirroring the layout's `redirect('/catalog')` on
 * mismatch.
 *
 * Call at the top of every rep-only server action, before any side-
 * effecting port call.
 */
export async function requireSalesRep(): Promise<void> {
  if (!(await isSalesRep())) {
    redirect('/catalog');
  }
}

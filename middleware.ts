/**
 * Clerk middleware — Story 1.1 v3 boundary.
 *
 * AD-7: Clerk owns identity; this is the only place outside `app/layout.tsx`
 * and `adapters/clerk/` that imports Clerk. Everything below reads as:
 *
 *   - Public: /, /login(.*)
 *   - Protected: everything else (catalog, products, connect-fb, …)
 *
 * Story 1.1 v3 dropped the two-step `/login/otp` route in favor of a
 * single-step username + password flow. The `(.*)` matcher for `/login`
 * still covers any future sub-routes if the team adds them; `isAuthRoute`
 * only matches the bare `/login` path so an authed user landing on the
 * login screen is bounced to /catalog.
 *
 * Unauthenticated → protected: redirect to /login.
 * Authenticated → /login: redirect to /catalog.
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/', '/login(.*)']);
const isAuthRoute = createRouteMatcher(['/login']);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (userId && isAuthRoute(req)) {
    return NextResponse.redirect(new URL('/catalog', req.url));
  }

  if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes.
    '/(api|trpc)(.*)',
  ],
};
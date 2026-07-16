/**
 * Clerk middleware — Story 1.1 boundary.
 *
 * AD-7: Clerk owns identity; this is the only place outside `app/layout.tsx`
 * and `adapters/clerk/` that imports Clerk. Everything below reads as:
 *
 *   - Public: /, /login, /login/otp
 *   - Protected: everything else (catalog, products, connect-fb, …)
 *
 * Unauthenticated → protected: redirect to /login.
 * Authenticated → /login or /login/otp: redirect to /catalog.
 */

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/', '/login(.*)', '/login/otp(.*)']);
const isAuthRoute = createRouteMatcher(['/login', '/login/otp']);

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
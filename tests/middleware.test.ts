/**
 * Middleware route-gating tests (Story 1.1, Task 10.2).
 *
 * We can't run Clerk's middleware end-to-end in vitest (it pulls in
 * `next/server` + Clerk's runtime which expect a real Next.js runtime).
 * Instead we replace `clerkMiddleware` with a passthrough that exposes
 * the callback, and replace `createRouteMatcher` with a vi.fn() so we can
 * assert the callback consulted the right matchers.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';

const isPublicRoute = vi.fn();
const isAuthRoute = vi.fn();

vi.mock('@clerk/nextjs/server', async () => {
  const actual = await vi.importActual<typeof import('next/server')>('next/server');
  return {
    clerkMiddleware: (cb: unknown) => cb,
    createRouteMatcher: (patterns: string[]) => {
      // The real matcher is path-to-regexp; we don't re-implement it here.
      // The middleware module captures whatever the matcher returns and uses
      // it as a predicate; for these tests we substitute vi.fn()s.
      return patterns[0]?.startsWith('/login') ? isAuthRoute : isPublicRoute;
    },
    NextResponse: actual.NextResponse,
  };
});

type Cb = (
  auth: () => Promise<{ userId: string | null }>,
  req: { url: string; nextUrl: { pathname: string } },
) => Promise<Response> | Response;

let callback: Cb;

beforeEach(async () => {
  vi.resetModules();
  isPublicRoute.mockReset();
  isAuthRoute.mockReset();
  const mod = await import('../middleware');
  callback = mod.default as unknown as Cb;
});

function makeReq(pathname: string, url = `http://localhost${pathname}`) {
  return {
    url,
    nextUrl: { pathname },
  };
}

describe('middleware route gating (Story 1.1)', () => {
  it('redirects unauthenticated users hitting /catalog to /login', async () => {
    isPublicRoute.mockReturnValue(false);
    const auth = async () => ({ userId: null });
    const res = await callback(auth, makeReq('/catalog'));
    const location = (res as Response).headers.get('location');
    expect(location).toBe('http://localhost/login');
    expect(isPublicRoute).toHaveBeenCalled();
    expect(isAuthRoute).not.toHaveBeenCalled();
  });

  it('redirects unauthenticated users hitting /products/abc to /login', async () => {
    isPublicRoute.mockReturnValue(false);
    const auth = async () => ({ userId: null });
    const res = await callback(auth, makeReq('/products/abc'));
    expect((res as Response).headers.get('location')).toBe('http://localhost/login');
  });

  it('redirects authenticated users hitting /login to /catalog', async () => {
    isAuthRoute.mockReturnValue(true);
    const auth = async () => ({ userId: 'user_dev_clerk_replace_me' });
    const res = await callback(auth, makeReq('/login'));
    expect((res as Response).headers.get('location')).toBe('http://localhost/catalog');
    expect(isAuthRoute).toHaveBeenCalled();
  });

  it('redirects authenticated users hitting /login/otp to /catalog', async () => {
    isAuthRoute.mockReturnValue(true);
    const auth = async () => ({ userId: 'user_1' });
    const res = await callback(auth, makeReq('/login/otp'));
    expect((res as Response).headers.get('location')).toBe('http://localhost/catalog');
  });

  it('lets authenticated users reach /catalog', async () => {
    isPublicRoute.mockReturnValue(false);
    const auth = async () => ({ userId: 'user_1' });
    const res = await callback(auth, makeReq('/catalog'));
    expect(res).toBeInstanceOf(NextResponse);
    expect((res as NextResponse).headers.get('x-middleware-next')).toBe('1');
  });

  it('lets unauthenticated users reach /login', async () => {
    isAuthRoute.mockReturnValue(false);
    isPublicRoute.mockReturnValue(true);
    const auth = async () => ({ userId: null });
    const res = await callback(auth, makeReq('/login'));
    expect((res as NextResponse).headers.get('x-middleware-next')).toBe('1');
  });

  it('lets unauthenticated users reach /', async () => {
    isAuthRoute.mockReturnValue(false);
    isPublicRoute.mockReturnValue(true);
    const auth = async () => ({ userId: null });
    const res = await callback(auth, makeReq('/'));
    expect((res as NextResponse).headers.get('x-middleware-next')).toBe('1');
  });
});
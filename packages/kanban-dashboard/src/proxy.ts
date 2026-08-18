import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_COOKIE, REFRESH_COOKIE, authCookieOptions } from './lib/auth/constants';
import { isAccessTokenUsable } from './lib/auth/token';
import type { AuthTokens } from './lib/auth/types';

const AUTH_ROUTES = new Set(['/login', '/register']);

function loginRedirect(request: NextRequest, reason?: string) {
  const url = new URL('/login', request.url);
  if (reason) url.searchParams.set('reason', reason);
  const response = NextResponse.redirect(url);
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

export async function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const isAuthRoute = AUTH_ROUTES.has(request.nextUrl.pathname);

  if (isAccessTokenUsable(access)) {
    return isAuthRoute ? NextResponse.redirect(new URL('/dashboard', request.url)) : NextResponse.next();
  }
  if (!refresh) return isAuthRoute ? NextResponse.next() : loginRedirect(request);

  try {
    const response = await fetch(`${process.env.KANBAN_API_URL?.replace(/\/$/, '')}/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: refresh }), cache: 'no-store',
    });
    if (!response.ok) return loginRedirect(request, 'session-expired');
    const tokens = await response.json() as AuthTokens;
    request.cookies.set(ACCESS_COOKIE, tokens.accessToken);
    request.cookies.set(REFRESH_COOKIE, tokens.refreshToken);
    const next = isAuthRoute ? NextResponse.redirect(new URL('/dashboard', request.url)) : NextResponse.next({ request });
    next.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...authCookieOptions, maxAge: 15 * 60 });
    next.cookies.set(REFRESH_COOKIE, tokens.refreshToken, { ...authCookieOptions, maxAge: 30 * 24 * 60 * 60 });
    return next;
  } catch {
    return loginRedirect(request, 'service-unavailable');
  }
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };

import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiRequest } from '../api/client';
import { ApiError } from '../api/error';
import { ACCESS_COOKIE, REFRESH_COOKIE, authCookieOptions } from './constants';
import { AuthTokens, AuthUser } from './types';

export async function storeSession(tokens: AuthTokens): Promise<void> {
  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.accessToken, { ...authCookieOptions, maxAge: 15 * 60 });
  store.set(REFRESH_COOKIE, tokens.refreshToken, { ...authCookieOptions, maxAge: 30 * 24 * 60 * 60 });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}

async function accessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function authenticatedHeaders(): Promise<HeadersInit> {
  const token = await accessToken();
  if (!token) throw new ApiError(401, 'Session expired');
  return { Authorization: `Bearer ${token}` };
}

export const getCurrentUser = cache(async (): Promise<AuthUser> => {
  const token = await accessToken();
  if (!token) redirect('/login');
  try {
    return await apiRequest<AuthUser>('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect('/login?reason=session-expired');
    throw error;
  }
});

export async function refreshSession(): Promise<AuthTokens> {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) throw new ApiError(401, 'Session expired');
  const tokens = await apiRequest<AuthTokens>('/auth/refresh', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }),
  });
  await storeSession(tokens);
  return tokens;
}

export async function authenticatedActionRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  let token = await accessToken();
  if (!token) token = (await refreshSession()).accessToken;
  try {
    return await apiRequest<T>(path, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    const refreshed = await refreshSession();
    return apiRequest<T>(path, { ...init, headers: { ...init.headers, Authorization: `Bearer ${refreshed.accessToken}` } });
  }
}

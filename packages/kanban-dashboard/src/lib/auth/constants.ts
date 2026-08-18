export const ACCESS_COOKIE = 'kanban_access_token';
export const REFRESH_COOKIE = 'kanban_refresh_token';

export const authCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

'use server';

import { redirect } from 'next/navigation';
import { apiRequest } from '../../lib/api/client';
import { apiErrorMessage } from '../../lib/api/error';
import { clearSession, storeSession } from '../../lib/auth/session';
import { AuthActionState, AuthTokens } from '../../lib/auth/types';
import { loginSchema, registerSchema } from '../../lib/auth/validation';
import { cookies } from 'next/headers';
import { REFRESH_COOKIE } from '../../lib/auth/constants';

function fields(formData: FormData) {
  return {
    name: String(formData.get('name') ?? ''),
    email: String(formData.get('email') ?? ''),
    password: String(formData.get('password') ?? ''),
  };
}

export async function loginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(fields(formData));
  if (!parsed.success) return { status: 'error', message: 'Check the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await storeSession(await apiRequest<AuthTokens>('/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data),
    }));
  } catch (error) { return { status: 'error', message: apiErrorMessage(error) }; }
  redirect('/dashboard');
}

export async function registerAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(fields(formData));
  if (!parsed.success) return { status: 'error', message: 'Check the highlighted fields.', fieldErrors: parsed.error.flatten().fieldErrors };
  try {
    await storeSession(await apiRequest<AuthTokens>('/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data),
    }));
  } catch (error) { return { status: 'error', message: apiErrorMessage(error) }; }
  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  const refreshToken = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (refreshToken) {
    await apiRequest<void>('/auth/logout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken }),
    }).catch(() => undefined);
  }
  await clearSession();
  redirect('/login');
}

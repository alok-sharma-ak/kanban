import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ACCESS_COOKIE, REFRESH_COOKIE } from '../lib/auth/constants';

export default async function HomePage() {
  const store = await cookies();
  redirect(store.has(ACCESS_COOKIE) || store.has(REFRESH_COOKIE) ? '/dashboard' : '/login');
}

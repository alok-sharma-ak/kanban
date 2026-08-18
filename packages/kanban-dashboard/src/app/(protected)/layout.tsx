import type { ReactNode } from 'react';
import { AppShell } from '../../components/layout/app-shell';
import { getCurrentUser } from '../../lib/auth/session';

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  return <AppShell user={user}>{children}</AppShell>;
}

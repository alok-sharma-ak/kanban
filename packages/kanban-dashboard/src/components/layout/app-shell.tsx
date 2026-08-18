import type { ReactNode } from 'react';
import { logoutAction } from '../../features/auth/actions';
import type { AuthUser } from '../../lib/auth/types';
import { Button } from '../ui/button';
import { Brand } from './brand';

export function AppShell({ user, children }: { user: AuthUser; children: ReactNode }) {
  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,.08),transparent_28%)]"><header className="sticky top-0 z-20 border-b border-line/80 bg-canvas/85 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"><Brand /><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-medium text-zinc-200">{user.name}</p><p className="text-xs text-muted">{user.systemRole}</p></div><form action={logoutAction}><Button variant="ghost" type="submit">Sign out</Button></form></div></div></header><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">{children}</main></div>;
}

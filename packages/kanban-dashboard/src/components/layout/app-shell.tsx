import type { ReactNode } from 'react';
import Link from 'next/link';
import { logoutAction } from '../../features/auth/actions';
import type { AuthUser } from '../../lib/auth/types';
import { Button } from '../ui/button';
import { Brand } from './brand';

export function AppShell({ user, children }: { user: AuthUser; children: ReactNode }) {
  const link='rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-panel-raised hover:text-white';
  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,.08),transparent_28%)]"><header className="sticky top-0 z-20 border-b border-line/80 bg-canvas/85 backdrop-blur-xl"><div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6"><Brand /><nav aria-label="Main navigation" className="order-3 flex w-full items-center gap-1 overflow-x-auto sm:order-2 sm:w-auto"><Link className={link} href="/dashboard">Boards</Link><Link className={link} href="/profile">Profile</Link><Link className={link} href="/health">Health</Link>{user.systemRole==='ADMIN'&&<Link className={link} href="/admin/users">Admin</Link>}</nav><div className="order-2 flex items-center gap-3 sm:order-3"><div className="hidden text-right lg:block"><p className="text-sm font-medium text-zinc-200">{user.name}</p><p className="text-xs text-muted">{user.systemRole}</p></div><form action={logoutAction}><Button variant="ghost" type="submit">Sign out</Button></form></div></div></header><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">{children}</main></div>;
}

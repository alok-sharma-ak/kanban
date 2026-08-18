import type { Metadata } from 'next';
import { Card } from '../../../components/ui/card';
import { getCurrentUser } from '../../../lib/auth/session';

export const metadata: Metadata = { title: 'Dashboard' };
export default async function DashboardPage() {
  const user = await getCurrentUser();
  return <div className="space-y-8"><div><p className="text-sm font-medium text-violet-300">Workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Good to see you, {user.name.split(' ')[0]}.</h1><p className="mt-3 max-w-2xl text-muted">Your authenticated workspace is ready. Boards and project tools will arrive module by module.</p></div><div className="grid gap-4 sm:grid-cols-3"><Card className="p-5"><p className="text-xs font-semibold uppercase tracking-widest text-muted">Session</p><p className="mt-3 text-lg font-medium text-emerald-300">Secure</p><p className="mt-1 text-sm text-muted">HttpOnly token cookies</p></Card><Card className="p-5"><p className="text-xs font-semibold uppercase tracking-widest text-muted">Account</p><p className="mt-3 text-lg font-medium">{user.systemRole}</p><p className="mt-1 truncate text-sm text-muted">{user.email}</p></Card><Card className="p-5"><p className="text-xs font-semibold uppercase tracking-widest text-muted">Next module</p><p className="mt-3 text-lg font-medium">Profile</p><p className="mt-1 text-sm text-muted">User settings and identity</p></Card></div></div>;
}

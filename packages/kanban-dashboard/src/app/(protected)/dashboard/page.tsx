import type { Metadata } from 'next';
import Link from 'next/link';
import { Card } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { getBoards } from '../../../lib/api/kanban';
import { BoardCreateForm } from '../../../features/boards/board-create-form';

export const metadata: Metadata = { title: 'Dashboard' };
export default async function DashboardPage({searchParams}:{searchParams:Promise<{search?:string}>}) {
  const query=((await searchParams).search||'').trim().toLowerCase();const boards=(await getBoards()).filter(b=>!query||b.name.toLowerCase().includes(query)||(b.description||'').toLowerCase().includes(query));
  return <div className="space-y-8"><div><p className="text-sm font-medium text-violet-300">Workspace</p><h1 className="mt-2 text-3xl font-semibold">Your boards</h1><p className="mt-2 text-muted">Owned and shared workspaces in one place.</p></div><div className="grid gap-6 lg:grid-cols-[1fr_340px]"><section><form className="mb-4 flex gap-2"><input className="min-h-11 flex-1 rounded-lg border border-line bg-canvas px-3" name="search" defaultValue={query} placeholder="Search boards"/><button className="rounded-lg bg-panel-raised px-4">Search</button></form><div className="grid gap-4 sm:grid-cols-2">{boards.map(b=><Link key={b.id} href={`/boards/${b.id}`}><Card className="h-full p-5 transition hover:border-violet-500/50"><div className="flex justify-between gap-3"><h2 className="font-semibold">{b.name}</h2><Badge>{b.role}</Badge></div><p className="mt-3 line-clamp-2 text-sm text-muted">{b.description||'No description'}</p></Card></Link>)}</div>{boards.length===0&&<Card className="p-8 text-center text-muted">No matching boards. Create your first board.</Card>}</section><Card className="h-fit p-5"><h2 className="mb-4 text-lg font-semibold">New board</h2><BoardCreateForm/></Card></div></div>;
}

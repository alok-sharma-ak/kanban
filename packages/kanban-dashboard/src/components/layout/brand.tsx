import Link from 'next/link';

export function Brand() {
  return <Link href="/dashboard" className="inline-flex items-center gap-3 font-semibold tracking-tight text-white"><span className="grid size-9 place-items-center rounded-xl bg-accent text-sm shadow-lg shadow-accent/20">K</span><span>Kanban</span></Link>;
}

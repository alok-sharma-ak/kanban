import type { ReactNode } from 'react';
import { Brand } from '../../components/layout/brand';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <main className="relative grid min-h-screen place-items-center overflow-hidden px-4 py-12"><div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(124,58,237,.18),transparent_28%),radial-gradient(circle_at_85%_80%,rgba(59,130,246,.08),transparent_30%)]" /><div className="relative w-full max-w-md"><div className="mb-8 flex justify-center"><Brand /></div>{children}<p className="mt-6 text-center text-xs text-zinc-600">Server-secured sessions · Private by default</p></div></main>;
}

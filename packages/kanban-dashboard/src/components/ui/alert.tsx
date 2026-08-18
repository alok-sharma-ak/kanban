import type { ReactNode } from 'react';

export function Alert({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'info' }) {
  const style = tone === 'error' ? 'border-red-500/25 bg-red-500/10 text-red-200' : 'border-sky-500/25 bg-sky-500/10 text-sky-200';
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2.5 text-sm ${style}`}>{children}</div>;
}

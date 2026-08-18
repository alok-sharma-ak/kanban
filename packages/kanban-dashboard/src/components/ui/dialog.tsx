import type { ReactNode } from 'react';

export function DialogPanel({ title, children }: { title: string; children: ReactNode }) {
  return <section role="dialog" aria-modal="true" aria-labelledby="dialog-title" className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-2xl"><h2 id="dialog-title" className="text-lg font-semibold">{title}</h2><div className="mt-4">{children}</div></section>;
}

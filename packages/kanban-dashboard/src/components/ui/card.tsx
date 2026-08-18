import type { HTMLAttributes, ReactNode } from 'react';

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border border-line bg-panel shadow-2xl shadow-black/20 ${className}`} {...props} />;
}
export function CardHeader({ title, description }: { title: string; description: string }) {
  return <div className="space-y-2"><h1 className="text-2xl font-semibold tracking-tight text-white">{title}</h1><p className="text-sm leading-6 text-muted">{description}</p></div>;
}
export function CardContent({ children }: { children: ReactNode }) { return <div className="mt-7">{children}</div>; }

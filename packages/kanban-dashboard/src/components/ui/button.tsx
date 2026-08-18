import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-strong shadow-[0_0_24px_rgba(139,92,246,.18)]',
  secondary: 'border border-line bg-panel-raised text-zinc-100 hover:bg-zinc-800',
  ghost: 'text-muted hover:bg-panel-raised hover:text-zinc-100',
  danger: 'bg-red-500/15 text-red-300 hover:bg-red-500/25',
};

export function Button({ className = '', variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`} {...props} />;
}

import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`min-h-11 w-full rounded-lg border border-line bg-canvas/70 px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-accent focus:ring-3 focus:ring-accent/15 ${className}`} {...props} />;
}

'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Spinner } from '../../components/ui/spinner';
import { INITIAL_AUTH_STATE, type AuthActionState } from '../../lib/auth/types';

type AuthAction = (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
function Submit({ label }: { label: string }) { const { pending } = useFormStatus(); return <Button type="submit" className="w-full" disabled={pending}>{pending && <Spinner />}{pending ? 'Please wait…' : label}</Button>; }
function Field({ name, label, type = 'text', error, autoComplete }: { name: string; label: string; type?: string; error?: string[]; autoComplete: string }) { const errorId = error?.length ? `${name}-error` : undefined; return <div className="space-y-2"><label htmlFor={name} className="text-sm font-medium text-zinc-300">{label}</label><Input id={name} name={name} type={type} autoComplete={autoComplete} required aria-invalid={Boolean(errorId)} aria-describedby={errorId} />{errorId && <p id={errorId} className="text-xs text-red-300">{error?.[0]}</p>}</div>; }

export function AuthForm({ action, mode }: { action: AuthAction; mode: 'login' | 'register' }) {
  const [state, formAction] = useActionState(action, INITIAL_AUTH_STATE); const register = mode === 'register';
  return <form action={formAction} className="space-y-5" noValidate>{state.message && <Alert>{state.message}</Alert>}{register && <Field name="name" label="Full name" autoComplete="name" error={state.fieldErrors?.name} />}<Field name="email" label="Email address" type="email" autoComplete="email" error={state.fieldErrors?.email} /><Field name="password" label="Password" type="password" autoComplete={register ? 'new-password' : 'current-password'} error={state.fieldErrors?.password} /><Submit label={register ? 'Create account' : 'Sign in'} /><p className="text-center text-sm text-muted">{register ? 'Already have an account?' : 'New to Kanban?'} <Link className="font-medium text-violet-300 hover:text-violet-200" href={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create account'}</Link></p></form>;
}

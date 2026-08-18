'use client';
import { useActionState } from 'react';
import type { ReactNode } from 'react';
import type { ActionState } from '../../lib/api/types';
import { initialActionState } from '../../lib/api/types';
import { Alert } from './alert';
import { Button } from './button';

export function ActionForm({ action, children, submitLabel='Save', className='' }: { action:(state:ActionState,data:FormData)=>Promise<ActionState>; children:ReactNode; submitLabel?:string; className?:string }) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  return <form action={formAction} className={className}>{children}{state.message&&<Alert tone={state.status==='error'?'error':'info'}>{state.message}</Alert>}<Button disabled={pending} type="submit">{pending?'Working…':submitLabel}</Button></form>;
}

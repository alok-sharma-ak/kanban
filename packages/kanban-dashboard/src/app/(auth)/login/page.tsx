import type { Metadata } from 'next';
import { Alert } from '../../../components/ui/alert';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { loginAction } from '../../../features/auth/actions';
import { AuthForm } from '../../../features/auth/auth-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ reason?: string }> }) {
  const reason = (await searchParams).reason;
  return <Card className="p-6 sm:p-8"><CardHeader title="Welcome back" description="Sign in to continue to your workspace." /><CardContent>{reason === 'session-expired' && <div className="mb-5"><Alert>Your session expired. Sign in again to continue.</Alert></div>}{reason === 'service-unavailable' && <div className="mb-5"><Alert>The authentication service is unavailable. Please try again.</Alert></div>}<AuthForm action={loginAction} mode="login" /></CardContent></Card>;
}

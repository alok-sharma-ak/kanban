import type { Metadata } from 'next';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { registerAction } from '../../../features/auth/actions';
import { AuthForm } from '../../../features/auth/auth-form';

export const metadata: Metadata = { title: 'Create account' };
export default function RegisterPage() { return <Card className="p-6 sm:p-8"><CardHeader title="Create your account" description="Start with a private workspace and invite collaborators later." /><CardContent><AuthForm action={registerAction} mode="register" /></CardContent></Card>; }

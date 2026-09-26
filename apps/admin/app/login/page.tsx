import { redirect } from 'next/navigation';
import { currentAdmin } from '@/services/admin/server';
import { LoginForm } from '@/features/auth/login-form';
export const dynamic = 'force-dynamic';
export default async function LoginPage() { if (await currentAdmin())
    redirect('/'); return <LoginForm />; }

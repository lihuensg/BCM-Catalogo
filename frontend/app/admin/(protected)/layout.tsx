import { redirect } from 'next/navigation';
import { currentAdmin } from '@/services/admin/server';
import { AdminShell } from '@/components/admin/admin-shell';
export const dynamic = 'force-dynamic';
export default async function ProtectedLayout({ children }: {
    children: React.ReactNode;
}) { const user = await currentAdmin(); if (!user)
    redirect('/admin/login'); return <AdminShell user={user}>{children}</AdminShell>; }

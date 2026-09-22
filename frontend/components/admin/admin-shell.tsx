'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { AdminIdentity } from '@bcm/shared';
import { BrandLogo } from '@/components/shared/brand-logo';
import { Button } from '@/components/ui/button';
import { Drawer } from '@/components/ui/dialog';
import { Breadcrumb } from '@/components/ui/surfaces';
import { request } from '@/services/admin/client';
import { errorMessage } from '@/services/admin/errors';
const navigation = [['', 'Dashboard', '◫'], ['productos', 'Productos', '▦'], ['categorias', 'Categorías', '▤'], ['marcas', 'Marcas', '◇'], ['atributos', 'Atributos', '≡'], ['banners', 'Banners', '▧'], ['configuracion', 'Configuración', '⚙']];
export function AdminShell({ children, user }: {
    children: React.ReactNode;
    user: AdminIdentity;
}) {
    const pathname = usePathname(), [open, setOpen] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const current = navigation.find(([slug]) => slug && pathname.startsWith('/admin/' + slug))?.[1] ?? 'Dashboard';
    const links = <><BrandLogo /><p className="eyebrow">ESPACIO DE TRABAJO</p><nav aria-label="Administración">{navigation.map(([slug, label, icon]) => <Link key={slug} href={'/admin' + (slug ? '/' + slug : '')} aria-current={current === label ? 'page' : undefined} onClick={() => setOpen(false)}><span aria-hidden="true" className="nav-icon">{icon}</span>{label}</Link>)}</nav><div className="sidebar-foot"><span className="status-dot"/> Catálogo BCM<br /><small>Panel de administración</small></div></>;
    async function logout() { setBusy(true); setError(''); try {
        await request('/auth/logout', { method: 'POST' });
        window.location.replace('/admin/login');
    }
    catch (e) {
        setError(errorMessage(e));
        setBusy(false);
    } }
    return <div className="admin-shell"><aside className="admin-sidebar">{links}</aside><Drawer title="Navegación" open={open} onClose={() => setOpen(false)}>{links}</Drawer><div className="admin-workspace"><header className="admin-topbar"><div className="actions"><Button className="button-secondary mobile-menu" aria-label="Abrir navegación" onClick={() => setOpen(true)}>☰</Button><Breadcrumb items={[{ label: 'BCM', href: '/admin' }, { label: current }]}/></div><div className="user-menu"><span className="avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span><span className="user-name">{user.name}<small>Administrador</small></span><Button className="button-quiet" disabled={busy} onClick={logout}>{busy ? 'Saliendo…' : 'Salir'}</Button></div></header>{error && <p role="alert" className="notice notice-error">{error}</p>}<main id="contenido" className="admin-main">{children}</main><footer className="admin-footer">BCM · Administración del catálogo</footer></div></div>;
}

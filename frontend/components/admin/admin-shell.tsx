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

const navigation = [
  ['', 'Dashboard'],
  ['productos', 'Productos'],
  ['categorias', 'Categorías'],
  ['marcas', 'Marcas'],
  ['atributos', 'Atributos'],
  ['banners', 'Banners'],
  ['configuracion', 'Configuración']
] as const;

function NavIcon({ slug }: { slug: typeof navigation[number][0] }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (slug === '') return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
  if (slug === 'productos') return <svg {...common}><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z"/><path d="M12 11v10"/></svg>;
  if (slug === 'categorias') return <svg {...common}><path d="M5 7h14"/><path d="M5 12h14"/><path d="M5 17h14"/><circle cx="3" cy="7" r=".7" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="3" cy="17" r=".7" fill="currentColor" stroke="none"/></svg>;
  if (slug === 'marcas') return <svg {...common}><path d="M20 13 13 20 4 11V4h7l9 9Z"/><circle cx="8.5" cy="8.5" r="1.2"/></svg>;
  if (slug === 'atributos') return <svg {...common}><path d="M4 6h10"/><path d="M18 6h2"/><circle cx="16" cy="6" r="2"/><path d="M4 12h2"/><path d="M10 12h10"/><circle cx="8" cy="12" r="2"/><path d="M4 18h7"/><path d="M15 18h5"/><circle cx="13" cy="18" r="2"/></svg>;
  if (slug === 'banners') return <svg {...common}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m6 16 4-4 3 3 2-2 3 3"/><circle cx="8" cy="9" r="1.2"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H10v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3V10h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06L7.06 3.8l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3H14v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 9c.2.36.4.7.6 1h1v4h-1a4 4 0 0 0-.6 1Z"/></svg>;
}

function MenuIcon() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
}

export function AdminShell({ children, user }: { children: React.ReactNode; user: AdminIdentity }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = navigation.find(([slug]) => slug && pathname.startsWith('/admin/' + slug))?.[1] ?? 'Dashboard';

  const links = <>
    <BrandLogo />
    <p className="eyebrow">ESPACIO DE TRABAJO</p>
    <nav aria-label="Administración">
      {navigation.map(([slug, label]) => <Link
        key={slug}
        href={'/admin' + (slug ? '/' + slug : '')}
        aria-current={current === label ? 'page' : undefined}
        onClick={() => setOpen(false)}
      >
        <span aria-hidden="true" className="nav-icon"><NavIcon slug={slug} /></span>
        {label}
      </Link>)}
    </nav>
    <div className="sidebar-foot"><span className="status-dot" /> Catálogo BCM<br /><small>Panel de administración</small></div>
  </>;

  async function logout() {
    setBusy(true);
    setError('');
    try {
      await request('/auth/logout', { method: 'POST' });
      window.location.replace('/admin/login');
    } catch (caught) {
      setError(errorMessage(caught));
      setBusy(false);
    }
  }

  return <div className="admin-shell">
    <aside className="admin-sidebar">{links}</aside>
    <Drawer title="Navegación" open={open} onClose={() => setOpen(false)}>{links}</Drawer>
    <div className="admin-workspace">
      <header className="admin-topbar">
        <div className="actions">
          <Button className="button-secondary mobile-menu" aria-label="Abrir navegación" onClick={() => setOpen(true)}><MenuIcon /></Button>
          <Breadcrumb items={[{ label: 'BCM', href: '/admin' }, { label: current }]} />
        </div>
        <div className="user-menu">
          <span className="avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
          <span className="user-name">{user.name}<small>Administrador</small></span>
          <Button className="button-quiet" disabled={busy} onClick={logout}>{busy ? 'Saliendo…' : 'Salir'}</Button>
        </div>
      </header>
      {error && <p role="alert" className="notice notice-error">{error}</p>}
      <main id="contenido" className="admin-main">{children}</main>
      <footer className="admin-footer">BCM · Administración del catálogo</footer>
    </div>
  </div>;
}

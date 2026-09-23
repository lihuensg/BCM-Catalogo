import Link from 'next/link';
import type { PublicSettingsDto } from '@bcm/shared';
import { BrandLogo } from '@/components/shared/brand-logo';
import { whatsappUrl } from '@/features/catalog/model';

function SearchIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none">
    <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
    <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>;
}

export function PublicHeader({ settings }: { settings: PublicSettingsDto | null }) {
  const whatsapp = whatsappUrl(settings);

  return <div className="public-header-wrap">
    <header className="public-header container">
      <Link href="/" aria-label="BCM, inicio"><BrandLogo /></Link>
      <nav className="public-nav" aria-label="Navegación principal">
        <Link href="/catalogo">Catálogo</Link>
        <Link href="/ofertas">Ofertas</Link>
        <Link href="/nuevos">Nuevos</Link>
        <Link href="/destacados">Destacados</Link>
      </nav>
      <div className="header-actions">
        <form className="header-search" action="/buscar">
          <label className="sr-only" htmlFor="header-search">Buscar productos</label>
          <input id="header-search" name="search" placeholder="Buscar productos" autoComplete="off" />
          <button aria-label="Buscar" type="submit"><SearchIcon /></button>
        </form>
        {whatsapp && <a className="button header-whatsapp" href={whatsapp} target="_blank" rel="noreferrer">WhatsApp <span aria-hidden="true">↗</span></a>}
        <details className="mobile-public-menu">
          <summary aria-label="Abrir navegación">Menú</summary>
          <nav>
            <Link href="/catalogo">Catálogo</Link>
            <Link href="/ofertas">Ofertas</Link>
            <Link href="/nuevos">Nuevos</Link>
            <Link href="/destacados">Destacados</Link>
            <Link href="/buscar">Buscar</Link>
            {settings?.instagramUrl && <a href={settings.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>}
          </nav>
        </details>
      </div>
    </header>
  </div>;
}

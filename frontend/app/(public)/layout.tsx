import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo } from '@/components/shared/brand-logo';
import { PublicHeader } from '@/components/catalog/public-header';
import { getSettings } from '@/services/public/client';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  return {
    ...(siteUrl && URL.canParse(siteUrl) ? { metadataBase: new URL(siteUrl) } : {}),
    title: { default: settings?.defaultSeoTitle ?? 'BCM Products', template: '%s | BCM' },
    description: settings?.defaultSeoDescription ?? 'Catálogo BCM',
    openGraph: {
      title: settings?.defaultSeoTitle ?? 'BCM Products',
      description: settings?.defaultSeoDescription ?? 'Catálogo BCM',
      type: 'website',
      ...(settings?.defaultOgImageUrl ? { images: [settings.defaultOgImageUrl] } : {})
    }
  };
}

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return <div className="public-shell">
    <PublicHeader settings={settings} />
    <main id="contenido" className="public-main">{children}</main>
    <div className="public-footer-wrap">
      <footer className="public-footer container">
        <div><BrandLogo /><p>{settings?.defaultSeoDescription ?? 'Productos seleccionados para descubrir y consultar.'}</p></div>
        <div><h3>Explorar</h3><nav><Link href="/catalogo">Catálogo</Link><Link href="/ofertas">Ofertas</Link><Link href="/nuevos">Nuevos ingresos</Link><Link href="/destacados">Destacados</Link></nav></div>
        <div><h3>Contacto</h3><nav>{settings?.instagramUrl && <a href={settings.instagramUrl} target="_blank" rel="noreferrer">Instagram</a>}<Link href="/buscar">Buscar productos</Link></nav></div>
      </footer>
      <div className="public-footer-note container">© BCM Products · Catálogo online</div>
    </div>
  </div>;
}

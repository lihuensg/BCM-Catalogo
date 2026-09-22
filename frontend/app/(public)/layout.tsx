import Link from 'next/link';
import { BrandLogo } from '@/components/shared/brand-logo';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="public-shell"><header className="public-header container"><Link href="/" aria-label="BCM, inicio"><BrandLogo /></Link><span className="badge">Catálogo</span></header><main id="contenido" className="public-main container">{children}</main><footer className="public-footer container"><span>BCM Products</span><span>Catálogo online</span></footer></div>;
}

import Image from 'next/image';
import logo from '@/public/logo.jpg';

/** Preserve the full original canvas; never crop or distort the source asset. */
export function BrandLogo() {
  return <div className="brand-lockup"><Image src={logo} alt="" width={44} height={66} priority className="brand-image" /><span><strong>BCM</strong><span className="brand-caption">PRODUCTS</span></span></div>;
}

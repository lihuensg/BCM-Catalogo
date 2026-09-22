import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: { default: 'BCM', template: '%s | BCM' },
  description: 'Catálogo BCM',
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-AR"><body><a className="skip-link" href="#contenido">Saltar al contenido</a>{children}</body></html>;
}

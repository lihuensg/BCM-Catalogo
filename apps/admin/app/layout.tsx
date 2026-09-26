import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const viewport: Viewport = { themeColor: '#190660', colorScheme: 'light' };
export const metadata: Metadata = {
  title: { default: 'Administración BCM', template: '%s | BCM Gestión' },
  description: 'Panel de administración del catálogo BCM',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es-AR"><body><a className="skip-link" href="#contenido">Saltar al contenido</a>{children}</body></html>;
}

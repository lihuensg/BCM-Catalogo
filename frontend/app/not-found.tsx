import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

export default function NotFound() {
  return <main id="contenido" className="container standalone"><EmptyState title="Página no encontrada">La página que buscás no está disponible.</EmptyState><Link className="button" href="/">Volver al inicio</Link></main>;
}

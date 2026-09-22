import { EmptyState } from '@/components/ui/empty-state';

export default function HomePage() {
  return <section className="public-intro"><div className="eyebrow">BCM / CATÁLOGO</div><EmptyState title="Estamos preparando nuestro catálogo.">Los productos estarán disponibles próximamente.</EmptyState><div className="brand-line" aria-hidden="true" /></section>;
}

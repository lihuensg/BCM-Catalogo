import Link from 'next/link';
export default function PublicNotFound() {
  return <section className="public-error container"><div className="eyebrow">404 / BCM</div><h1>Esta página no está disponible</h1><p>El producto o sección pudo haberse movido o ya no estar publicado.</p><Link className="button" href="/catalogo">Volver al catálogo</Link></section>;
}

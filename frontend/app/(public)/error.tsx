'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error('Public storefront error', error.digest ?? 'unknown'); }, [error]);
  return <section className="public-error container" role="alert">
    <div className="eyebrow">BCM</div><h1>No pudimos cargar esta página</h1>
    <p>Podés volver a intentar o seguir navegando por el catálogo.</p>
    <div className="hero-actions"><button className="button" onClick={reset}>Volver a intentar</button><Link className="button button-secondary" href="/catalogo">Ir al catálogo</Link></div>
  </section>;
}

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

export function CatalogFilterPanel({ children, activeCount = 0, resultCount = 0 }: {
  children: ReactNode;
  activeCount?: number;
  resultCount?: number;
}) {
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 800px)');
    const sync = () => {
      setMobile(media.matches);
      if (!media.matches) setOpen(false);
    };
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  if (!mobile) return <div className="catalog-filter-content">{children}</div>;

  return <>
    <button className="catalog-filter-trigger" type="button" onClick={() => setOpen(true)}>
      <span>Filtros y orden{activeCount > 0 && <b>{activeCount}</b>}</span>
      <span>{resultCount} {resultCount === 1 ? 'producto' : 'productos'}</span>
    </button>
    {open && <div className="catalog-filter-overlay" onMouseDown={event => {
      if (event.target === event.currentTarget) setOpen(false);
    }}>
      <section className="catalog-filter-drawer" role="dialog" aria-modal="true" aria-labelledby="catalog-filter-title">
        <header>
          <div><span className="eyebrow">CATÁLOGO</span><h2 id="catalog-filter-title">Filtros</h2></div>
          <button ref={closeRef} className="catalog-filter-close" type="button" aria-label="Cerrar filtros" onClick={() => setOpen(false)}>×</button>
        </header>
        <div className="catalog-filter-scroll">{children}</div>
      </section>
    </div>}
  </>;
}

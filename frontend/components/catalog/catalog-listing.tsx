import Image from 'next/image';
import Link from 'next/link';
import type { PublicProductListQuery } from '@bcm/shared';
import { getBanners, getBrands, getCategories, getProducts } from '@/services/public/client';
import { availabilityOptions, catalogQuery, saleModeLabel } from '@/features/catalog/model';
import { ProductCard } from './product-card';

function pageHref(path: string, params: Record<string, string | string[] | undefined>, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const item = Array.isArray(value) ? value[0] : value;
    if (item && key !== 'page') query.set(key, item);
  }
  if (page > 1) query.set('page', String(page));
  return path + (query.size ? '?' + query.toString() : '');
}

export async function CatalogListing({ pathname, params, title, description, forced = {} }: {
  pathname: string;
  params: Record<string, string | string[] | undefined>;
  title: string;
  description: string;
  forced?: Partial<PublicProductListQuery>;
}) {
  const query = catalogQuery(params, forced);
  const [result, categories, brands, catalogBanners] = await Promise.all([getProducts(query), getCategories(), getBrands(), getBanners('CATALOG_TOP')]);
  const products = result?.data ?? [];
  const meta = result?.meta;

  return <>
    <section className="catalog-hero container">
      <div className="eyebrow">BCM / CATÁLOGO</div>
      <h1>{title}</h1><p>{description}</p>
    </section>
    {!!catalogBanners.length && <section className="catalog-banner-wrap container" aria-label="Campaña de catálogo">
      {catalogBanners.slice(0, 1).map(banner => <article className="catalog-banner" key={banner.id}>
        <Image src={banner.imageUrl} alt="" fill unoptimized sizes="(max-width:800px) 100vw,1200px" />
        <div className="catalog-banner-overlay" />
        <div className="catalog-banner-copy">
          {banner.title && <h2>{banner.title}</h2>}
          {banner.subtitle && <p>{banner.subtitle}</p>}
          {banner.ctaText && banner.ctaHref && <Link href={banner.ctaHref}>{banner.ctaText} →</Link>}
        </div>
      </article>)}
    </section>}
    <div className="catalog-layout container">
      <aside className="catalog-filters">
        <details className="catalog-filter-panel">
          <summary>Filtros y orden</summary>
          <div className="catalog-filter-content">
            <h2>Filtrar catálogo</h2>
            <form action={pathname}>
          <label>Buscar<input name="search" defaultValue={query.search ?? ''} placeholder="Nombre, marca..." /></label>
          {!forced.category && <label>Categoría<select name="category" defaultValue={query.category ?? ''}>
            <option value="">Todas</option>{categories.filter(item => item.productCount > 0).map(item => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select></label>}
          {!forced.brand && <label>Marca<select name="brand" defaultValue={query.brand ?? ''}>
            <option value="">Todas</option>{brands.filter(item => item.productCount > 0).map(item => <option key={item.id} value={item.slug}>{item.name}</option>)}
          </select></label>}
          <div className="filter-price-row">
            <label>Precio desde<input name="minPrice" inputMode="decimal" defaultValue={query.minPrice ?? ''} placeholder="0" /></label>
            <label>Precio hasta<input name="maxPrice" inputMode="decimal" defaultValue={query.maxPrice ?? ''} placeholder="Sin límite" /></label>
          </div>
          <label>Disponibilidad<select name="availability" defaultValue={query.availability ?? ''}>
            <option value="">Todas</option>{availabilityOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label>Tipo de venta<select name="saleMode" defaultValue={query.saleMode ?? ''}>
            <option value="">Todos</option>{Object.entries(saleModeLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <div className="catalog-checks">
            {!forced.onSale && <label><input type="checkbox" name="onSale" value="true" defaultChecked={query.onSale === true} /> Ofertas</label>}
            {!forced.featured && <label><input type="checkbox" name="featured" value="true" defaultChecked={query.featured === true} /> Destacados</label>}
            {!forced.newArrival && <label><input type="checkbox" name="newArrival" value="true" defaultChecked={query.newArrival === true} /> Nuevos</label>}
          </div>
          <label>Orden<select name="sort" defaultValue={query.sort}>
            <option value="sortOrder">Recomendados</option><option value="publishedAt">Más recientes</option><option value="name">Nombre</option><option value="price">Precio</option>
          </select></label>
          <label>Dirección<select name="order" defaultValue={query.order}><option value="asc">Ascendente</option><option value="desc">Descendente</option></select></label>
          <button className="button" type="submit">Aplicar filtros</button>
              <Link className="button button-secondary" href={pathname}>Limpiar</Link>
            </form>
          </div>
        </details>
      </aside>
      <section className="catalog-content" aria-live="polite">
        <div className="catalog-toolbar">
          <span>{meta ? <><strong>{meta.total}</strong> productos</> : 'Catálogo temporalmente no disponible'}</span>
          <span>Página {meta?.page ?? 1}</span>
        </div>
        {products.length
          ? <div className="product-grid">{products.map(product => <ProductCard key={product.id} product={product} />)}</div>
          : <div className="catalog-empty"><h2>No encontramos productos</h2><p>Probá limpiando los filtros o consultanos para ayudarte.</p><Link className="button" href="/catalogo">Ver todo el catálogo</Link></div>}
        {meta && meta.totalPages > 1 && <nav className="store-pagination" aria-label="Paginación del catálogo">
          {meta.page > 1 && <Link aria-label="Página anterior" href={pageHref(pathname, params, meta.page - 1)}>←</Link>}
          <span className="current" aria-current="page">{meta.page}</span>
          {meta.page < meta.totalPages && <Link aria-label="Página siguiente" href={pageHref(pathname, params, meta.page + 1)}>→</Link>}
        </nav>}
      </section>
    </div>
  </>;
}

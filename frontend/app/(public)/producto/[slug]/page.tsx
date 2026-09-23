import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductSection } from '@/components/catalog/product-section';
import { ProductGallery } from '@/components/catalog/product-gallery';
import { availabilityLabel, formatAmount, whatsappUrl } from '@/features/catalog/model';
import { getAllPublicProducts, getProduct, getSettings, PublicNotFoundError } from '@/services/public/client';
import { productJsonLd, safeJsonLd } from '@/features/catalog/seo';

export async function generateStaticParams() {
  return (await getAllPublicProducts()).map(product => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const { product } = await getProduct(slug);
    return {
      title: product.seoTitle ?? product.name,
      description: product.seoDescription ?? product.shortDescription,
      alternates: { canonical: '/producto/' + product.slug },
      openGraph: {
        title: product.seoTitle ?? product.name,
        description: product.seoDescription ?? product.shortDescription,
        type: 'website',
        url: '/producto/' + product.slug,
        images: product.images[0]?.url ? [product.images[0].url] : []
      }
    };
  } catch {
    return { title: 'Producto | BCM' };
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let payload: Awaited<ReturnType<typeof getProduct>>;
  let settings: Awaited<ReturnType<typeof getSettings>>;
  try {
    [payload, settings] = await Promise.all([getProduct(slug), getSettings()]);
  } catch (error) {
    if (error instanceof PublicNotFoundError) notFound();
    throw error;
  }

  const { product, related } = payload;
  const price = product.showPrice && product.price ? formatAmount(product.price) : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  const whatsapp = whatsappUrl(settings, product, siteUrl);
  const structuredData = productJsonLd(product, siteUrl);

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(structuredData) }} />
    <article className="product-detail container">
      <nav className="product-breadcrumb" aria-label="Ruta del producto">
        <Link href="/">Inicio</Link><span>/</span>
        <Link href="/catalogo">Catálogo</Link><span>/</span>
        <Link href={'/categoria/' + product.category.slug}>{product.category.name}</Link><span>/</span>
        <span>{product.name}</span>
      </nav>
      <div className="product-detail-grid">
        <ProductGallery images={product.images} productName={product.name} />
        <div className="product-info">
          <div className="product-brand">{product.brand?.name ?? product.category.name}</div>
          <h1>{product.name}</h1>
          <p className="lead">{product.shortDescription}</p>
          <div className="badges">
            {product.onSale && <span className="store-badge sale">Oferta</span>}
            {product.newArrival && <span className="store-badge new">Nuevo</span>}
            {product.saleMode === 'MADE_TO_ORDER' && <span className="store-badge order">Por encargo</span>}
          </div>
          <div className="product-purchase-panel">
            <div className="product-purchase-label">¿Te interesa este producto?</div>
            <div className="product-detail-price">
              {price ? <><strong>{price}</strong>{product.onSale && product.compareAtPrice && <del>{formatAmount(product.compareAtPrice)}</del>}</> : <strong>Consultar precio</strong>}
            </div>
            <div className={'availability-line' + (product.availability === 'OUT_OF_STOCK' ? ' out' : '')}>{availabilityLabel[product.availability]}</div>
            <div className="product-cta">
              {whatsapp && <a className="button product-primary-cta" href={whatsapp} target="_blank" rel="noreferrer">Consultar por WhatsApp <span aria-hidden="true">→</span></a>}
              <Link className="button button-secondary" href="/catalogo">Seguir explorando</Link>
            </div>
            <div className="product-assurances" aria-label="Información de compra">
              <span><b>Contacto directo</b><small>Consultá este producto con BCM.</small></span>
              <span><b>{product.showPrice ? 'Precio publicado' : 'Precio a consultar'}</b><small>{product.showPrice ? 'El valor mostrado corresponde a la publicación actual.' : 'Solicitá el valor actualizado por WhatsApp.'}</small></span>
              <span><b>{product.saleMode === 'MADE_TO_ORDER' ? 'Producto por encargo' : 'Venta de stock'}</b><small>{availabilityLabel[product.availability]}</small></span>
            </div>
          </div>
          {product.fullDescription && <div className="product-description-block"><h2>Sobre este producto</h2><p>{product.fullDescription}</p></div>}
          {product.sku && <small className="product-sku">SKU: {product.sku}</small>}
        </div>
      </div>
      {!!product.attributes.length && <section className="specs">
        <div className="section-head"><div><div className="eyebrow">DETALLES</div><h2>Especificaciones</h2></div></div>
        <div className="spec-grid">{product.attributes.map(attribute => <div className="spec-row" key={attribute.id}>
          <span>{attribute.name}</span><strong>{attribute.value}{attribute.unit ? ' ' + attribute.unit : ''}</strong>
        </div>)}</div>
      </section>}
    </article>
    <ProductSection eyebrow="TAMBIÉN TE PUEDE INTERESAR" title="Productos relacionados" href={'/categoria/' + product.category.slug} products={related} alt />
    {whatsapp && <div className="product-mobile-cta" role="region" aria-label="Consulta rápida del producto">
      <div><small>{product.name}</small><strong>{price ?? 'Consultar precio'}</strong></div>
      <a className="button" href={whatsapp} target="_blank" rel="noreferrer">Consultar</a>
    </div>}
  </>;
}

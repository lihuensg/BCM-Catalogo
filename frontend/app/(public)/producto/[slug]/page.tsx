import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductSection } from '@/components/catalog/product-section';
import { availabilityLabel, formatAmount, whatsappUrl } from '@/features/catalog/model';
import { getProduct, getSettings, PublicNotFoundError } from '@/services/public/client';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const { product } = await getProduct(slug);
    return {
      title: product.seoTitle ?? product.name,
      description: product.seoDescription ?? product.shortDescription,
      openGraph: {
        title: product.seoTitle ?? product.name,
        description: product.seoDescription ?? product.shortDescription,
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
  const whatsapp = whatsappUrl(settings, product, process.env.NEXT_PUBLIC_SITE_URL ?? '');
  const image = product.images[0];

  return <>
    <article className="product-detail container">
      <nav className="product-breadcrumb" aria-label="Ruta del producto">
        <Link href="/">Inicio</Link><span>/</span>
        <Link href="/catalogo">Catálogo</Link><span>/</span>
        <Link href={'/categoria/' + product.category.slug}>{product.category.name}</Link><span>/</span>
        <span>{product.name}</span>
      </nav>
      <div className="product-detail-grid">
        <div className="product-gallery">
          {product.images.length > 1 && <div className="product-thumbs">
            {product.images.slice(0, 4).map((item, index) => <div className="product-thumb" key={item.url + index}>
              <Image src={item.url} alt={item.altText} width={90} height={90} unoptimized />
            </div>)}
          </div>}
          <div className="product-main-image">
            {image ? <Image src={image.url} alt={image.altText} width={720} height={720} priority unoptimized /> : <span className="product-fallback">BCM</span>}
          </div>
        </div>
        <div className="product-info">
          <div className="product-brand">{product.brand?.name ?? product.category.name}</div>
          <h1>{product.name}</h1>
          <p className="lead">{product.shortDescription}</p>
          <div className="badges">
            {product.onSale && <span className="store-badge sale">Oferta</span>}
            {product.newArrival && <span className="store-badge new">Nuevo</span>}
            {product.saleMode === 'MADE_TO_ORDER' && <span className="store-badge order">Por encargo</span>}
          </div>
          <div className="product-detail-price">
            {price ? <><strong>{price}</strong>{product.onSale && product.compareAtPrice && <del>{formatAmount(product.compareAtPrice)}</del>}</> : <strong>Consultar precio</strong>}
          </div>
          <div className={'availability-line' + (product.availability === 'OUT_OF_STOCK' ? ' out' : '')}>{availabilityLabel[product.availability]}</div>
          {product.fullDescription && <p>{product.fullDescription}</p>}
          <div className="product-cta">
            {whatsapp && <a className="button" href={whatsapp} target="_blank" rel="noreferrer">Consultar por WhatsApp</a>}
            <Link className="button button-secondary" href="/catalogo">Seguir explorando</Link>
          </div>
          {product.sku && <small>SKU: {product.sku}</small>}
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
  </>;
}

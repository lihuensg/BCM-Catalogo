import Image from 'next/image';
import Link from 'next/link';
import { getHome } from '@/services/public/client';
import { whatsappUrl } from '@/features/catalog/model';
import { ProductSection } from '@/components/catalog/product-section';

export default async function HomePage() {
  const home = await getHome();
  const hero = home?.heroBanners[0];
  const title = hero?.title ?? home?.settings?.heroTitle ?? 'Encontrá eso que estabas buscando.';
  const subtitle = hero?.subtitle ?? home?.settings?.heroSubtitle ?? 'Productos seleccionados, novedades y oportunidades en un catálogo simple de explorar.';
  const heroCtaText = hero?.ctaText ?? 'Explorar catálogo';
  const heroCtaHref = hero?.ctaHref ?? '/catalogo';
  const whatsapp = whatsappUrl(home?.settings ?? null);

  return <>
    <section className="hero container">
      <div className="hero-panel">
        <div className="hero-copy">
          <span className="hero-kicker">BCM · SELECCIÓN ACTUAL</span>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <div className="hero-actions">
            <Link className="button" href={heroCtaHref}>{heroCtaText}</Link>
            <Link className="button button-secondary" href="/nuevos">Ver novedades</Link>
          </div>
        </div>
        <div className="hero-media">
          {hero?.imageUrl && <Image src={hero.imageUrl} alt="" fill priority unoptimized sizes="(max-width:800px) 100vw,45vw" />}
          <span className="hero-orbit" aria-hidden="true" />
        </div>
      </div>
    </section>

    {!!home?.secondaryBanners.length && <section className="campaign-section container" aria-label="Campañas">
      <div className="campaign-grid">
        {home.secondaryBanners.slice(0, 2).map(banner => <article className="campaign-card" key={banner.id}>
          <Image src={banner.imageUrl} alt="" fill unoptimized sizes="(max-width:800px) 100vw,50vw" />
          <div className="campaign-overlay" />
          <div className="campaign-copy">
            {banner.title && <h2>{banner.title}</h2>}
            {banner.subtitle && <p>{banner.subtitle}</p>}
            {banner.ctaText && banner.ctaHref && <Link className="campaign-link" href={banner.ctaHref}>{banner.ctaText} →</Link>}
          </div>
        </article>)}
      </div>
    </section>}

    <section className="shopping-promises container" aria-label="Cómo comprar en BCM">
      <div className="promise-item"><span className="promise-icon" aria-hidden="true">01</span><div><strong>Explorá fácil</strong><span>Categorías, marcas y filtros para encontrar rápido lo que buscás.</span></div></div>
      <div className="promise-item"><span className="promise-icon" aria-hidden="true">02</span><div><strong>Consultá directo</strong><span>Contactá a BCM por WhatsApp desde cada producto, sin pasos innecesarios.</span></div></div>
      <div className="promise-item"><span className="promise-icon" aria-hidden="true">03</span><div><strong>También por encargo</strong><span>Identificá claramente los productos disponibles bajo pedido.</span></div></div>
    </section>

    {!!home?.categories.length && <section className="public-section">
      <div className="container">
        <div className="section-head">
          <div><div className="eyebrow">EXPLORAR</div><h2>Encontrá tu categoría</h2><p>Entrá directo a lo que te interesa.</p></div>
          <Link className="section-link" href="/catalogo">Ver catálogo →</Link>
        </div>
        <div className="category-grid">
          {home.categories.filter(category => category.productCount > 0).slice(0, 8).map(category => <Link className="category-card" key={category.id} href={'/categoria/' + category.slug}>
            {category.imageUrl
              ? <Image src={category.imageUrl} alt="" fill unoptimized sizes="25vw" />
              : <span className="category-monogram" aria-hidden="true">{category.name.slice(0, 2).toUpperCase()}</span>}
            <span className="category-card-arrow" aria-hidden="true">↗</span>
            <strong>{category.name}</strong><span>{category.productCount} productos</span>
          </Link>)}
        </div>
      </div>
    </section>}

    <ProductSection eyebrow="SELECCIÓN BCM" title="Productos destacados" href="/destacados" products={home?.featured ?? []} alt />
    <ProductSection eyebrow="OPORTUNIDADES" title="Ofertas" href="/ofertas" products={home?.offers ?? []} />
    <ProductSection eyebrow="RECIÉN LLEGADOS" title="Nuevos ingresos" href="/nuevos" products={home?.newArrivals ?? []} alt />

    {!!home?.brands.length && <section className="public-section">
      <div className="container">
        <div className="section-head"><div><div className="eyebrow">MARCAS</div><h2>Marcas que encontrás en BCM</h2></div></div>
        <div className="brand-strip">
          {home.brands.filter(brand => brand.productCount > 0).map(brand => <Link className="brand-pill" key={brand.id} href={'/marca/' + brand.slug}>{brand.name}<span>{brand.productCount}</span></Link>)}
        </div>
      </div>
    </section>}

    {(whatsapp || home?.settings?.instagramUrl) && <section className="public-section contact-section">
      <div className="container">
        <div className="editorial-card">
          <div>
            <div className="eyebrow">CONTACTO DIRECTO</div>
            <h2>¿Buscás algo puntual?</h2>
            <p>Consultanos por disponibilidad, variantes o productos por encargo. Te respondemos por nuestros canales configurados.</p>
          </div>
          <div className="contact-actions">
            {whatsapp && <a className="button" href={whatsapp} target="_blank" rel="noreferrer">Hablar por WhatsApp</a>}
            {home?.settings?.instagramUrl && <a className="button button-secondary" href={home.settings.instagramUrl} target="_blank" rel="noreferrer">Ver Instagram</a>}
          </div>
        </div>
      </div>
    </section>}
  </>;
}

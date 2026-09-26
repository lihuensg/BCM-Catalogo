import Image from 'next/image';
import Link from 'next/link';
import type { PublicProductListDto } from '@bcm/shared';
import { availabilityLabel, discountPercentage, formatAmount, publicPrice } from '@/features/catalog/model';
import { ProductFallback } from './product-fallback';

export function ProductCard({ product }: { product: PublicProductListDto }) {
  const price = publicPrice(product);
  const discount = discountPercentage(product);
  const availabilityVisible = product.availability !== 'AVAILABLE' && product.availability !== 'MADE_TO_ORDER';
  const fallback = (product.brand?.name ?? product.category.name ?? 'BCM').slice(0, 3).toUpperCase();
  const badges: Array<{ label: string; className: string }> = [];
  if (product.onSale) badges.push({ label: discount ? discount + '% OFF' : 'Oferta', className: 'sale' });
  if (product.newArrival) badges.push({ label: 'Nuevo', className: 'new' });
  if (product.saleMode === 'MADE_TO_ORDER') badges.push({ label: 'Por encargo', className: 'order' });
  else if (product.availability === 'OUT_OF_STOCK') badges.push({ label: 'Sin stock', className: 'unavailable' });
  else if (product.availability === 'LOW_STOCK') badges.push({ label: 'Pocas unidades', className: 'low' });

  return <Link className="product-card" href={'/producto/' + product.slug} aria-label={'Ver ' + product.name}>
    <div className="product-media">
      <span className="product-card-glow" aria-hidden="true" />
      <div className="store-badges">
        {badges.slice(0, 3).map(badge => <span className={'store-badge ' + badge.className} key={badge.label}>{badge.label}</span>)}
      </div>
      {product.thumbnail
        ? <Image src={product.thumbnail.url} alt={product.thumbnail.altText} fill sizes="(max-width:520px) 120px,(max-width:1100px) 33vw,25vw" unoptimized />
        : <ProductFallback label={fallback} />}
    </div>
    <div className="product-card-body">
      <span className="product-brand">{product.brand?.name ?? product.category.name}</span>
      <span className="product-name">{product.name}</span>
      <span className="product-description">{product.shortDescription}</span>
      {availabilityVisible && <span className={'product-availability ' + product.availability.toLowerCase()}>{availabilityLabel[product.availability]}</span>}
      <span className={price ? 'product-price' : 'product-price consult'}>
        {price ? <><strong>{price}</strong>{product.onSale && product.compareAtPrice && <del>{formatAmount(product.compareAtPrice)}</del>}</> : 'Consultar precio'}
      </span>
      <span className="product-card-action" aria-hidden="true">Ver producto <span>→</span></span>
      <span className="sr-only">{availabilityLabel[product.availability]}</span>
    </div>
  </Link>;
}

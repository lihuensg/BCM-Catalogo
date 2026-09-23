import Image from 'next/image';
import Link from 'next/link';
import type { PublicProductListDto } from '@bcm/shared';
import { availabilityLabel, formatAmount, publicPrice } from '@/features/catalog/model';

export function ProductCard({ product }: { product: PublicProductListDto }) {
  const price = publicPrice(product);
  const availabilityVisible = product.availability !== 'AVAILABLE' && product.availability !== 'MADE_TO_ORDER';

  return <Link className="product-card" href={'/producto/' + product.slug}>
    <div className="product-media">
      <div className="store-badges">
        {product.onSale && <span className="store-badge sale">Oferta</span>}
        {product.newArrival && <span className="store-badge new">Nuevo</span>}
        {product.saleMode === 'MADE_TO_ORDER' && <span className="store-badge order">Por encargo</span>}
        {product.availability === 'OUT_OF_STOCK' && <span className="store-badge unavailable">Sin stock</span>}
        {product.availability === 'LOW_STOCK' && <span className="store-badge low">Pocas unidades</span>}
      </div>
      {product.thumbnail
        ? <Image src={product.thumbnail.url} alt={product.thumbnail.altText} fill sizes="(max-width:520px) 120px,(max-width:1100px) 33vw,25vw" unoptimized />
        : <span className="product-fallback" aria-hidden="true">BCM</span>}
    </div>
    <div className="product-card-body">
      <span className="product-brand">{product.brand?.name ?? product.category.name}</span>
      <span className="product-name">{product.name}</span>
      <span className="product-description">{product.shortDescription}</span>
      {availabilityVisible && <span className={'product-availability ' + product.availability.toLowerCase()}>{availabilityLabel[product.availability]}</span>}
      <span className={price ? 'product-price' : 'product-price consult'}>
        {price ? <><strong>{price}</strong>{product.onSale && product.compareAtPrice && <del>{formatAmount(product.compareAtPrice)}</del>}</> : 'Consultar precio'}
      </span>
      <span className="sr-only">{availabilityLabel[product.availability]}</span>
    </div>
  </Link>;
}

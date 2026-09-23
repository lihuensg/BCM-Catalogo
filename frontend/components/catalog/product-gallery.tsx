'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { PublicProductImageDto } from '@bcm/shared';
import { ProductFallback } from './product-fallback';

export function ProductGallery({ images, productName }: { images: PublicProductImageDto[]; productName: string }) {
  const [selected, setSelected] = useState(0);
  const image = images[selected] ?? images[0];

  if (!image) {
    return <div className="product-gallery product-gallery-empty">
      <div className="product-main-image"><ProductFallback label={productName} /></div>
    </div>;
  }

  return <div className="product-gallery">
    {images.length > 1 && <div className="product-thumbs" role="list" aria-label={'Imágenes de ' + productName}>
      {images.slice(0, 8).map((item, index) => <button
        className="product-thumb"
        data-selected={index === selected || undefined}
        type="button"
        key={item.url + index}
        onClick={() => setSelected(index)}
        aria-label={'Ver imagen ' + (index + 1) + ': ' + item.altText}
        aria-pressed={index === selected}
      >
        <Image src={item.url} alt="" width={90} height={90} unoptimized />
      </button>)}
    </div>}
    <div className="product-main-image">
      <Image src={image.url} alt={image.altText} width={720} height={720} priority unoptimized />
    </div>
  </div>;
}

import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PublicProductDetailDto } from '@bcm/shared';
import { productJsonLd, safeJsonLd } from '../features/catalog/seo';
import { discountPercentage } from '../features/catalog/model';

const product = {
  id: 'product-1',
  name: 'Producto BCM',
  slug: 'producto-bcm',
  sku: 'SKU-1',
  shortDescription: 'Descripción pública',
  fullDescription: null,
  seoTitle: null,
  seoDescription: 'Descripción SEO',
  category: { id: 'category-1', name: 'Celulares', slug: 'celulares' },
  brand: { id: 'brand-1', name: 'Marca QA', slug: 'marca-qa' },
  price: null,
  compareAtPrice: null,
  showPrice: false,
  saleMode: 'IN_STOCK',
  availability: 'AVAILABLE',
  featured: false,
  onSale: false,
  newArrival: false,
  publishedAt: '2026-09-23T00:00:00.000Z',
  thumbnail: { url: 'https://assets.example/product.jpg', altText: 'Producto' },
  images: [{ url: 'https://assets.example/product.jpg', altText: 'Producto' }],
  attributes: []
} satisfies PublicProductDetailDto;

test('product structured data contains only public catalog fields and canonical URL', () => {
  const json = productJsonLd(product, 'https://bcm.example/');
  assert.equal(json['@type'], 'Product');
  assert.equal(json.name, 'Producto BCM');
  assert.equal(json.url, 'https://bcm.example/producto/producto-bcm');
  assert.deepEqual(json.brand, { '@type': 'Brand', name: 'Marca QA' });
  assert.equal('price' in json, false);
  assert.equal('compareAtPrice' in json, false);
});

test('JSON-LD serialization neutralizes HTML-breaking characters', () => {
  const serialized = safeJsonLd({ name: '</script><script>alert(1)</script>' });
  assert.equal(serialized.includes('</script>'), false);
  assert.match(serialized, /\\u003c/);
});


test('discount badge is derived only from valid public offer prices', () => {
  assert.equal(discountPercentage({ onSale: true, showPrice: true, price: '80.00', compareAtPrice: '100.00' }), 20);
  assert.equal(discountPercentage({ onSale: false, showPrice: true, price: '80.00', compareAtPrice: '100.00' }), null);
  assert.equal(discountPercentage({ onSale: true, showPrice: false, price: '80.00', compareAtPrice: '100.00' }), null);
  assert.equal(discountPercentage({ onSale: true, showPrice: true, price: '100.00', compareAtPrice: '80.00' }), null);
});

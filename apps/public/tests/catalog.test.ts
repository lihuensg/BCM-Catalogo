import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PublicProductDetailDto, PublicProductListDto, PublicSettingsDto } from '@bcm/shared';
import { productJsonLd, safeJsonLd } from '../features/catalog/seo';
import { catalogQuery, discountPercentage, formatAmount, publicPrice, whatsappUrl } from '../features/catalog/model';

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

test('public money formatting and hidden prices never leak the internal amount', () => {
  assert.equal(formatAmount('1234567.80'), '1.234.567,80');
  const hidden = { showPrice: false, price: '999999.99' } as PublicProductListDto;
  assert.equal(publicPrice(hidden), null);
});

test('public WhatsApp template hides internal prices', () => {
  const settings = { whatsappNumber: '+54 9 11 1234-5678', whatsappMessageTemplate: 'Hola {{productName}} {{productUrl}} {{sku}} {{price}}' } as PublicSettingsDto;
  const hidden = { name: 'Producto', slug: 'producto', sku: 'ABC', showPrice: false, price: '100.00' } as PublicProductListDto & { sku: string };
  const url = whatsappUrl(settings, hidden, 'https://bcm.example');
  assert.ok(url?.startsWith('https://wa.me/5491112345678?text='));
  assert.equal(decodeURIComponent(url ?? '').includes('100,00'), false);
});

test('public catalog query ignores unknown input and normalizes pagination', () => {
  const query = catalogQuery({ page: '-9', search: '  iphone  ', sort: 'privateField', category: 'celulares', unknown: 'secret' });
  assert.equal(query.page, 1);
  assert.equal(query.search, 'iphone');
  assert.equal(query.sort, 'sortOrder');
  assert.equal('unknown' in query, false);
});

test('generic WhatsApp CTA omits product placeholders', () => {
  const settings = { whatsappNumber: '5491112345678', whatsappMessageTemplate: 'Hola {{productName}} {{price}}' } as PublicSettingsDto;
  assert.equal(whatsappUrl(settings), 'https://wa.me/5491112345678');
});

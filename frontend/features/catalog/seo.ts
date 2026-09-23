import type { PublicProductDetailDto } from '@bcm/shared';

export function productJsonLd(product: PublicProductDetailDto, siteUrl?: string) {
  const origin = siteUrl?.replace(/\/$/, '');
  const url = origin && URL.canParse(origin) ? origin + '/producto/' + product.slug : undefined;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.seoDescription ?? product.shortDescription,
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand.name } } : {}),
    category: product.category.name,
    ...(product.images.length ? { image: product.images.map(image => image.url) } : {}),
    ...(url ? { url } : {})
  };
}

export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

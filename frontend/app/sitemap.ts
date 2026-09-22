import type { MetadataRoute } from 'next';
import { getBrands, getCategories, getProducts } from '@/services/public/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '');
  if (!origin || !URL.canParse(origin)) return [];
  const [categories, brands, first] = await Promise.all([getCategories(), getBrands(), getProducts({ page: 1, pageSize: 60, sort: 'publishedAt', order: 'desc' })]);
  const products = [...(first?.data ?? [])];
  if (first && first.meta.totalPages > 1) {
    const pages = await Promise.all(Array.from({ length: first.meta.totalPages - 1 }, (_, index) => getProducts({ page: index + 2, pageSize: 60, sort: 'publishedAt', order: 'desc' })));
    for (const page of pages) if (page) products.push(...page.data);
  }
  const staticPaths = ['', '/catalogo', '/ofertas', '/destacados', '/nuevos'];
  return [
    ...staticPaths.map(path => ({ url: origin + path, changeFrequency: 'daily' as const, priority: path === '' ? 1 : .8 })),
    ...categories.filter(item => item.productCount > 0).map(item => ({ url: origin + '/categoria/' + item.slug, changeFrequency: 'daily' as const, priority: .7 })),
    ...brands.filter(item => item.productCount > 0).map(item => ({ url: origin + '/marca/' + item.slug, changeFrequency: 'daily' as const, priority: .6 })),
    ...products.map(product => ({ url: origin + '/producto/' + product.slug, lastModified: product.publishedAt, changeFrequency: 'weekly' as const, priority: .7 }))
  ];
}

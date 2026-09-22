import type { Availability, PublicProductListDto, PublicProductListQuery, PublicSettingsDto } from '@bcm/shared';

export const availabilityLabel: Record<Availability, string> = {
  AVAILABLE: 'Disponible',
  LOW_STOCK: 'Pocas unidades',
  OUT_OF_STOCK: 'Sin stock',
  CHECK_AVAILABILITY: 'Consultar disponibilidad',
  MADE_TO_ORDER: 'Por encargo'
};

export function formatAmount(value: string | null) {
  if (value === null) return null;
  const [whole, fraction = '00'] = value.split('.');
  return whole!.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + fraction.padEnd(2, '0');
}

export function publicPrice(product: Pick<PublicProductListDto, 'showPrice' | 'price'>) {
  return product.showPrice && product.price ? formatAmount(product.price) : null;
}

export function whatsappUrl(
  settings: PublicSettingsDto | null,
  product?: Pick<PublicProductListDto, 'name' | 'slug' | 'price' | 'showPrice'> & { sku?: string | null },
  origin = ''
) {
  if (!settings?.whatsappNumber) return null;
  const number = settings.whatsappNumber.replace(/\D/g, '');
  if (!number) return null;
  let template = settings.whatsappMessageTemplate ?? '';
  const values: Record<string, string> = {
    productName: product?.name ?? '',
    productUrl: product ? origin.replace(/\/$/, '') + '/producto/' + product.slug : '',
    sku: product?.sku ?? '',
    price: product?.showPrice && product.price ? formatAmount(product.price) ?? '' : ''
  };
  for (const [key, value] of Object.entries(values)) template = template.replaceAll('{{' + key + '}}', value);
  template = template.replace(/\{\{[^}]+\}\}/g, '').replace(/\s{2,}/g, ' ').trim();
  return 'https://wa.me/' + number + (template ? '?text=' + encodeURIComponent(template) : '');
}

export function catalogQuery(
  params: Record<string, string | string[] | undefined>,
  forced: Partial<PublicProductListQuery> = {}
): PublicProductListQuery {
  const first = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const page = Number(first('page') ?? '1');
  const sorts = ['sortOrder', 'publishedAt', 'price', 'name'] as const;
  const rawSort = first('sort');
  const search = first('search')?.trim();
  const category = first('category');
  const brand = first('brand');

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: 24,
    sort: sorts.includes(rawSort as typeof sorts[number]) ? rawSort as typeof sorts[number] : 'sortOrder',
    order: first('order') === 'desc' ? 'desc' : 'asc',
    ...(search ? { search } : {}),
    ...(category ? { category } : {}),
    ...(brand ? { brand } : {}),
    ...forced
  };
}

import type { Availability, PublicProductListDto, PublicProductListQuery, PublicSettingsDto, SaleMode } from '@bcm/shared';

export const availabilityLabel: Record<Availability, string> = {
  AVAILABLE: 'Disponible',
  LOW_STOCK: 'Pocas unidades',
  OUT_OF_STOCK: 'Sin stock',
  CHECK_AVAILABILITY: 'Consultar disponibilidad',
  MADE_TO_ORDER: 'Por encargo'
};
export const availabilityOptions = Object.entries(availabilityLabel) as [Availability, string][];
export const saleModeLabel: Record<SaleMode, string> = { IN_STOCK: 'En stock', MADE_TO_ORDER: 'Por encargo' };

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
function money(value: string | undefined) {
  return value && /^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/.test(value) ? value : undefined;
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
  const availabilities = Object.keys(availabilityLabel) as Availability[];
  const modes = Object.keys(saleModeLabel) as SaleMode[];
  const rawSort = first('sort');
  const rawAvailability = first('availability');
  const rawSaleMode = first('saleMode');
  const search = first('search')?.trim();
  const category = first('category');
  const brand = first('brand');
  const minPrice = money(first('minPrice'));
  const maxPrice = money(first('maxPrice'));

  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: 24,
    sort: sorts.includes(rawSort as typeof sorts[number]) ? rawSort as typeof sorts[number] : 'sortOrder',
    order: first('order') === 'desc' ? 'desc' : 'asc',
    ...(search ? { search } : {}),
    ...(category ? { category } : {}),
    ...(brand ? { brand } : {}),
    ...(minPrice ? { minPrice } : {}),
    ...(maxPrice ? { maxPrice } : {}),
    ...(availabilities.includes(rawAvailability as Availability) ? { availability: rawAvailability as Availability } : {}),
    ...(modes.includes(rawSaleMode as SaleMode) ? { saleMode: rawSaleMode as SaleMode } : {}),
    ...(first('onSale') === 'true' ? { onSale: true } : {}),
    ...(first('featured') === 'true' ? { featured: true } : {}),
    ...(first('newArrival') === 'true' ? { newArrival: true } : {}),
    ...forced
  };
}

import type { ProductAdminDetailDto, ProductPatchInput, ProductAttributeInput, ProductAttributeDefinitionDto } from '@bcm/shared';
export const availabilityLabels = { AVAILABLE: 'Disponible', LOW_STOCK: 'Pocas unidades', OUT_OF_STOCK: 'Sin stock', CHECK_AVAILABILITY: 'Consultar disponibilidad', MADE_TO_ORDER: 'Por encargo' };
export const saleLabels = { IN_STOCK: 'Venta de stock', MADE_TO_ORDER: 'Por encargo' };
export function formatAmount(value: string | null) { if (value === null)
    return 'Sin precio'; const [whole, fraction = '00'] = value.split('.'); return whole!.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + fraction.padEnd(2, '0'); }
export function priceLabel(value: string | null, visible: boolean) { return formatAmount(value) + (visible ? '' : ' · Interno'); }
export function blankProduct(): ProductPatchInput { return { name: '', slug: '', sku: null, shortDescription: '', fullDescription: null, categoryId: '', brandId: null, price: null, compareAtPrice: null, showPrice: false, saleMode: 'IN_STOCK', availability: 'CHECK_AVAILABILITY', active: false, featured: false, onSale: false, newArrival: false, sortOrder: 0, seoTitle: null, seoDescription: null, images: [], attributeValues: [] }; }
export function productToInput(row: ProductAdminDetailDto): ProductPatchInput { return { name: row.name, slug: row.slug, sku: row.sku, shortDescription: row.shortDescription, fullDescription: row.fullDescription, categoryId: row.categoryId, brandId: row.brandId, price: row.price, compareAtPrice: row.compareAtPrice, showPrice: row.showPrice, saleMode: row.saleMode, availability: row.availability, active: row.active, featured: row.featured, onSale: row.onSale, newArrival: row.newArrival, sortOrder: row.sortOrder, seoTitle: row.seoTitle, seoDescription: row.seoDescription, images: row.images.map(i => ({ ...i })), attributeValues: row.attributeValues.map(value => { switch (value.dataType) {
        case 'TEXT': return { attributeId: value.attributeId, dataType: 'TEXT', textValue: value.textValue ?? '' };
        case 'NUMBER': return { attributeId: value.attributeId, dataType: 'NUMBER', numberValue: value.numberValue ?? '' };
        case 'BOOLEAN': return { attributeId: value.attributeId, dataType: 'BOOLEAN', booleanValue: value.booleanValue ?? false };
        case 'OPTION': return { attributeId: value.attributeId, dataType: 'OPTION', optionId: value.optionId ?? '' };
    } }) }; }
const money = /^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/;
const cents = (s: string) => { const [a, b = ''] = s.split('.'); return BigInt(a!) * 100n + BigInt(b.padEnd(2, '0')); };
export function productErrors(input: ProductPatchInput, definitions: ProductAttributeDefinitionDto[] = []) {
    const errors: Record<string, string> = {};
    if (!input.name?.trim())
        errors.name = 'Ingresá un nombre.';
    if (!input.slug || !/^[-a-z0-9]+$/.test(input.slug) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug))
        errors.slug = 'Usá minúsculas, números y guiones.';
    if (!input.shortDescription?.trim())
        errors.shortDescription = 'Ingresá una descripción breve.';
    if (!input.categoryId)
        errors.categoryId = 'Seleccioná una categoría.';
    for (const key of ['price', 'compareAtPrice'] as const) {
        const v = input[key];
        if (v !== null && v !== undefined && !money.test(v))
            errors[key] = 'Usá un importe positivo con hasta 2 decimales y punto decimal.';
    }
    if (input.compareAtPrice && !errors.compareAtPrice) {
        if (!input.price)
            errors.compareAtPrice = 'Ingresá el precio actual.';
        else if (!errors.price && cents(input.compareAtPrice) <= cents(input.price))
            errors.compareAtPrice = 'El precio anterior debe superar al actual.';
    }
    if (input.saleMode === 'MADE_TO_ORDER' && !['MADE_TO_ORDER', 'CHECK_AVAILABILITY', 'OUT_OF_STOCK'].includes(input.availability ?? ''))
        errors.availability = 'Esta disponibilidad no corresponde a venta por encargo.';
    if (input.saleMode === 'IN_STOCK' && input.availability === 'MADE_TO_ORDER')
        errors.availability = 'Seleccioná una disponibilidad de stock.';
    if (input.active)
        for (const definition of definitions)
            if (definition.required && !input.attributeValues?.some(v => v.attributeId === definition.attributeId))
                errors.attributeValues = 'Completá todas las especificaciones requeridas para publicar.';
    return errors;
}
export function replaceAttribute(values: ProductAttributeInput[], id: string, value: ProductAttributeInput | null) { return [...values.filter(v => v.attributeId !== id), ...(value ? [value] : [])]; }
export function productQuery(params: URLSearchParams) { const allowed = ['search', 'categoryId', 'brandId', 'active', 'availability', 'saleMode', 'featured', 'onSale', 'newArrival', 'showPrice', 'sort', 'order', 'page', 'pageSize']; const result = new URLSearchParams(); for (const key of allowed) {
    const v = params.get(key);
    if (v)
        result.set(key, v);
} if (!result.has('page'))
    result.set('page', '1'); return result; }

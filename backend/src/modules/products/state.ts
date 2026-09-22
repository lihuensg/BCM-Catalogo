import type { Product, ProductAttributeValue } from '../../generated/prisma/client.js';
import { DomainError } from '../../shared/domain-error.js';
import { productFields } from './schema.js';
import { attributeValueSchema } from '../attributes/schema.js';
import type { GalleryImage, ProductPatch } from './mutation-schema.js';
export function storedAttribute(value: ProductAttributeValue) {
    const common = { attributeId: value.attributeId, dataType: value.dataType };
    switch (value.dataType) {
        case 'TEXT': return attributeValueSchema.parse({ ...common, textValue: value.textValue });
        case 'NUMBER': return attributeValueSchema.parse({ ...common, numberValue: value.numberValue?.toString() });
        case 'BOOLEAN': return attributeValueSchema.parse({ ...common, booleanValue: value.booleanValue });
        case 'OPTION': return attributeValueSchema.parse({ ...common, optionId: value.optionId });
    }
}
/** Both stored and PATCH money need wire strings before the single canonical validation. */
export function mergedProduct(row: Product, patch: ProductPatch) {
    const fields = productFields.omit({ images: true, attributeValues: true }).strip().parse({
        ...row, price: row.price?.toFixed(2) ?? null, compareAtPrice: row.compareAtPrice?.toFixed(2) ?? null
    });
    const merged = { ...fields, ...patch };
    return { ...merged, price: merged.price?.toFixed(2) ?? null, compareAtPrice: merged.compareAtPrice?.toFixed(2) ?? null };
}
export function attributeInput(value: ReturnType<typeof storedAttribute>) {
    return value.dataType === 'NUMBER' ? { ...value, numberValue: value.numberValue.toString() } : value;
}
export function validateGalleryOwnership(images: readonly GalleryImage[], current: readonly {
    id: string;
}[]) {
    const ids = images.flatMap(image => image.id ? [image.id] : []);
    if (new Set(ids).size !== ids.length || ids.some(id => !current.some(image => image.id === id))) {
        throw new DomainError('PRODUCT_IMAGE_INVALID', 'Hay IDs duplicados o imágenes ajenas al producto', 400);
    }
}

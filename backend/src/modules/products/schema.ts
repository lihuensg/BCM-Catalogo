import { z } from 'zod';
import { Availability, SaleMode } from '../../generated/prisma/enums.js';
import { httpUrlSchema, idSchema, moneySchema, optionalText, slugSchema, sortOrderSchema } from '../../shared/model-validation.js';
import { attributeValueSchema } from '../attributes/schema.js';
export const productImageSchema = z.strictObject({
    url: httpUrlSchema, altText: z.string().trim().min(1).max(300),
    isPrimary: z.boolean().default(false), sortOrder: sortOrderSchema
});
export const productFields = z.strictObject({
    name: z.string().trim().min(1).max(200),
    slug: slugSchema.max(220),
    sku: z.string().trim().min(1).max(100).nullable().default(null),
    shortDescription: z.string().trim().min(1).max(500),
    fullDescription: optionalText(100000),
    categoryId: idSchema,
    brandId: idSchema.nullable().default(null),
    price: moneySchema.nullable().default(null),
    compareAtPrice: moneySchema.nullable().default(null),
    showPrice: z.boolean().default(false),
    saleMode: z.enum(SaleMode).default('IN_STOCK'),
    availability: z.enum(Availability).default('CHECK_AVAILABILITY'),
    active: z.boolean().default(false),
    featured: z.boolean().default(false),
    onSale: z.boolean().default(false),
    newArrival: z.boolean().default(false),
    sortOrder: sortOrderSchema,
    seoTitle: optionalText(200),
    seoDescription: optionalText(500),
    images: z.array(productImageSchema).max(30).default([]),
    attributeValues: z.array(attributeValueSchema).max(200).default([])
});
export const productSchema = productFields.superRefine((product, context) => {
    if (product.price !== null && product.compareAtPrice !== null && !product.compareAtPrice.gt(product.price)) {
        context.addIssue({ code: 'custom', path: ['compareAtPrice'], message: 'Compare-at price must exceed price' });
    }
    if (product.compareAtPrice !== null && product.price === null) {
        context.addIssue({ code: 'custom', path: ['compareAtPrice'], message: 'Compare-at price requires a current price' });
    }
    const inconsistent = product.saleMode === 'MADE_TO_ORDER'
        ? !['MADE_TO_ORDER', 'CHECK_AVAILABILITY', 'OUT_OF_STOCK'].includes(product.availability)
        : product.availability === 'MADE_TO_ORDER';
    if (inconsistent)
        context.addIssue({ code: 'custom', path: ['availability'], message: 'Availability is inconsistent with sale mode' });
    if (product.images.filter((image) => image.isPrimary).length > 1) {
        context.addIssue({ code: 'custom', path: ['images'], message: 'At most one primary image is allowed' });
    }
    if (new Set(product.attributeValues.map((value) => value.attributeId)).size !== product.attributeValues.length) {
        context.addIssue({ code: 'custom', path: ['attributeValues'], message: 'Duplicate product attribute' });
    }
});
export type ProductInput = z.output<typeof productSchema>;

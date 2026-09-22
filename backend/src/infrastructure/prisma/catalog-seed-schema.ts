import { z } from 'zod';
import { Availability, SaleMode } from '../../generated/prisma/enums.js';
import { moneySchema, slugSchema } from '../../shared/model-validation.js';

const catalogProductSeed = z.strictObject({
    name: z.string().trim().min(1).max(200),
    slug: slugSchema,
    sku: z.string().trim().min(1).max(100).nullable().default(null),
    shortDescription: z.string().trim().min(1).max(500),
    categorySlug: slugSchema,
    brandSlug: slugSchema.nullable().default(null),
    price: moneySchema.nullable().default(null),
    compareAtPrice: moneySchema.nullable().default(null),
    showPrice: z.boolean().default(false),
    saleMode: z.enum(SaleMode).default('IN_STOCK'),
    availability: z.enum(Availability).default('CHECK_AVAILABILITY'),
    featured: z.boolean().default(false),
    onSale: z.boolean().default(false),
    newArrival: z.boolean().default(false),
    sortOrder: z.number().int().min(0).default(0)
}).superRefine((product, context) => {
    if (product.compareAtPrice && (!product.price || !product.compareAtPrice.gt(product.price))) {
        context.addIssue({ code: 'custom', path: ['compareAtPrice'], message: 'compareAtPrice must exceed price' });
    }
});

export const catalogSeedSchema = z.strictObject({
    site: z.strictObject({
        siteName: z.string().trim().min(1).max(160),
        defaultSeoTitle: z.string().trim().min(1).max(200),
        defaultSeoDescription: z.string().trim().min(1).max(500)
    }),
    categories: z.array(z.strictObject({ name: z.string().trim().min(1).max(160), slug: slugSchema, sortOrder: z.number().int().min(0).default(0) })).min(1).max(30),
    brands: z.array(z.strictObject({ name: z.string().trim().min(1).max(160), slug: slugSchema })).min(1).max(50),
    products: z.array(catalogProductSeed).min(1).max(100)
}).superRefine((data, context) => {
    for (const key of ['categories', 'brands', 'products'] as const) {
        if (new Set(data[key].map(item => item.slug)).size !== data[key].length) context.addIssue({ code: 'custom', path: [key], message: 'Duplicate slug' });
    }
    const categories = new Set(data.categories.map(item => item.slug));
    const brands = new Set(data.brands.map(item => item.slug));
    data.products.forEach((product, index) => {
        if (!categories.has(product.categorySlug)) context.addIssue({ code: 'custom', path: ['products', index, 'categorySlug'], message: 'Unknown category slug' });
        if (product.brandSlug && !brands.has(product.brandSlug)) context.addIssue({ code: 'custom', path: ['products', index, 'brandSlug'], message: 'Unknown brand slug' });
    });
});

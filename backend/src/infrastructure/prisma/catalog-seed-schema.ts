import { z } from 'zod';
import { AttributeDataType, Availability, SaleMode } from '../../generated/prisma/enums.js';
import { moneySchema, numericAttributeSchema, slugSchema } from '../../shared/model-validation.js';

const seedOption = z.strictObject({
    label: z.string().trim().min(1).max(160),
    value: z.string().trim().min(1).max(160),
    sortOrder: z.number().int().min(0).default(0)
});

const seedAttribute = z.strictObject({
    name: z.string().trim().min(1).max(160),
    slug: slugSchema,
    dataType: z.enum(AttributeDataType),
    unit: z.string().trim().min(1).max(40).nullable().default(null),
    filterable: z.boolean().default(false),
    options: z.array(seedOption).max(50).default([])
}).superRefine((attribute, context) => {
    if (attribute.dataType === 'OPTION' && attribute.options.length === 0) {
        context.addIssue({ code: 'custom', path: ['options'], message: 'OPTION attributes require options' });
    }
    if (attribute.dataType !== 'OPTION' && attribute.options.length > 0) {
        context.addIssue({ code: 'custom', path: ['options'], message: 'Only OPTION attributes may define options' });
    }
    if (new Set(attribute.options.map(option => option.value)).size !== attribute.options.length) {
        context.addIssue({ code: 'custom', path: ['options'], message: 'Duplicate option value' });
    }
});

const seedAttributeValue = z.discriminatedUnion('dataType', [
    z.strictObject({ attributeSlug: slugSchema, dataType: z.literal('TEXT'), textValue: z.string().trim().min(1).max(10000) }),
    z.strictObject({ attributeSlug: slugSchema, dataType: z.literal('NUMBER'), numberValue: numericAttributeSchema }),
    z.strictObject({ attributeSlug: slugSchema, dataType: z.literal('BOOLEAN'), booleanValue: z.boolean() }),
    z.strictObject({ attributeSlug: slugSchema, dataType: z.literal('OPTION'), optionValue: z.string().trim().min(1).max(160) })
]);

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
    sortOrder: z.number().int().min(0).default(0),
    attributeValues: z.array(seedAttributeValue).max(100).default([])
}).superRefine((product, context) => {
    if (product.compareAtPrice && (!product.price || !product.compareAtPrice.gt(product.price))) {
        context.addIssue({ code: 'custom', path: ['compareAtPrice'], message: 'compareAtPrice must exceed price' });
    }
    if (new Set(product.attributeValues.map(value => value.attributeSlug)).size !== product.attributeValues.length) {
        context.addIssue({ code: 'custom', path: ['attributeValues'], message: 'Duplicate product attribute' });
    }
});

export const catalogSeedSchema = z.strictObject({
    site: z.strictObject({
        siteName: z.string().trim().min(1).max(160),
        defaultSeoTitle: z.string().trim().min(1).max(200),
        defaultSeoDescription: z.string().trim().min(1).max(500),
        heroTitle: z.string().trim().min(1).max(200).nullable().default(null),
        heroSubtitle: z.string().trim().min(1).max(500).nullable().default(null)
    }),
    categories: z.array(z.strictObject({ name: z.string().trim().min(1).max(160), slug: slugSchema, sortOrder: z.number().int().min(0).default(0) })).min(1).max(30),
    brands: z.array(z.strictObject({ name: z.string().trim().min(1).max(160), slug: slugSchema })).min(1).max(50),
    attributes: z.array(seedAttribute).max(100).default([]),
    categoryAttributes: z.array(z.strictObject({
        categorySlug: slugSchema,
        attributeSlug: slugSchema,
        required: z.boolean().default(false),
        sortOrder: z.number().int().min(0).default(0)
    })).max(300).default([]),
    products: z.array(catalogProductSeed).min(1).max(100)
}).superRefine((data, context) => {
    for (const key of ['categories', 'brands', 'attributes', 'products'] as const) {
        if (new Set(data[key].map(item => item.slug)).size !== data[key].length) {
            context.addIssue({ code: 'custom', path: [key], message: 'Duplicate slug' });
        }
    }

    const categories = new Set(data.categories.map(item => item.slug));
    const brands = new Set(data.brands.map(item => item.slug));
    const attributes = new Map(data.attributes.map(item => [item.slug, item]));
    const associations = new Set<string>();

    data.categoryAttributes.forEach((association, index) => {
        const key = association.categorySlug + ':' + association.attributeSlug;
        if (associations.has(key)) {
            context.addIssue({ code: 'custom', path: ['categoryAttributes', index], message: 'Duplicate category attribute' });
        }
        associations.add(key);
        if (!categories.has(association.categorySlug)) {
            context.addIssue({ code: 'custom', path: ['categoryAttributes', index, 'categorySlug'], message: 'Unknown category slug' });
        }
        if (!attributes.has(association.attributeSlug)) {
            context.addIssue({ code: 'custom', path: ['categoryAttributes', index, 'attributeSlug'], message: 'Unknown attribute slug' });
        }
    });

    data.products.forEach((product, productIndex) => {
        if (!categories.has(product.categorySlug)) {
            context.addIssue({ code: 'custom', path: ['products', productIndex, 'categorySlug'], message: 'Unknown category slug' });
        }
        if (product.brandSlug && !brands.has(product.brandSlug)) {
            context.addIssue({ code: 'custom', path: ['products', productIndex, 'brandSlug'], message: 'Unknown brand slug' });
        }
        product.attributeValues.forEach((value, valueIndex) => {
            const definition = attributes.get(value.attributeSlug);
            if (!definition) {
                context.addIssue({ code: 'custom', path: ['products', productIndex, 'attributeValues', valueIndex, 'attributeSlug'], message: 'Unknown attribute slug' });
                return;
            }
            if (!associations.has(product.categorySlug + ':' + value.attributeSlug)) {
                context.addIssue({ code: 'custom', path: ['products', productIndex, 'attributeValues', valueIndex], message: 'Attribute is not assigned to product category' });
            }
            if (definition.dataType !== value.dataType) {
                context.addIssue({ code: 'custom', path: ['products', productIndex, 'attributeValues', valueIndex, 'dataType'], message: 'Attribute data type mismatch' });
            }
            if (value.dataType === 'OPTION' && !definition.options.some(option => option.value === value.optionValue)) {
                context.addIssue({ code: 'custom', path: ['products', productIndex, 'attributeValues', valueIndex, 'optionValue'], message: 'Unknown option value' });
            }
        });
    });
});

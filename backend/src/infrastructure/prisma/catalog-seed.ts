import type { PrismaClient } from '../../generated/prisma/client.js';
import { catalogSeedSchema } from './catalog-seed-schema.js';

export async function seedCatalog(client: PrismaClient, input: unknown) {
    const data = catalogSeedSchema.parse(input);
    return client.$transaction(async tx => {
        const categoryIds = new Map<string, string>();
        for (const category of data.categories) {
            const row = await tx.category.upsert({
                where: { slug: category.slug },
                create: { ...category, active: true },
                update: {}
            });
            categoryIds.set(category.slug, row.id);
        }

        const brandIds = new Map<string, string>();
        for (const brand of data.brands) {
            const row = await tx.brand.upsert({
                where: { slug: brand.slug },
                create: { ...brand, active: true },
                update: {}
            });
            brandIds.set(brand.slug, row.id);
        }

        const attributeIds = new Map<string, string>();
        const optionIds = new Map<string, string>();
        for (const definition of data.attributes) {
            const { options, ...fields } = definition;
            const row = await tx.attributeDefinition.upsert({
                where: { slug: definition.slug },
                create: { ...fields, active: true },
                update: {}
            });
            attributeIds.set(definition.slug, row.id);
            for (const option of options) {
                const created = await tx.attributeOption.upsert({
                    where: { attributeId_value: { attributeId: row.id, value: option.value } },
                    create: { attributeId: row.id, dataType: 'OPTION', ...option },
                    update: {}
                });
                optionIds.set(definition.slug + ':' + option.value, created.id);
            }
        }

        for (const association of data.categoryAttributes) {
            const categoryId = categoryIds.get(association.categorySlug)!;
            const attributeId = attributeIds.get(association.attributeSlug)!;
            await tx.categoryAttribute.upsert({
                where: { categoryId_attributeId: { categoryId, attributeId } },
                create: { categoryId, attributeId, required: association.required, sortOrder: association.sortOrder },
                update: {}
            });
        }

        await tx.siteSettings.upsert({
            where: { singleton: true },
            create: data.site,
            update: {}
        });

        let created = 0;
        for (const item of data.products) {
            const categoryId = categoryIds.get(item.categorySlug)!;
            const brandId = item.brandSlug ? brandIds.get(item.brandSlug)! : null;
            const existing = await tx.product.findUnique({ where: { slug: item.slug }, select: { id: true } });
            if (existing) continue;

            const product = await tx.product.create({
                data: {
                    name: item.name,
                    slug: item.slug,
                    sku: item.sku,
                    shortDescription: item.shortDescription,
                    categoryId,
                    brandId,
                    price: item.price,
                    compareAtPrice: item.compareAtPrice,
                    showPrice: item.showPrice,
                    saleMode: item.saleMode,
                    availability: item.availability,
                    featured: item.featured,
                    onSale: item.onSale,
                    newArrival: item.newArrival,
                    sortOrder: item.sortOrder,
                    active: true,
                    publishedAt: new Date()
                }
            });

            if (item.attributeValues.length) {
                await tx.productAttributeValue.createMany({
                    data: item.attributeValues.map(value => {
                        const attributeId = attributeIds.get(value.attributeSlug)!;
                        if (value.dataType === 'TEXT') {
                            return { productId: product.id, categoryId, attributeId, dataType: value.dataType, textValue: value.textValue };
                        }
                        if (value.dataType === 'NUMBER') {
                            return { productId: product.id, categoryId, attributeId, dataType: value.dataType, numberValue: value.numberValue };
                        }
                        if (value.dataType === 'BOOLEAN') {
                            return { productId: product.id, categoryId, attributeId, dataType: value.dataType, booleanValue: value.booleanValue };
                        }
                        return {
                            productId: product.id,
                            categoryId,
                            attributeId,
                            dataType: value.dataType,
                            optionId: optionIds.get(value.attributeSlug + ':' + value.optionValue)!
                        };
                    })
                });
            }
            created++;
        }

        return {
            categories: data.categories.length,
            brands: data.brands.length,
            attributes: data.attributes.length,
            products: data.products.length,
            productsCreated: created
        };
    });
}

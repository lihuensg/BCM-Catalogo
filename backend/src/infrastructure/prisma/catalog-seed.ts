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

        await tx.siteSettings.upsert({
            where: { singleton: true },
            create: data.site,
            update: {}
        });

        let created = 0;
        for (const seed of data.products) {
            const categoryId = categoryIds.get(seed.categorySlug)!;
            const brandId = seed.brandSlug ? brandIds.get(seed.brandSlug)! : null;
            const existing = await tx.product.findUnique({ where: { slug: seed.slug }, select: { id: true } });
            if (existing) continue;
            const { categorySlug: _categorySlug, brandSlug: _brandSlug, ...product } = seed;
            await tx.product.create({
                data: { ...product, categoryId, brandId, active: true, publishedAt: new Date() }
            });
            created++;
        }
        return { categories: data.categories.length, brands: data.brands.length, products: data.products.length, productsCreated: created };
    });
}

import type { PrismaClient } from '../../generated/prisma/client.js';
import { structuralSeedSchema } from './seed-schema.js';
export async function seedStructure(client: PrismaClient, input: unknown) {
    const data = structuralSeedSchema.parse(input);
    await client.$transaction(async (tx) => {
        for (const category of data.categories) {
            await tx.category.upsert({ where: { slug: category.slug }, create: category, update: {} });
        }
        for (const brand of data.brands) {
            await tx.brand.upsert({ where: { slug: brand.slug }, create: brand, update: {} });
        }
    });
    return { categories: data.categories.length, brands: data.brands.length };
}

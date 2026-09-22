import { pageArgs } from '../../shared/pagination.js';
import type { z } from 'zod';
import type { querySchema } from './admin-schema.js';
import type { GalleryImage } from './mutation-schema.js';
import type { AttributeValue } from '../attributes/schema.js';
import type { Prisma } from '../../generated/prisma/client.js';
export const productListSelect = {
    id: true, name: true, slug: true, sku: true, shortDescription: true, categoryId: true, brandId: true, price: true, compareAtPrice: true, showPrice: true,
    saleMode: true, availability: true, active: true, featured: true, onSale: true, newArrival: true, sortOrder: true, publishedAt: true, createdAt: true, updatedAt: true
} satisfies Prisma.ProductSelect;
export const productTableSelect = {...productListSelect,category:{select:{name:true}},brand:{select:{name:true}},images:{where:{isPrimary:true},take:1,select:{url:true,altText:true}}} satisfies Prisma.ProductSelect;
export type ProductTableRow=Prisma.ProductGetPayload<{select:typeof productTableSelect}>;
export type ProductListRow = Prisma.ProductGetPayload<{
    select: typeof productListSelect;
}>;
const relations = {
    category: true,
    brand: true,
    images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] },
    attributeValues: { orderBy: { attributeId: 'asc' }, include: { attribute: true, option: true } }
} satisfies Prisma.ProductInclude;
export function productRepository(db: Prisma.TransactionClient) {
    return {
        async list(q: z.output<typeof querySchema>) {
            const where: Prisma.ProductWhereInput = {
                ...(q.categoryId ? { categoryId: q.categoryId } : {}), ...(q.brandId ? { brandId: q.brandId } : {}),
                ...(q.showPrice !== undefined ? { showPrice: q.showPrice } : {}),
                ...(q.active !== undefined ? { active: q.active } : {}), ...(q.featured !== undefined ? { featured: q.featured } : {}), ...(q.onSale !== undefined ? { onSale: q.onSale } : {}), ...(q.newArrival !== undefined ? { newArrival: q.newArrival } : {}),
                ...(q.availability ? { availability: q.availability } : {}), ...(q.saleMode ? { saleMode: q.saleMode } : {}),
                ...(q.search ? { OR: [{ name: { contains: q.search, mode: 'insensitive' } }, { slug: { contains: q.search, mode: 'insensitive' } }, { sku: { contains: q.search, mode: 'insensitive' } }] } : {})
            };
            return { data: await db.product.findMany({ where, select: productTableSelect, ...pageArgs(q) }), total: await db.product.count({ where }) };
        },
        state: (id: string) => db.product.findUnique({ where: { id }, include: { images: { orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }] }, attributeValues: true } }),
        lifecycle: (id: string) => db.product.findUnique({ where: { id }, select: { id: true, slug: true, categoryId: true, active: true, updatedAt: true } }),
        update: (id: string, data: Prisma.ProductUncheckedUpdateInput) => db.product.update({ where: { id }, data }),
        clearValues: (productId: string) => db.productAttributeValue.deleteMany({ where: { productId } }),
        async insertValues(productId: string, categoryId: string, values: readonly AttributeValue[]) {
            if (values.length)
                await db.productAttributeValue.createMany({ data: values.map(value => ({ ...value, productId, categoryId })) });
        },
        async replaceGallery(productId: string, images: readonly GalleryImage[], existing: readonly {
            id: string;
            createdAt: Date;
        }[]) {
            const created = new Map(existing.map(image => [image.id, image.createdAt]));
            // ProductImage has no incoming FKs. Bulk replacement preserves retained IDs/createdAt.
            await db.productImage.deleteMany({ where: { productId } });
            if (images.length)
                await db.productImage.createMany({ data: images.map(image => ({
                        productId, url: image.url, altText: image.altText, sortOrder: image.sortOrder, isPrimary: image.isPrimary,
                        ...(image.id ? { id: image.id, createdAt: created.get(image.id)! } : {})
                    })) });
        },
        create: (data: Prisma.ProductUncheckedCreateInput) => db.product.create({ data, include: relations }),
        find: (id: string) => db.product.findUnique({ where: { id }, include: relations }),
        findImage: (id: string, productId: string) => db.productImage.findFirst({ where: { id, productId } }),
        clearPrimary: (productId: string) => db.productImage.updateMany({ where: { productId, isPrimary: true }, data: { isPrimary: false } }),
        setPrimary: (id: string) => db.productImage.update({ where: { id }, data: { isPrimary: true } })
    };
}

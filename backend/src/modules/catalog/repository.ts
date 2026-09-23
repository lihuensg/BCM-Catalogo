import type { Prisma, PrismaClient } from '../../generated/prisma/client.js';
import type { z } from 'zod';
import type { publicProductsQuery } from './schema.js';

export const publicProductSelect = {
    id: true,
    name: true,
    slug: true,
    shortDescription: true,
    price: true,
    compareAtPrice: true,
    showPrice: true,
    saleMode: true,
    availability: true,
    featured: true,
    onSale: true,
    newArrival: true,
    publishedAt: true,
    category: { select: { id: true, name: true, slug: true } },
    brand: { select: { id: true, name: true, slug: true } },
    images: { where: { isPrimary: true }, orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }], take: 1, select: { url: true, altText: true } }
} satisfies Prisma.ProductSelect;

export const publicProductDetailSelect = {
    ...publicProductSelect,
    sku: true,
    fullDescription: true,
    seoTitle: true,
    seoDescription: true,
    images: { orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }], select: { url: true, altText: true } },
    attributeValues: {
        where: { attribute: { active: true } },
        orderBy: { attributeId: 'asc' as const },
        select: {
            id: true,
            dataType: true,
            textValue: true,
            numberValue: true,
            booleanValue: true,
            attribute: { select: { id: true, name: true, slug: true, dataType: true, unit: true } },
            option: { select: { label: true } }
        }
    }
} satisfies Prisma.ProductSelect;

export type PublicProductRow = Prisma.ProductGetPayload<{ select: typeof publicProductSelect }>;
export type PublicProductDetailRow = Prisma.ProductGetPayload<{ select: typeof publicProductDetailSelect }>;
export type PublicQuery = z.output<typeof publicProductsQuery>;

function publicWhere(q: PublicQuery): Prisma.ProductWhereInput {
    const hasPriceConstraint = q.minPrice !== undefined || q.maxPrice !== undefined || q.sort === 'price';
    return {
        active: true,
        publishedAt: { not: null },
        category: { is: { active: true, ...(q.category ? { slug: q.category } : {}) } },
        ...(q.brand ? { brand: { is: { active: true, slug: q.brand } } } : {}),
        ...(q.availability ? { availability: q.availability } : {}),
        ...(q.saleMode ? { saleMode: q.saleMode } : {}),
        ...(q.featured !== undefined ? { featured: q.featured } : {}),
        ...(q.onSale !== undefined ? { onSale: q.onSale } : {}),
        ...(q.newArrival !== undefined ? { newArrival: q.newArrival } : {}),
        ...(hasPriceConstraint ? {
            showPrice: true,
            price: {
                ...(q.minPrice !== undefined ? { gte: q.minPrice } : {}),
                ...(q.maxPrice !== undefined ? { lte: q.maxPrice } : {})
            }
        } : {}),
        ...(q.search ? {
            OR: [
                { name: { contains: q.search, mode: 'insensitive' } },
                { shortDescription: { contains: q.search, mode: 'insensitive' } },
                { category: { is: { name: { contains: q.search, mode: 'insensitive' } } } },
                { brand: { is: { name: { contains: q.search, mode: 'insensitive' } } } }
            ]
        } : {})
    };
}

export function catalogRepository(db: PrismaClient) {
    return {
        async listProducts(q: PublicQuery) {
            const where = publicWhere(q);
            const orderBy = [{ [q.sort]: q.order }, { id: q.order }] as Prisma.ProductOrderByWithRelationInput[];
            const [data, total] = await Promise.all([
                db.product.findMany({
                    where,
                    select: publicProductSelect,
                    skip: (q.page - 1) * q.pageSize,
                    take: q.pageSize,
                    orderBy
                }),
                db.product.count({ where })
            ]);
            return { data, total };
        },
        productBySlug: (slug: string) => db.product.findFirst({
            where: { slug, active: true, publishedAt: { not: null }, category: { is: { active: true } } },
            select: publicProductDetailSelect
        }),
        relatedProducts: (categoryId: string, productId: string) => db.product.findMany({
            where: { id: { not: productId }, categoryId, active: true, publishedAt: { not: null }, category: { is: { active: true } } },
            select: publicProductSelect,
            orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { id: 'asc' }],
            take: 4
        }),
        categories: (take?: number) => db.category.findMany({
            where: { active: true },
            select: {
                id: true, name: true, slug: true, description: true, imageUrl: true, parentId: true, sortOrder: true,
                _count: { select: { products: { where: { active: true, publishedAt: { not: null } } } } }
            },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }],
            ...(take ? { take } : {})
        }),
        brands: (take?: number) => db.brand.findMany({
            where: { active: true },
            select: {
                id: true, name: true, slug: true, description: true, logoUrl: true,
                _count: { select: { products: { where: { active: true, publishedAt: { not: null } } } } }
            },
            orderBy: [{ name: 'asc' }, { id: 'asc' }],
            ...(take ? { take } : {})
        }),
        settings: () => db.siteSettings.findUnique({ where: { singleton: true } }),
        banners: (placement: 'HOME_HERO' | 'HOME_SECONDARY' | 'CATALOG_TOP', now: Date) => db.banner.findMany({
            where: {
                placement,
                active: true,
                AND: [
                    { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
                    { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }
                ]
            },
            orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
        }),
        homeProducts: (flag: 'featured' | 'onSale' | 'newArrival') => db.product.findMany({
            where: { active: true, publishedAt: { not: null }, category: { is: { active: true } }, [flag]: true },
            select: publicProductSelect,
            orderBy: [{ sortOrder: 'asc' }, { publishedAt: 'desc' }, { id: 'asc' }],
            take: 8
        })
    };
}

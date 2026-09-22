import type { PrismaClient, Prisma } from '../../generated/prisma/client.js';
const summary = { id: true, name: true, slug: true, active: true, updatedAt: true } satisfies Prisma.ProductSelect;
export function dashboardRepository(db: PrismaClient) {
    return {
        count: (where: Prisma.ProductWhereInput = {}) => db.product.count({ where }),
        categories: () => db.category.count(), brands: () => db.brand.count(),
        recent: (where: Prisma.ProductWhereInput = {}) => db.product.findMany({ where, select: summary, take: 5, orderBy: [{ updatedAt: 'desc' }, { id: 'asc' }] })
    };
}

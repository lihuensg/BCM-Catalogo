import { pageArgs } from '../../shared/pagination.js';
import type { ListQuery } from './admin-schema.js';
import type { Prisma } from '../../generated/prisma/client.js';
export function brandRepository(db: Prisma.TransactionClient) {
    return {
        async list(query: ListQuery) {
            const where: Prisma.BrandWhereInput = { ...(query.active !== undefined ? { active: query.active } : {}),
                ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { slug: { contains: query.search, mode: 'insensitive' } }] } : {}) };
            const data = await db.brand.findMany({ where, ...pageArgs(query) });
            const total = await db.brand.count({ where });
            return { data, total };
        },
        update: (id: string, data: Prisma.BrandUncheckedUpdateInput) => db.brand.update({ where: { id }, data }),
        remove: (id: string) => db.brand.delete({ where: { id } }),
        find: (id: string) => db.brand.findUnique({ where: { id } }),
        create: (data: Prisma.BrandCreateInput) => db.brand.create({ data })
    };
}

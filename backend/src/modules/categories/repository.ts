import { pageArgs } from '../../shared/pagination.js';
import type { ListQuery } from './admin-schema.js';
import type { Prisma } from '../../generated/prisma/client.js';
export function categoryRepository(db: Prisma.TransactionClient) {
    return {
        async list(query: ListQuery) {
            const where: Prisma.CategoryWhereInput = { ...(query.active !== undefined ? { active: query.active } : {}),
                ...(query.parentId !== undefined ? { parentId: query.parentId } : {}),
                ...(query.search ? { OR: [{ name: { contains: query.search, mode: 'insensitive' } }, { slug: { contains: query.search, mode: 'insensitive' } }] } : {}) };
            const data = await db.category.findMany({ where, ...pageArgs(query) });
            const total = await db.category.count({ where });
            return { data, total };
        },
        update: (id: string, data: Prisma.CategoryUncheckedUpdateInput) => db.category.update({ where: { id }, data }),
        remove: (id: string) => db.category.delete({ where: { id } }),
        create: (data: Prisma.CategoryUncheckedCreateInput) => db.category.create({ data }),
        find: (id: string) => db.category.findUnique({ where: { id } }),
        tree: () => db.category.findMany({ select: { id: true, parentId: true } }),
        move: (id: string, parentId: string | null) => db.category.update({ where: { id }, data: { parentId } }),
        requirements: (categoryId: string) => db.categoryAttribute.findMany({ where: { categoryId }, include: { attribute: { include: { options: true } } } }),
        associateAttribute: (data: Prisma.CategoryAttributeUncheckedCreateInput) => db.categoryAttribute.create({ data }),
        activeProductCount: (categoryId: string) => db.product.count({ where: { categoryId, active: true } })
    };
}

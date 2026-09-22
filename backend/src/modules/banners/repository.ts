import type { Prisma } from '../../generated/prisma/client.js';
import type { z } from 'zod';
import type { querySchema } from './admin-schema.js';
import { pageArgs } from '../../shared/pagination.js';
export function bannerRepository(db: Prisma.TransactionClient) {
    return {
        async list(q: z.output<typeof querySchema>) {
            const where: Prisma.BannerWhereInput = { ...(q.active !== undefined ? { active: q.active } : {}), ...(q.placement ? { placement: q.placement } : {}), ...(q.search ? { OR: [{ title: { contains: q.search, mode: 'insensitive' } }, { subtitle: { contains: q.search, mode: 'insensitive' } }] } : {}) };
            return { data: await db.banner.findMany({ where, ...pageArgs(q) }), total: await db.banner.count({ where }) };
        },
        find: (id: string) => db.banner.findUnique({ where: { id } }),
        create: (data: Prisma.BannerCreateInput) => db.banner.create({ data }),
        update: (id: string, data: Prisma.BannerUpdateInput) => db.banner.update({ where: { id }, data }),
        remove: (id: string) => db.banner.delete({ where: { id } })
    };
}

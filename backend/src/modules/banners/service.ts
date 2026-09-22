import type { PrismaClient } from '../../generated/prisma/client.js';
import { persistence } from '../../infrastructure/prisma/errors.js';
import { createUnitOfWork } from '../../infrastructure/prisma/unit-of-work.js';
import { DomainError } from '../../shared/domain-error.js';
import { pageResult } from '../../shared/pagination.js';
import { bannerRepository } from './repository.js';
import { bannerSchema } from './schema.js';
import { querySchema, createSchema, patchSchema } from './admin-schema.js';
export function bannerService(db: PrismaClient) {
    const repo = bannerRepository(db), transaction = createUnitOfWork(db);
    const get = async (id: string) => { const r = await repo.find(id); if (!r)
        throw new DomainError('BANNER_NOT_FOUND', 'Banner no encontrado'); return r; };
    return {
        get,
        async list(input: unknown) { const q = querySchema.parse(input), r = await repo.list(q); return pageResult(r.data, r.total, q); },
        create: (input: unknown) => persistence('BANNER', () => repo.create(createSchema.parse(input))),
        update: (id: string, input: unknown) => persistence('BANNER', () => transaction(async ({ banners }) => {
            const patch = patchSchema.parse(input), row = await banners.find(id);
            if (!row)
                throw new DomainError('BANNER_NOT_FOUND', 'Banner no encontrado');
            const fields = bannerSchema.strip().parse(row);
            return banners.update(id, bannerSchema.parse({ ...fields, ...patch }));
        })),
        remove: (id: string) => persistence('BANNER', () => repo.remove(id))
    };
}

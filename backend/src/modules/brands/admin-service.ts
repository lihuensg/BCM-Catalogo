import type { PrismaClient } from '../../generated/prisma/client.js';
import { createUnitOfWork } from '../../infrastructure/prisma/unit-of-work.js';
import { persistence } from '../../infrastructure/prisma/errors.js';
import { DomainError } from '../../shared/domain-error.js';
import { pageResult } from '../../shared/pagination.js';
import { brandRepository } from './repository.js';
import { createBrandService } from './service.js';
import { brandSchema } from './schema.js';
import { querySchema, patchSchema } from './admin-schema.js';
export function brandAdminService(db: PrismaClient) {
    const transaction = createUnitOfWork(db), repo = brandRepository(db), base = createBrandService(transaction);
    const get = async (id: string) => { const row = await repo.find(id); if (!row)
        throw new DomainError('BRAND_NOT_FOUND', 'Registro no encontrado'); return row; };
    return {
        async list(input: unknown) { const q = querySchema.parse(input); const result = await repo.list(q); return pageResult(result.data, result.total, q); },
        get,
        create: (input: unknown) => persistence('BRAND', () => base.create(input)),
        update: (id: string, input: unknown) => persistence('BRAND', () => transaction(async ({ brands: repository }) => {
            const patch = patchSchema.parse(input), current = await repository.find(id);
            if (!current)
                throw new DomainError('BRAND_NOT_FOUND', 'Registro no encontrado');
            const fields = brandSchema.strip().parse(current);
            const data = brandSchema.parse({ ...fields, ...patch });
            return repository.update(id, data);
        })),
        remove: (id: string) => persistence('BRAND', () => repo.remove(id))
    };
}

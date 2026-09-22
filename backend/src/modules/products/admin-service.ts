import type { PrismaClient } from '../../generated/prisma/client.js';
import { DomainError } from '../../shared/domain-error.js';
import { pageResult } from '../../shared/pagination.js';
import { productRepository } from './repository.js';
import { createUnitOfWork } from '../../infrastructure/prisma/unit-of-work.js';
import { createProductService } from './service.js';
import { productOperation } from './errors.js';
import type { ProductMutationHook } from './events.js';
import { querySchema } from './admin-schema.js';
export function productAdminService(db: PrismaClient, hook?: ProductMutationHook) {
    const repo = productRepository(db);
    const mutations = createProductService(createUnitOfWork(db), hook);
    return {
        create: (input: unknown) => productOperation(() => mutations.create(input)),
        update: (id: string, input: unknown) => productOperation(() => mutations.update(id, input)),
        deactivate: (id: string) => productOperation(() => mutations.deactivate(id)),
        async list(input: unknown) { const q = querySchema.parse(input), r = await repo.list(q); return pageResult(r.data, r.total, q); },
        async get(id: string) {
            const row = await repo.find(id);
            if (!row)
                throw new DomainError('PRODUCT_NOT_FOUND', 'Producto no encontrado');
            return row;
        }
    };
}

import type { PrismaClient } from '../../generated/prisma/client.js';
import { createUnitOfWork } from '../../infrastructure/prisma/unit-of-work.js';
import { persistence } from '../../infrastructure/prisma/errors.js';
import { DomainError } from '../../shared/domain-error.js';
import { pageResult } from '../../shared/pagination.js';
import { categoryRepository } from './repository.js';
import { createCategoryService } from './service.js';
import { categorySchema } from './schema.js';
import { querySchema, patchSchema } from './admin-schema.js';
import { validateCategoryParent } from './rules.js';
export function categoryAdminService(db: PrismaClient) {
    const transaction = createUnitOfWork(db), repo = categoryRepository(db), base = createCategoryService(transaction);
    const get = async (id: string) => { const row = await repo.find(id); if (!row)
        throw new DomainError('CATEGORY_NOT_FOUND', 'Registro no encontrado'); return row; };
    return {
        async list(input: unknown) { const q = querySchema.parse(input); const result = await repo.list(q); return pageResult(result.data, result.total, q); },
        get,
        create: (input: unknown) => persistence('CATEGORY', () => base.create(input)),
        update: (id: string, input: unknown) => persistence('CATEGORY', () => transaction(async ({ categories: repository }) => {
            const patch = patchSchema.parse(input), current = await repository.find(id);
            if (!current)
                throw new DomainError('CATEGORY_NOT_FOUND', 'Registro no encontrado');
            const fields = categorySchema.strip().parse(current);
            const data = categorySchema.parse({ ...fields, ...patch });
            validateCategoryParent(id, data.parentId, await repository.tree());
            if (!data.active && current.active && await repository.activeProductCount(id) > 0)
                throw new DomainError('CATEGORY_IN_USE', 'Desactivá los productos antes de desactivar su categoría');
            return repository.update(id, data);
        })),
        remove: (id: string) => persistence('CATEGORY', () => repo.remove(id))
    };
}

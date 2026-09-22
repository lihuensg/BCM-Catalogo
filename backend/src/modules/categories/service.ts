import { withTransaction, type UnitOfWork } from '../../infrastructure/prisma/unit-of-work.js';
import { DomainError } from '../../shared/domain-error.js';
import { idSchema } from '../../shared/model-validation.js';
import { categorySchema } from './schema.js';
import { validateCategoryParent } from './rules.js';
export function createCategoryService(transaction: UnitOfWork = withTransaction) {
    return {
        create(input: unknown) {
            const data = categorySchema.parse(input);
            return transaction(async ({ categories }) => {
                if (data.parentId && !await categories.find(data.parentId))
                    throw new DomainError('CATEGORY_NOT_FOUND', 'Parent category does not exist');
                return categories.create(data);
            });
        },
        move(id: string, parentId: string | null) {
            idSchema.parse(id);
            idSchema.nullable().parse(parentId);
            return transaction(async ({ categories }) => {
                validateCategoryParent(id, parentId, await categories.tree());
                return categories.move(id, parentId);
            });
        }
    };
}

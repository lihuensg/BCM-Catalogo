import { withTransaction, type UnitOfWork } from '../../infrastructure/prisma/unit-of-work.js';
import { brandSchema } from './schema.js';
export function createBrandService(transaction: UnitOfWork = withTransaction) {
    return { create(input: unknown) {
            const data = brandSchema.parse(input);
            return transaction(({ brands }) => brands.create(data));
        } };
}

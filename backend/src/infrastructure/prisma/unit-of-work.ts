import { Prisma, type PrismaClient } from '../../generated/prisma/client.js';
import { bannerRepository } from '../../modules/banners/repository.js';
import { categoryRepository } from '../../modules/categories/repository.js';
import { brandRepository } from '../../modules/brands/repository.js';
import { attributeRepository } from '../../modules/attributes/repository.js';
import { productRepository } from '../../modules/products/repository.js';
import { getPrismaClient } from './client.js';
function repositories(db: Prisma.TransactionClient) {
    return {
        banners: bannerRepository(db), categories: categoryRepository(db), brands: brandRepository(db),
        attributes: attributeRepository(db), products: productRepository(db)
    };
}
export type Repositories = ReturnType<typeof repositories>;
export type UnitOfWork = <T>(operation: (repositories: Repositories) => Promise<T>) => Promise<T>;
/** Short serializable transactions; retry serialization conflicts, never arbitrary errors. */
export function createUnitOfWork(client: PrismaClient): UnitOfWork {
    return async (operation) => {
        for (let attempt = 0;; attempt++) {
            try {
                return await client.$transaction((tx) => operation(repositories(tx)), {
                    isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 10000
                });
            }
            catch (error) {
                if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034' || attempt >= 2)
                    throw error;
            }
        }
    };
}
export const withTransaction: UnitOfWork = (operation) => createUnitOfWork(getPrismaClient())(operation);

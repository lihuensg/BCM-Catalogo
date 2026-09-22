import { Prisma } from '../../generated/prisma/client.js';
import { DomainError } from '../../shared/domain-error.js';
export async function persistence<T>(entity: string, operation: () => Promise<T>): Promise<T> {
    try {
        return await operation();
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002')
                throw new DomainError(entity + (['CATEGORY', 'BRAND', 'ATTRIBUTE'].includes(entity) ? '_SLUG_EXISTS' : '_ALREADY_EXISTS'), 'El registro ya existe');
            if (error.code === 'P2003')
                throw new DomainError(entity + '_IN_USE', 'La operación afecta relaciones existentes o inválidas');
            if (error.code === 'P2025')
                throw new DomainError(entity + '_NOT_FOUND', 'Registro no encontrado');
            if (error.code === 'P2034')
                throw new DomainError('CONCURRENT_MODIFICATION', 'Reintentá la operación');
        }
        throw error;
    }
}

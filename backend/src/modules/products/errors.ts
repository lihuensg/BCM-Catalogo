import { ZodError } from 'zod';
import { Prisma } from '../../generated/prisma/client.js';
import { DomainError } from '../../shared/domain-error.js';
const ruleCodes: Record<string, string> = {
    CATEGORY_NOT_FOUND: 'PRODUCT_CATEGORY_INVALID', CATEGORY_INACTIVE: 'PRODUCT_NOT_PUBLISHABLE',
    REQUIRED_ATTRIBUTE_MISSING: 'PRODUCT_ATTRIBUTE_REQUIRED', ATTRIBUTE_NOT_ASSIGNED: 'PRODUCT_ATTRIBUTE_INVALID',
    ATTRIBUTE_TYPE_MISMATCH: 'PRODUCT_ATTRIBUTE_INVALID', ATTRIBUTE_INACTIVE: 'PRODUCT_ATTRIBUTE_INVALID',
    INVALID_ATTRIBUTE_OPTION: 'PRODUCT_ATTRIBUTE_INVALID', DUPLICATE_ATTRIBUTE: 'PRODUCT_ATTRIBUTE_INVALID', IMAGE_NOT_FOUND: 'PRODUCT_IMAGE_INVALID'
};
export async function productOperation<T>(operation: () => Promise<T>): Promise<T> {
    try {
        return await operation();
    }
    catch (error) {
        if (error instanceof DomainError && ruleCodes[error.code])
            throw new DomainError(ruleCodes[error.code]!, error.message, 400);
        if (error instanceof ZodError) {
            const fields = error.issues.map(issue => issue.path[0]);
            const code = fields.some(f => f === 'price' || f === 'compareAtPrice') ? 'PRODUCT_PRICE_INVALID'
                : fields.includes('images') ? 'PRODUCT_IMAGE_INVALID' : fields.includes('attributeValues') ? 'PRODUCT_ATTRIBUTE_INVALID'
                    : fields.includes('categoryId') ? 'PRODUCT_CATEGORY_INVALID' : undefined;
            if (code)
                throw new DomainError(code, 'Datos de producto inválidos', 400);
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                const target = JSON.stringify(error.meta ?? {}).toLowerCase();
                const code = target.includes('sku') ? 'PRODUCT_SKU_EXISTS' : target.includes('slug') ? 'PRODUCT_SLUG_EXISTS' : 'PRODUCT_CONFLICT';
                throw new DomainError(code, 'El SKU o slug ya está en uso');
            }
            if (error.code === 'P2025')
                throw new DomainError('PRODUCT_NOT_FOUND', 'Producto no encontrado');
            if (error.code === 'P2003')
                throw new DomainError('PRODUCT_RELATION_INVALID', 'La relación no existe o cambió durante la operación', 400);
            if (error.code === 'P2034')
                throw new DomainError('CONCURRENT_MODIFICATION', 'Reintentá la operación');
        }
        throw error;
    }
}

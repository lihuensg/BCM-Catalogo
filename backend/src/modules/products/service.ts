import { withTransaction, type UnitOfWork, type Repositories } from '../../infrastructure/prisma/unit-of-work.js';
import { DomainError } from '../../shared/domain-error.js';
import { idSchema } from '../../shared/model-validation.js';
import { productSchema, type ProductInput } from './schema.js';
import { patchSchema } from './mutation-schema.js';
import { validateProductAttributes, validatePublication } from './rules.js';
import { mergedProduct, storedAttribute, attributeInput, validateGalleryOwnership } from './state.js';
import { notifyProductMutation, noProductMutationHook, type ProductMutationHook } from './events.js';
async function validateRelations(data: ProductInput, repositories: Repositories) {
    const category = await repositories.categories.find(data.categoryId);
    if (!category)
        throw new DomainError('CATEGORY_NOT_FOUND', 'La categoría no existe');
    if (data.brandId && !await repositories.brands.find(data.brandId))
        throw new DomainError('PRODUCT_BRAND_INVALID', 'La marca no existe', 400);
    if (data.active)
        validatePublication(category);
    validateProductAttributes(data.attributeValues, await repositories.categories.requirements(data.categoryId), data.active);
}
const missing = () => new DomainError('PRODUCT_NOT_FOUND', 'Producto no encontrado');
export function createProductService(transaction: UnitOfWork = withTransaction, hook: ProductMutationHook = noProductMutationHook) {
    async function update(id: string, input: unknown) {
        idSchema.parse(id);
        const patch = patchSchema.parse(input);
        const result = await transaction(async (repositories) => {
            const { products } = repositories;
            const current = await products.state(id);
            if (!current)
                throw missing();
            if (patch.categoryId !== undefined && patch.categoryId !== current.categoryId && patch.attributeValues === undefined) {
                throw new DomainError('PRODUCT_ATTRIBUTE_INVALID', 'El cambio de categoría requiere attributeValues explícitos, incluso []', 400);
            }
            const gallery = patch.images ?? current.images;
            validateGalleryOwnership(gallery, current.images);
            const values = patch.attributeValues ?? current.attributeValues.map(storedAttribute);
            const { images: _images, attributeValues, ...data } = productSchema.parse({
                ...mergedProduct(current, patch),
                images: gallery.map(image => ({ url: image.url, altText: image.altText, isPrimary: image.isPrimary, sortOrder: image.sortOrder })),
                attributeValues: values.map(attributeInput)
            });
            await validateRelations({ ...data, images: _images, attributeValues }, repositories);
            // Composite FK requires removing the old values before changing categoryId.
            if (patch.attributeValues !== undefined)
                await products.clearValues(id);
            await products.update(id, { ...data, publishedAt: data.active ? (current.publishedAt ?? new Date()) : current.publishedAt });
            if (patch.images !== undefined)
                await products.replaceGallery(id, gallery, current.images);
            if (patch.attributeValues !== undefined)
                await products.insertValues(id, data.categoryId, attributeValues);
            const row = await products.find(id);
            if (!row)
                throw missing();
            return { row, previous: current };
        });
        await notifyProductMutation(hook, result.row, result.previous);
        return result.row;
    }
    return {
        async create(input: unknown) {
            const data = productSchema.parse(input);
            const row = await transaction(async (repositories) => {
                await validateRelations(data, repositories);
                const { images, attributeValues, ...product } = data;
                return repositories.products.create({ ...product, publishedAt: product.active ? new Date() : null,
                    images: { create: images }, attributeValues: { create: attributeValues } });
            });
            await notifyProductMutation(hook, row);
            return row;
        },
        update,
        publish: (id: string) => update(id, { active: true }),
        async deactivate(id: string) {
            idSchema.parse(id);
            const result = await transaction(async ({ products }) => {
                const previous = await products.lifecycle(id);
                if (!previous)
                    throw missing();
                if (!previous.active)
                    return { row: previous, previous, changed: false };
                const row = await products.update(id, { active: false });
                return { row, previous, changed: true };
            });
            if (result.changed)
                await notifyProductMutation(hook, result.row, result.previous);
        },
        async setPrimaryImage(productId: string, imageId: string) {
            idSchema.parse(productId);
            idSchema.parse(imageId);
            const result = await transaction(async ({ products }) => {
                const previous = await products.lifecycle(productId);
                if (!previous)
                    throw missing();
                if (!await products.findImage(imageId, productId))
                    throw new DomainError('IMAGE_NOT_FOUND', 'La imagen no pertenece al producto');
                await products.clearPrimary(productId);
                const image = await products.setPrimary(imageId);
                const row = await products.update(productId, { updatedAt: new Date() });
                return { row, previous, image };
            });
            await notifyProductMutation(hook, result.row, result.previous);
            return result.image;
        }
    };
}

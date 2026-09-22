export interface ProductMutationEvent {
    type: 'ProductPublished' | 'ProductUpdated' | 'ProductUnpublished';
    productId: string;
    slug: string;
    previousSlug: string | null;
    categoryId: string;
    previousCategoryId: string | null;
    updatedAt: string;
}
export type ProductMutationHook = (event: Readonly<ProductMutationEvent>) => Promise<void> | void;
export const noProductMutationHook: ProductMutationHook = () => { };
interface ProductState {
    id: string;
    slug: string;
    categoryId: string;
    active: boolean;
    updatedAt: Date;
}
/** Call only after commit, outside SERIALIZABLE retry callbacks. No durable delivery yet. */
export async function notifyProductMutation(hook: ProductMutationHook, row: ProductState, previous?: Pick<ProductState, 'slug' | 'categoryId' | 'active'>) {
    const type = row.active && !previous?.active ? 'ProductPublished'
        : !row.active && previous?.active ? 'ProductUnpublished' : 'ProductUpdated';
    try {
        await hook(Object.freeze({ type, productId: row.id, slug: row.slug, previousSlug: previous?.slug ?? null,
            categoryId: row.categoryId, previousCategoryId: previous?.categoryId ?? null, updatedAt: row.updatedAt.toISOString() }));
    }
    catch {
        console.error(JSON.stringify({ event: 'product.notification.failed', productId: row.id, type }));
    }
}

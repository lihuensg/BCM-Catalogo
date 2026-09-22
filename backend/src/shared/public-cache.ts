import type { ProductMutationHook } from '../modules/products/events.js';

export type PublicInvalidationHook = (tags: readonly string[]) => Promise<void> | void;

export function createFrontendInvalidation(url?: string, secret?: string): PublicInvalidationHook {
    if (!url || !secret) return () => undefined;
    return async (tags) => {
        const unique = [...new Set(tags)];
        if (!unique.length) return;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + secret },
            body: JSON.stringify({ tags: unique }),
            signal: AbortSignal.timeout(5000)
        });
        if (!response.ok) throw new Error('Frontend revalidation failed');
    };
}

export function productInvalidationHook(invalidate: PublicInvalidationHook): ProductMutationHook {
    return async (event) => {
        const tags = ['public-products', 'public-home', 'public-product-' + event.slug];
        if (event.previousSlug && event.previousSlug !== event.slug) tags.push('public-product-' + event.previousSlug);
        await invalidate(tags);
    };
}

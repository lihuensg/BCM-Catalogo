import { z } from 'zod';
import { categorySchema } from '../../modules/categories/schema.js';
import { brandSchema } from '../../modules/brands/schema.js';
/** Stage 01 only seeds optional structural roots/brands, never products or credentials. */
export const structuralSeedSchema = z.strictObject({
    categories: z.array(categorySchema.omit({ parentId: true })).max(100).default([]),
    brands: z.array(brandSchema).max(100).default([])
}).superRefine((data, context) => {
    for (const key of ['categories', 'brands'] as const) {
        if (new Set(data[key].map((item) => item.slug)).size !== data[key].length) {
            context.addIssue({ code: 'custom', path: [key], message: 'Duplicate seed slug' });
        }
    }
});

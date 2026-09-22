import { z } from 'zod';
import { httpUrlSchema, idSchema, nameSchema, optionalText, slugSchema, sortOrderSchema } from '../../shared/model-validation.js';
export const categorySchema = z.strictObject({
    name: nameSchema,
    slug: slugSchema.max(180),
    description: optionalText(20000),
    imageUrl: httpUrlSchema.nullable().default(null),
    parentId: idSchema.nullable().default(null),
    active: z.boolean().default(false),
    sortOrder: sortOrderSchema
});

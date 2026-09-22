import { z } from 'zod';
import { httpUrlSchema, nameSchema, optionalText, slugSchema } from '../../shared/model-validation.js';
export const brandSchema = z.strictObject({
    name: nameSchema, slug: slugSchema.max(180), description: optionalText(20000),
    logoUrl: httpUrlSchema.nullable().default(null), active: z.boolean().default(false)
});

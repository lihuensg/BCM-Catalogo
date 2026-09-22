import { z } from 'zod';
import { idSchema } from './model-validation.js';
export const idParams = z.strictObject({ id: idSchema });
export const emptyQuery = z.strictObject({});
/** PATCH must never apply create defaults to omitted fields. */
export function editable<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
    const shape = Object.fromEntries(Object.entries(schema.shape).map(([key, field]) => [
        key, z.optional(field instanceof z.ZodDefault ? field.removeDefault() : field)
    ])) as {
        [K in keyof T]: z.ZodOptional<T[K] extends z.ZodDefault<infer U> ? U : T[K]>;
    };
    return z.strictObject(shape).refine(value => Object.keys(value).length > 0, 'At least one editable field is required');
}

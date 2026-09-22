import { z } from 'zod';
import { nameSchema } from '../../shared/model-validation.js';
export const loginSchema = z.strictObject({
    email: z.email().max(254).transform(value => value.toLowerCase()),
    password: z.string().min(1).max(256)
});
export const adminSeedSchema = loginSchema.extend({ password: z.string().min(12).max(256), name: nameSchema });
/** Persistence input only, not a login endpoint. Hash generation belongs to authentication. */
export const adminUserSchema = z.strictObject({
    name: nameSchema,
    email: z.email().max(254).transform((value) => value.toLowerCase()),
    passwordHash: z.string().min(50).max(512).regex(/^\$(?:argon2id|2[aby]|scrypt)\$/),
    active: z.boolean().default(false)
});

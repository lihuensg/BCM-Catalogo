import { z } from 'zod';
import { Prisma } from '../generated/prisma/client.js';
export const idSchema = z.uuid();
export const nameSchema = z.string().trim().min(1).max(160);
export const slugSchema = z.string().trim().min(1).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const sortOrderSchema = z.number().int().min(0).max(2147483647).default(0);
export const httpUrlSchema = z.string().url().refine((value) => {
    const url = URL.parse(value);
    return url !== null && ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
}, 'Expected an HTTP(S) URL without credentials');
/** Strings only: reject JS float input, rounding, exponents, NaN and Infinity. */
export const moneySchema = z.string().regex(/^(?:0|[1-9]\d{0,15})(?:\.\d{1,2})?$/).transform((value) => new Prisma.Decimal(value));
export const numericAttributeSchema = z.string().regex(/^-?(?:0|[1-9]\d{0,17})(?:\.\d{1,6})?$/).transform((value) => new Prisma.Decimal(value));
export function optionalText(max: number) {
    return z.string().trim().min(1).max(max).nullable().default(null);
}

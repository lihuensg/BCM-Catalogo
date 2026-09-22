import { z } from 'zod';
import { Availability, SaleMode } from '../../generated/prisma/enums.js';
import { moneySchema, slugSchema } from '../../shared/model-validation.js';
import { queryBoolean } from '../../shared/pagination.js';

export const publicProductsQuery = z.strictObject({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    pageSize: z.coerce.number().int().min(1).max(60).default(24),
    search: z.string().trim().max(160).optional(),
    sort: z.enum(['sortOrder', 'publishedAt', 'price', 'name']).default('sortOrder'),
    order: z.enum(['asc', 'desc']).default('asc'),
    category: slugSchema.optional(),
    brand: slugSchema.optional(),
    minPrice: moneySchema.optional(),
    maxPrice: moneySchema.optional(),
    availability: z.enum(Availability).optional(),
    saleMode: z.enum(SaleMode).optional(),
    featured: queryBoolean,
    onSale: queryBoolean,
    newArrival: queryBoolean
}).superRefine((value, context) => {
    if (value.minPrice && value.maxPrice && value.minPrice.gt(value.maxPrice)) {
        context.addIssue({ code: 'custom', path: ['maxPrice'], message: 'maxPrice must be greater than or equal to minPrice' });
    }
});

export const slugParams = z.strictObject({ slug: slugSchema });

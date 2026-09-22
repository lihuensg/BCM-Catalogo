import { z } from 'zod';
import { Availability, SaleMode } from '../../generated/prisma/enums.js';
import { idSchema } from '../../shared/model-validation.js';
import { listSchema, queryBoolean } from '../../shared/pagination.js';
export const querySchema = listSchema(['name', 'slug', 'price', 'sortOrder', 'createdAt', 'updatedAt', 'publishedAt'] as const, 'sortOrder').extend({
    categoryId: idSchema.optional(), brandId: idSchema.optional(), active: queryBoolean, showPrice: queryBoolean, featured: queryBoolean, onSale: queryBoolean, newArrival: queryBoolean,
    availability: z.enum(Availability).optional(), saleMode: z.enum(SaleMode).optional()
});

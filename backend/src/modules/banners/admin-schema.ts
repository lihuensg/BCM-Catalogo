import { z } from 'zod';
import { listSchema, queryBoolean } from '../../shared/pagination.js';
import { editable } from '../../shared/http.js';
import { bannerFields, bannerSchema } from './schema.js';
const date = z.iso.datetime({ offset: true }).transform(v => new Date(v)).nullable();
export const bannerInput = bannerFields.extend({ startsAt: date.default(null), endsAt: date.default(null) });
export const createSchema = bannerInput.transform(value => bannerSchema.parse(value));
export const patchSchema = editable(bannerInput);
export const querySchema = listSchema(['title', 'sortOrder', 'createdAt', 'updatedAt', 'startsAt'] as const, 'sortOrder').extend({ active: queryBoolean, placement: bannerFields.shape.placement.optional() });

import type { z } from 'zod';
import { listSchema, queryBoolean } from '../../shared/pagination.js';
import { editable } from '../../shared/http.js';
import { brandSchema } from './schema.js';
export const querySchema = listSchema(["name", "slug", "createdAt", "updatedAt"] as const, 'name').extend({ active: queryBoolean, });
export type ListQuery = z.output<typeof querySchema>;
export const patchSchema = editable(brandSchema);

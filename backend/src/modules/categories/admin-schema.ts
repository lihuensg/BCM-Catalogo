import type { z } from 'zod';
import { idSchema } from '../../shared/model-validation.js';
import { listSchema, queryBoolean } from '../../shared/pagination.js';
import { editable } from '../../shared/http.js';
import { categorySchema } from './schema.js';
export const querySchema = listSchema(["name", "slug", "sortOrder", "createdAt", "updatedAt"] as const, 'sortOrder').extend({ active: queryBoolean, parentId: idSchema.nullable().optional(), });
export type ListQuery = z.output<typeof querySchema>;
export const patchSchema = editable(categorySchema);

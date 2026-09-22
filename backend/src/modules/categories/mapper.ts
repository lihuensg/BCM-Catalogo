import type { Category } from '../../generated/prisma/client.js';
import type { CategoryDto } from '@bcm/shared';
export function categoryDto(row: Category): CategoryDto { return { id: row.id, name: row.name, slug: row.slug, description: row.description, imageUrl: row.imageUrl, parentId: row.parentId, active: row.active, sortOrder: row.sortOrder, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }; }

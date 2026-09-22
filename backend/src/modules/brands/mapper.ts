import type { Brand } from '../../generated/prisma/client.js';
import type { BrandDto } from '@bcm/shared';
export function brandDto(row: Brand): BrandDto { return { id: row.id, name: row.name, slug: row.slug, description: row.description, logoUrl: row.logoUrl, active: row.active, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() }; }

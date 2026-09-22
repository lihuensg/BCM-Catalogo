import type { AttributeDefinition, AttributeOption, CategoryAttribute } from '../../generated/prisma/client.js';
import type { AttributeDto, AttributeOptionDto, CategoryAttributeDto } from '@bcm/shared';
const timestamps = (r: {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}) => ({ id: r.id, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() });
export const attributeDto = (r: AttributeDefinition): AttributeDto => ({ ...timestamps(r), name: r.name, slug: r.slug, dataType: r.dataType, unit: r.unit, active: r.active, filterable: r.filterable });
export const optionDto = (r: AttributeOption): AttributeOptionDto => ({ ...timestamps(r), attributeId: r.attributeId, label: r.label, value: r.value, sortOrder: r.sortOrder });
export const associationDto = (r: CategoryAttribute): CategoryAttributeDto => ({ ...timestamps(r), categoryId: r.categoryId, attributeId: r.attributeId, required: r.required, sortOrder: r.sortOrder });

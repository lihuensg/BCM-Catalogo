import { DomainError } from '../../shared/domain-error.js';
import type { AttributeDataType } from '../../generated/prisma/enums.js';
import type { AttributeValue } from '../attributes/schema.js';
export interface AttributeRequirement {
    attributeId: string;
    required: boolean;
    attribute: {
        dataType: AttributeDataType;
        active: boolean;
        options: readonly {
            id: string;
        }[];
    };
}
export function validateProductAttributes(values: readonly AttributeValue[], requirements: readonly AttributeRequirement[], publishing: boolean) {
    const definitions = new Map(requirements.map((requirement) => [requirement.attributeId, requirement]));
    const seen = new Set<string>();
    for (const value of values) {
        if (seen.has(value.attributeId))
            throw new DomainError('DUPLICATE_ATTRIBUTE', 'Duplicate attribute');
        seen.add(value.attributeId);
        const definition = definitions.get(value.attributeId);
        if (!definition)
            throw new DomainError('ATTRIBUTE_NOT_ASSIGNED', 'Attribute is not assigned to the product category');
        if (definition.attribute.dataType !== value.dataType)
            throw new DomainError('ATTRIBUTE_TYPE_MISMATCH', 'Attribute type does not match');
        if (!definition.attribute.active)
            throw new DomainError('ATTRIBUTE_INACTIVE', 'Attribute is inactive');
        if (value.dataType === 'OPTION' && !definition.attribute.options.some((option) => option.id === value.optionId)) {
            throw new DomainError('INVALID_ATTRIBUTE_OPTION', 'Option does not belong to the attribute');
        }
    }
    if (publishing && requirements.some((requirement) => requirement.required && !seen.has(requirement.attributeId))) {
        throw new DomainError('REQUIRED_ATTRIBUTE_MISSING', 'Required category attribute is missing');
    }
}
export function validatePublication(category: {
    active: boolean;
} | null) {
    if (!category?.active)
        throw new DomainError('CATEGORY_INACTIVE', 'Publishing requires an active category');
}

import { withTransaction, type UnitOfWork } from '../../infrastructure/prisma/unit-of-work.js';
import { DomainError } from '../../shared/domain-error.js';
import { attributeSchema, categoryAttributeSchema, optionSchema } from './schema.js';
export function createAttributeService(transaction: UnitOfWork = withTransaction) {
    return {
        create(input: unknown) {
            const data = attributeSchema.parse(input);
            return transaction(({ attributes }) => attributes.create(data));
        },
        createOption(input: unknown) {
            const data = optionSchema.parse(input);
            return transaction(async ({ attributes }) => {
                const attribute = await attributes.find(data.attributeId);
                if (!attribute)
                    throw new DomainError('ATTRIBUTE_NOT_FOUND', 'Attribute does not exist');
                if (attribute.dataType !== 'OPTION')
                    throw new DomainError('ATTRIBUTE_TYPE_MISMATCH', 'Options require an OPTION attribute');
                return attributes.createOption(data);
            });
        },
        associateCategory(input: unknown) {
            const data = categoryAttributeSchema.parse(input);
            return transaction(async ({ categories, attributes }) => {
                const attribute = await attributes.find(data.attributeId);
                if (!attribute)
                    throw new DomainError('ATTRIBUTE_NOT_FOUND', 'Attribute does not exist');
                if (!await categories.find(data.categoryId))
                    throw new DomainError('CATEGORY_NOT_FOUND', 'Category does not exist');
                if (!attribute.active)
                    throw new DomainError('ATTRIBUTE_INACTIVE', 'Assign an active attribute');
                if (data.required && await categories.activeProductCount(data.categoryId) > 0) {
                    throw new DomainError('ACTIVE_PRODUCTS_EXIST', 'Deactivate products before adding a new required attribute');
                }
                return categories.associateAttribute(data);
            });
        }
    };
}

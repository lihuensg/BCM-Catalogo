import { z } from 'zod';
import { AttributeDataType } from '../../generated/prisma/enums.js';
import { idSchema, nameSchema, numericAttributeSchema, optionalText, slugSchema, sortOrderSchema } from '../../shared/model-validation.js';
export const attributeSchema = z.strictObject({
    name: nameSchema, slug: slugSchema.max(180), dataType: z.enum(AttributeDataType),
    unit: optionalText(40), filterable: z.boolean().default(false), active: z.boolean().default(false)
});
export const optionSchema = z.strictObject({
    attributeId: idSchema, label: nameSchema, value: nameSchema, sortOrder: sortOrderSchema
});
export const categoryAttributeSchema = z.strictObject({
    categoryId: idSchema, attributeId: idSchema, required: z.boolean().default(false), sortOrder: sortOrderSchema
});
const common = { attributeId: idSchema };
export const attributeValueSchema = z.discriminatedUnion('dataType', [
    z.strictObject({ ...common, dataType: z.literal('TEXT'), textValue: z.string().trim().min(1).max(10000) }),
    z.strictObject({ ...common, dataType: z.literal('NUMBER'), numberValue: numericAttributeSchema }),
    z.strictObject({ ...common, dataType: z.literal('BOOLEAN'), booleanValue: z.boolean() }),
    z.strictObject({ ...common, dataType: z.literal('OPTION'), optionId: idSchema })
]);
export type AttributeValue = z.output<typeof attributeValueSchema>;

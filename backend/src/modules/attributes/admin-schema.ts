import { z } from 'zod';
import { idSchema } from '../../shared/model-validation.js';
import { listSchema, queryBoolean } from '../../shared/pagination.js';
import { editable } from '../../shared/http.js';
import { attributeSchema, optionSchema, categoryAttributeSchema } from './schema.js';
export const definitionQuery = listSchema(['name', 'slug', 'createdAt', 'updatedAt'] as const, 'name').extend({ active: queryBoolean, dataType: attributeSchema.shape.dataType.optional(), filterable: queryBoolean });
export const optionQuery = listSchema(['label', 'value', 'sortOrder', 'createdAt'] as const, 'sortOrder');
export const associationQuery = listSchema(['sortOrder', 'createdAt'] as const, 'sortOrder').extend({ required: queryBoolean });
export const optionBody = optionSchema.omit({ attributeId: true });
export const optionPatch = editable(optionBody);
export const createDefinition = attributeSchema.extend({ options: z.array(optionBody).max(100).default([]) }).superRefine((v, c) => {
    if (v.dataType !== 'OPTION' && v.options.length)
        c.addIssue({ code: 'custom', path: ['options'], message: 'Only OPTION accepts options' });
    if (v.active && v.dataType === 'OPTION' && !v.options.length)
        c.addIssue({ code: 'custom', path: ['options'], message: 'Active OPTION needs options' });
    if (new Set(v.options.map(o => o.value)).size !== v.options.length)
        c.addIssue({ code: 'custom', path: ['options'], message: 'Duplicate options' });
});
export const definitionPatch = editable(attributeSchema);
export const associationBody = categoryAttributeSchema.omit({ categoryId: true });
export const associationPatch = editable(categoryAttributeSchema.omit({ categoryId: true, attributeId: true }));
export const optionParams = z.strictObject({ attributeId: idSchema, id: idSchema });
export const attributeParams = z.strictObject({ attributeId: idSchema });
export const categoryParams = z.strictObject({ categoryId: idSchema });
export const associationParams = z.strictObject({ categoryId: idSchema, attributeId: idSchema });

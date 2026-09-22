import { pageArgs } from '../../shared/pagination.js';
import type { z } from 'zod';
import type { definitionQuery, optionQuery, associationQuery } from './admin-schema.js';
import type { Prisma } from '../../generated/prisma/client.js';
export function attributeRepository(db: Prisma.TransactionClient) {
    return {
        async list(q: z.output<typeof definitionQuery>) {
            const where: Prisma.AttributeDefinitionWhereInput = { ...(q.active !== undefined ? { active: q.active } : {}), ...(q.filterable !== undefined ? { filterable: q.filterable } : {}), ...(q.dataType ? { dataType: q.dataType } : {}), ...(q.search ? { OR: [{ name: { contains: q.search, mode: 'insensitive' } }, { slug: { contains: q.search, mode: 'insensitive' } }] } : {}) };
            return { data: await db.attributeDefinition.findMany({ where, ...pageArgs(q) }), total: await db.attributeDefinition.count({ where }) };
        },
        update: (id: string, data: Prisma.AttributeDefinitionUpdateInput) => db.attributeDefinition.update({ where: { id }, data }),
        remove: (id: string) => db.attributeDefinition.delete({ where: { id } }),
        valuesCount: (attributeId: string) => db.productAttributeValue.count({ where: { attributeId } }),
        activeReferences: (id: string) => db.attributeDefinition.count({ where: { id, OR: [{ values: { some: { product: { active: true } } } }, { categories: { some: { required: true, category: { products: { some: { active: true } } } } } }] } }),
        optionCount: (attributeId: string) => db.attributeOption.count({ where: { attributeId } }),
        async options(attributeId: string, q: z.output<typeof optionQuery>) {
            const where: Prisma.AttributeOptionWhereInput = { attributeId, ...(q.search ? { OR: [{ label: { contains: q.search, mode: 'insensitive' } }, { value: { contains: q.search, mode: 'insensitive' } }] } : {}) };
            return { data: await db.attributeOption.findMany({ where, ...pageArgs(q) }), total: await db.attributeOption.count({ where }) };
        },
        option: (id: string, attributeId: string) => db.attributeOption.findFirst({ where: { id, attributeId } }),
        updateOption: (id: string, data: Prisma.AttributeOptionUpdateInput) => db.attributeOption.update({ where: { id }, data }),
        removeOption: (id: string) => db.attributeOption.delete({ where: { id } }),
        optionUseCount: (optionId: string) => db.productAttributeValue.count({ where: { optionId } }),
        association: (categoryId: string, attributeId: string) => db.categoryAttribute.findUnique({ where: { categoryId_attributeId: { categoryId, attributeId } } }),
        async productDefinitions(categoryId:string,q:z.output<typeof associationQuery>) {
 const where={categoryId,attribute:{active:true}};
 return {data:await db.categoryAttribute.findMany({where,include:{attribute:true},...pageArgs(q)}),total:await db.categoryAttribute.count({where})};
 },
 async associations(categoryId: string, q: z.output<typeof associationQuery>) {
            const where: Prisma.CategoryAttributeWhereInput = { categoryId, ...(q.required !== undefined ? { required: q.required } : {}), ...(q.search ? { attribute: { name: { contains: q.search, mode: 'insensitive' } } } : {}) };
            return { data: await db.categoryAttribute.findMany({ where, include:{attribute:true}, ...pageArgs(q) }), total: await db.categoryAttribute.count({ where }) };
        },
        updateAssociation: (categoryId: string, attributeId: string, data: Prisma.CategoryAttributeUpdateInput) => db.categoryAttribute.update({ where: { categoryId_attributeId: { categoryId, attributeId } }, data }),
        removeAssociation: (categoryId: string, attributeId: string) => db.categoryAttribute.delete({ where: { categoryId_attributeId: { categoryId, attributeId } } }),
        create: (data: Prisma.AttributeDefinitionCreateInput) => db.attributeDefinition.create({ data }),
        createOption: (data: Prisma.AttributeOptionUncheckedCreateInput) => db.attributeOption.create({ data }),
        find: (id: string) => db.attributeDefinition.findUnique({ where: { id } })
    };
}

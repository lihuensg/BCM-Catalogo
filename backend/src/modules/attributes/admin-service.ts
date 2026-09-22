import type { PrismaClient } from '../../generated/prisma/client.js';
import { createUnitOfWork } from '../../infrastructure/prisma/unit-of-work.js';
import { persistence } from '../../infrastructure/prisma/errors.js';
import { DomainError } from '../../shared/domain-error.js';
import { pageResult } from '../../shared/pagination.js';
import { attributeRepository } from './repository.js';
import { categoryRepository } from '../categories/repository.js';
import { attributeSchema } from './schema.js';
import { createAttributeService } from './service.js';
import * as schema from './admin-schema.js';
const missing = () => new DomainError('ATTRIBUTE_NOT_FOUND', 'Atributo no encontrado');
export function attributeAdminService(db: PrismaClient) {
    const transaction = createUnitOfWork(db), repo = attributeRepository(db), base = createAttributeService(transaction);
    const get = async (id: string) => { const row = await repo.find(id); if (!row)
        throw missing(); return row; };
    const getOption = async (attributeId: string, id: string) => { const row = await repo.option(id, attributeId); if (!row)
        throw new DomainError('OPTION_NOT_FOUND', 'Opción no encontrada'); return row; };
    const getAssociation = async (categoryId: string, attributeId: string) => { const row = await repo.association(categoryId, attributeId); if (!row)
        throw new DomainError('ASSOCIATION_NOT_FOUND', 'Asociación no encontrada'); return row; };
    return {
        get,
        async list(input: unknown) { const q = schema.definitionQuery.parse(input), r = await repo.list(q); return pageResult(r.data, r.total, q); },
        create: (input: unknown) => persistence('ATTRIBUTE', () => transaction(async ({ attributes }) => {
            const { options, ...data } = schema.createDefinition.parse(input);
            const row = await attributes.create(data);
            for (const option of options)
                await attributes.createOption({ ...option, attributeId: row.id });
            return row;
        })),
        update: (id: string, input: unknown) => persistence('ATTRIBUTE', () => transaction(async ({ attributes }) => {
            const patch = schema.definitionPatch.parse(input), row = await attributes.find(id);
            if (!row)
                throw missing();
            const fields = attributeSchema.strip().parse(row);
            const data = attributeSchema.parse({ ...fields, ...patch }), options = await attributes.optionCount(id);
            if (data.dataType !== row.dataType && (options || await attributes.valuesCount(id)))
                throw new DomainError('ATTRIBUTE_IN_USE', 'El tipo está en uso');
            if (!data.active && row.active && await attributes.activeReferences(id))
                throw new DomainError('ATTRIBUTE_IN_USE', 'El atributo participa en productos activos');
            if (data.active && data.dataType === 'OPTION' && !options)
                throw new DomainError('ATTRIBUTE_OPTIONS_REQUIRED', 'El atributo activo necesita opciones');
            return attributes.update(id, data);
        })),
        remove: (id: string) => persistence('ATTRIBUTE', () => repo.remove(id)),
        getOption,
        async listOptions(attributeId: string, input: unknown) { await get(attributeId); const q = schema.optionQuery.parse(input), r = await repo.options(attributeId, q); return pageResult(r.data, r.total, q); },
        createOption: (attributeId: string, input: unknown) => persistence('OPTION', () => base.createOption({ ...schema.optionBody.parse(input), attributeId })),
        updateOption: (attributeId: string, id: string, input: unknown) => persistence('OPTION', () => transaction(async ({ attributes }) => {
            const data = schema.optionPatch.parse(input), row = await attributes.option(id, attributeId);
            if (!row)
                throw new DomainError('OPTION_NOT_FOUND', 'Opción no encontrada');
            if (data.value !== undefined && data.value !== row.value && await attributes.optionUseCount(id))
                throw new DomainError('OPTION_IN_USE', 'No se puede cambiar el valor de una opción usada');
            return attributes.updateOption(id, { label: data.label ?? row.label, value: data.value ?? row.value, sortOrder: data.sortOrder ?? row.sortOrder });
        })),
        removeOption: (attributeId: string, id: string) => persistence('OPTION', () => transaction(async ({ attributes }) => {
            if (!await attributes.option(id, attributeId))
                throw new DomainError('OPTION_NOT_FOUND', 'Opción no encontrada');
            if ((await attributes.find(attributeId))?.active && await attributes.optionCount(attributeId) <= 1)
                throw new DomainError('ATTRIBUTE_OPTIONS_REQUIRED', 'Desactivá el atributo antes de quitar su última opción');
            return attributes.removeOption(id);
        })),
        getAssociation,
        async productDefinitions(categoryId:string,input:unknown) {if(!await categoryRepository(db).find(categoryId)) throw new DomainError('CATEGORY_NOT_FOUND','Categoría no encontrada');const q=schema.associationQuery.parse(input),r=await repo.productDefinitions(categoryId,q);return pageResult(r.data,r.total,q);},
        async listAssociations(categoryId: string, input: unknown) {
            if (!await categoryRepository(db).find(categoryId))
                throw new DomainError('CATEGORY_NOT_FOUND', 'Categoría no encontrada');
            const q = schema.associationQuery.parse(input), r = await repo.associations(categoryId, q);
            return pageResult(r.data, r.total, q);
        },
        createAssociation: (categoryId: string, input: unknown) => persistence('ASSOCIATION', () => base.associateCategory({ ...schema.associationBody.parse(input), categoryId })),
        updateAssociation: (categoryId: string, attributeId: string, input: unknown) => persistence('ASSOCIATION', () => transaction(async ({ attributes, categories }) => {
            const data = schema.associationPatch.parse(input), row = await attributes.association(categoryId, attributeId);
            if (!row)
                throw new DomainError('ASSOCIATION_NOT_FOUND', 'Asociación no encontrada');
            if (data.required && !row.required) {
                if (!(await attributes.find(attributeId))?.active)
                    throw new DomainError('ATTRIBUTE_INACTIVE', 'Activá el atributo primero');
                if (await categories.activeProductCount(categoryId))
                    throw new DomainError('ACTIVE_PRODUCTS_EXIST', 'Desactivá los productos antes de requerir otro atributo');
            }
            return attributes.updateAssociation(categoryId, attributeId, { required: data.required ?? row.required, sortOrder: data.sortOrder ?? row.sortOrder });
        })),
        removeAssociation: (categoryId: string, attributeId: string) => persistence('ASSOCIATION', () => repo.removeAssociation(categoryId, attributeId))
    };
}

import type { RequestHandler } from 'express';
import { crudController } from '../../shared/crud-controller.js';
import { emptyQuery } from '../../shared/http.js';
import type { attributeAdminService } from './admin-service.js';
import { attributeDto, optionDto, associationDto } from './mapper.js';
import * as schema from './admin-schema.js';
export function attributeController(service: ReturnType<typeof attributeAdminService>) {
    const options: RequestHandler = async (req, res) => { const { attributeId } = schema.attributeParams.parse(req.params); const r = await service.listOptions(attributeId, req.query); res.json({ ...r, data: r.data.map(optionDto) }); };
    const optionGet: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); const { attributeId, id } = schema.optionParams.parse(req.params); res.json({ data: optionDto(await service.getOption(attributeId, id)), meta: {} }); };
    const optionCreate: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); const { attributeId } = schema.attributeParams.parse(req.params); res.status(201).json({ data: optionDto(await service.createOption(attributeId, req.body)), meta: {} }); };
    const optionUpdate: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); const { attributeId, id } = schema.optionParams.parse(req.params); res.json({ data: optionDto(await service.updateOption(attributeId, id, req.body)), meta: {} }); };
    const optionRemove: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); const { attributeId, id } = schema.optionParams.parse(req.params); await service.removeOption(attributeId, id); res.status(204).end(); };
    const associations: RequestHandler = async (req, res) => { const { categoryId } = schema.categoryParams.parse(req.params); const r = await service.listAssociations(categoryId, req.query); res.json({ ...r, data: r.data.map(row=>({...associationDto(row),definition:attributeDto(row.attribute)})) }); };
    const associationGet: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); const { categoryId, attributeId } = schema.associationParams.parse(req.params); res.json({ data: associationDto(await service.getAssociation(categoryId, attributeId)), meta: {} }); };
    const associationCreate: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); const { categoryId } = schema.categoryParams.parse(req.params); res.status(201).json({ data: associationDto(await service.createAssociation(categoryId, req.body)), meta: {} }); };
    const associationUpdate: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); const { categoryId, attributeId } = schema.associationParams.parse(req.params); res.json({ data: associationDto(await service.updateAssociation(categoryId, attributeId, req.body)), meta: {} }); };
    const associationRemove: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); const { categoryId, attributeId } = schema.associationParams.parse(req.params); await service.removeAssociation(categoryId, attributeId); res.status(204).end(); };
    const productDefinitions:RequestHandler=async(req,res)=>{const {categoryId}=schema.categoryParams.parse(req.params);const result=await service.productDefinitions(categoryId,req.query);res.json({...result,data:result.data.map(row=>({...associationDto(row),definition:attributeDto(row.attribute)}))});};
    return { productDefinitions,...crudController(service, attributeDto), options, optionGet, optionCreate, optionUpdate, optionRemove, associations, associationGet, associationCreate, associationUpdate, associationRemove };
}

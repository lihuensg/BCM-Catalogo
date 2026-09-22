import type { RequestHandler } from 'express';
import { idParams, emptyQuery } from '../../shared/http.js';
import type { productAdminService } from './admin-service.js';
import { productAdminListDto, productAdminDetailDto } from './mapper.js';
export function productController(service: ReturnType<typeof productAdminService>) {
    const list: RequestHandler = async (req, res) => { const r = await service.list(req.query); res.json({ ...r, data: r.data.map(productAdminListDto) }); };
    const get: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); res.json({ data: productAdminDetailDto(await service.get(idParams.parse(req.params).id)), meta: {} }); };
    const create: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); res.status(201).json({ data: productAdminDetailDto(await service.create(req.body)), meta: {} }); };
    const update: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); res.json({ data: productAdminDetailDto(await service.update(idParams.parse(req.params).id, req.body)), meta: {} }); };
    const deactivate: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); emptyQuery.optional().parse(req.body); await service.deactivate(idParams.parse(req.params).id); res.status(204).end(); };
    return { list, get, create, update, deactivate };
}

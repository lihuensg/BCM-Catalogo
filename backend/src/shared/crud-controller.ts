import type { RequestHandler } from 'express';
import { Router } from 'express';
import { idParams, emptyQuery } from './http.js';
export interface CrudService<T> {
    list(query: unknown): Promise<{
        data: T[];
        meta: object;
    }>;
    get(id: string): Promise<T>;
    create(body: unknown): Promise<T>;
    update(id: string, body: unknown): Promise<T>;
    remove(id: string): Promise<unknown>;
}
export function crudController<T>(service: CrudService<T>, map: (row: T) => unknown) {
    const list: RequestHandler = async (req, res) => { const result = await service.list(req.query); res.json({ ...result, data: result.data.map(map) }); };
    const get: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); res.json({ data: map(await service.get(idParams.parse(req.params).id)), meta: {} }); };
    const create: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); res.status(201).json({ data: map(await service.create(req.body)), meta: {} }); };
    const update: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); res.json({ data: map(await service.update(idParams.parse(req.params).id, req.body)), meta: {} }); };
    const remove: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); await service.remove(idParams.parse(req.params).id); res.status(204).end(); };
    return { list, get, create, update, remove };
}
export function crudRoutes(controller: ReturnType<typeof crudController>) {
    const router = Router();
    router.get('/', controller.list);
    router.get('/:id', controller.get);
    router.post('/', controller.create);
    router.patch('/:id', controller.update);
    router.delete('/:id', controller.remove);
    return router;
}

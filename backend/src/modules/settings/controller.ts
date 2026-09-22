import type { RequestHandler } from 'express';
import { emptyQuery } from '../../shared/http.js';
import type { settingsService } from './service.js';
import { settingsDto } from './mapper.js';
export function settingsController(service: ReturnType<typeof settingsService>) {
    const get: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); const row = await service.get(); res.json({ data: row ? settingsDto(row) : null, meta: {} }); };
    const put: RequestHandler = async (req, res) => { emptyQuery.parse(req.query); res.json({ data: settingsDto(await service.put(req.body)), meta: {} }); };
    return { get, put };
}

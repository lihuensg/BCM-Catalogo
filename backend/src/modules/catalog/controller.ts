import type { RequestHandler } from 'express';
import type { catalogService } from './service.js';
import { slugParams } from './schema.js';
import { emptyQuery } from '../../shared/http.js';

export function catalogController(service: ReturnType<typeof catalogService>) {
    const home: RequestHandler = async (_req, res) => res.json({ data: await service.home(), meta: {} });
    const products: RequestHandler = async (req, res) => res.json(await service.list(req.query));
    const product: RequestHandler = async (req, res) => {
        emptyQuery.parse(req.query);
        res.json({ data: await service.product(slugParams.parse(req.params).slug), meta: {} });
    };
    const categories: RequestHandler = async (req, res) => {
        emptyQuery.parse(req.query);
        res.json({ data: await service.categories(), meta: {} });
    };
    const brands: RequestHandler = async (req, res) => {
        emptyQuery.parse(req.query);
        res.json({ data: await service.brands(), meta: {} });
    };
    const settings: RequestHandler = async (req, res) => {
        emptyQuery.parse(req.query);
        res.json({ data: await service.settings(), meta: {} });
    };
    return { home, products, product, categories, brands, settings };
}

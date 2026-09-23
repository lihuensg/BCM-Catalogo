import { Router } from 'express';
import type { PrismaClient } from '../../generated/prisma/client.js';
import { catalogController } from './controller.js';
import { catalogService } from './service.js';

export function catalogRouter(db: PrismaClient) {
    const router = Router();
    const controller = catalogController(catalogService(db));
    router.get('/home', controller.home);
    router.get('/products', controller.products);
    router.get('/products/:slug', controller.product);
    router.get('/categories', controller.categories);
    router.get('/brands', controller.brands);
    router.get('/settings', controller.settings);
    router.get('/banners', controller.banners);
    return router;
}

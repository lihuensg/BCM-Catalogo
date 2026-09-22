import {dashboardRouter} from './modules/dashboard/routes.js';
import {dashboardService} from './modules/dashboard/service.js';
import {dashboardRepository} from './modules/dashboard/repository.js';
import type {ProductMutationHook} from './modules/products/events.js';
import { Router } from 'express';
import type { PrismaClient } from './generated/prisma/client.js';
import { categoryAdminService } from './modules/categories/admin-service.js';
import { categoryRouter } from './modules/categories/routes.js';
import { brandAdminService } from './modules/brands/admin-service.js';
import { brandRouter } from './modules/brands/routes.js';
import { attributeAdminService } from './modules/attributes/admin-service.js';
import { attributeRoutes } from './modules/attributes/routes.js';
import { bannerService } from './modules/banners/service.js';
import { bannerRouter } from './modules/banners/routes.js';
import { settingsService } from './modules/settings/service.js';
import { settingsRouter } from './modules/settings/routes.js';
import { productAdminService } from './modules/products/admin-service.js';
import { productRouter } from './modules/products/routes.js';
export function adminRouter(db: PrismaClient, productMutationHook?:ProductMutationHook) {
    const r = Router();
    r.use('/dashboard',dashboardRouter(dashboardService(dashboardRepository(db))));
    r.use(attributeRoutes(attributeAdminService(db)));
    r.use('/categories', categoryRouter(categoryAdminService(db)));
    r.use('/brands', brandRouter(brandAdminService(db)));
    r.use('/banners', bannerRouter(bannerService(db)));
    r.use('/settings', settingsRouter(settingsService(db)));
    r.use('/products', productRouter(productAdminService(db,productMutationHook)));
    return r;
}

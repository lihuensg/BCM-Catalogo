import { crudRoutes } from '../../shared/crud-controller.js';
import { bannerController } from './controller.js';
export const bannerRouter = (...args: Parameters<typeof bannerController>) => crudRoutes(bannerController(...args));

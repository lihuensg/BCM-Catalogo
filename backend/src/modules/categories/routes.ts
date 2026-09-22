import { crudRoutes } from '../../shared/crud-controller.js';
import { categoryController } from './controller.js';
export const categoryRouter = (...args: Parameters<typeof categoryController>) => crudRoutes(categoryController(...args));

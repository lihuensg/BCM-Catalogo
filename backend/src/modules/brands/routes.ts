import { crudRoutes } from '../../shared/crud-controller.js';
import { brandController } from './controller.js';
export const brandRouter = (...args: Parameters<typeof brandController>) => crudRoutes(brandController(...args));

import { crudController } from '../../shared/crud-controller.js';
import { brandDto } from './mapper.js';
import type { brandAdminService } from './admin-service.js';
export const brandController = (service: ReturnType<typeof brandAdminService>) => crudController(service, brandDto);

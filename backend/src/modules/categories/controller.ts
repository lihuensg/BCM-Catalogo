import { crudController } from '../../shared/crud-controller.js';
import { categoryDto } from './mapper.js';
import type { categoryAdminService } from './admin-service.js';
export const categoryController = (service: ReturnType<typeof categoryAdminService>) => crudController(service, categoryDto);

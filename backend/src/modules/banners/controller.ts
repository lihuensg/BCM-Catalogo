import { crudController } from '../../shared/crud-controller.js';
import { bannerDto } from './mapper.js';
import type { bannerService } from './service.js';
export const bannerController = (service: ReturnType<typeof bannerService>) => crudController(service, bannerDto);

import type { Request, Response } from 'express';
import type { ApiSuccess, HealthStatus } from '@bcm/shared';
import { getHealth } from './service.js';
export function healthController(_request: Request, response: Response<ApiSuccess<HealthStatus>>) {
    response.setHeader('Cache-Control', 'no-store');
    response.json({ data: getHealth(), meta: {} });
}

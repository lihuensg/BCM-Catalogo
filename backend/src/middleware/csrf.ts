import type { RequestHandler } from 'express';
import { DomainError } from '../shared/domain-error.js';
/** A custom header requires CORS preflight; origins, when present, must be trusted. */
export function protectMutations(origins: readonly string[]): RequestHandler {
    return (request, _response, next) => {
        if (['GET', 'HEAD', 'OPTIONS'].includes(request.method))
            return next();
        const origin = request.get('origin');
        if (request.get('x-bcm-admin') !== '1' || (origin !== undefined && !origins.includes(origin))) {
            throw new DomainError('CSRF_REJECTED', 'Origen de solicitud no permitido', 403);
        }
        next();
    };
}

import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiError } from '@bcm/shared';
import { ZodError } from 'zod';
import { DomainError } from '../shared/domain-error.js';
import { logEvent } from '../shared/logger.js';
export const notFound: RequestHandler = (_request, response) => {
    const body: ApiError = { error: { code: 'NOT_FOUND', message: 'Recurso no encontrado', details: {} } };
    response.status(404).json(body);
};
export const errorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
    if (error instanceof DomainError || error instanceof ZodError) {
        const validation = error instanceof ZodError;
        response.status(validation ? 400 : error.status).json({ error: {
                code: validation ? 'VALIDATION_ERROR' : error.code,
                message: validation ? 'Datos inválidos' : error.message,
                details: validation ? { fields: [...new Set(error.issues.map(issue => issue.path.join('.')))] } : {}
            } } satisfies ApiError);
        return;
    }
    const type = typeof error === 'object' && error !== null && 'type' in error ? error.type : undefined;
    const status = type === 'entity.parse.failed' ? 400 : type === 'entity.too.large' ? 413 : 500;
    if (status === 500)
        logEvent('internal.error', { status });
    const body: ApiError = {
        error: {
            code: status === 400 ? 'INVALID_JSON' : status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INTERNAL_ERROR',
            message: status === 400 ? 'JSON inválido' : status === 413 ? 'Solicitud demasiado grande' : 'No se pudo procesar la solicitud',
            details: {}
        }
    };
    response.status(status).json(body);
};

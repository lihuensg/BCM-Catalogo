import { rateLimit } from 'express-rate-limit';
export function requestLimit(limit: number, windowMs: number) {
    return rateLimit({ limit, windowMs, standardHeaders: 'draft-8', legacyHeaders: false,
        handler: (_request, response) => response.status(429).json({ error: {
                code: 'RATE_LIMITED', message: 'Demasiadas solicitudes; intentá más tarde', details: {}
            } })
    });
}

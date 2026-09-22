import type { RequestHandler } from 'express';
import type { AdminIdentity } from '@bcm/shared';
import type { AuthService } from '../modules/auth/service.js';
import { readSessionCookie } from '../modules/auth/cookie.js';
declare module 'express-serve-static-core' {
    interface Request {
        admin?: AdminIdentity;
    }
}
export function requireAdmin(auth: AuthService, cookieName: string): RequestHandler {
    return async (request, _response, next) => {
        request.admin = await auth.identity(readSessionCookie(request, cookieName));
        next();
    };
}

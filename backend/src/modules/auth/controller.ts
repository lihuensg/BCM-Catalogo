import type { RequestHandler } from 'express';
import type { AuthService } from './service.js';
import type { sessionCookie } from './cookie.js';
import { readSessionCookie } from './cookie.js';
import { emptyQuery } from '../../shared/http.js';
export function authController(auth: AuthService, cookie: ReturnType<typeof sessionCookie>) {
    const login: RequestHandler = async (request, response) => {
        emptyQuery.parse(request.query);
        const result = await auth.login(request.body, readSessionCookie(request, cookie.name));
        response.cookie(cookie.name, result.token, cookie.options).json({ data: result.admin, meta: {} });
    };
    const logout: RequestHandler = async (request, response) => {
        emptyQuery.parse(request.query);
        emptyQuery.optional().parse(request.body);
        await auth.logout(readSessionCookie(request, cookie.name));
        const options = { httpOnly: cookie.options.httpOnly, secure: cookie.options.secure, sameSite: cookie.options.sameSite, path: cookie.options.path };
        response.clearCookie(cookie.name, options).status(204).end();
    };
    const me: RequestHandler = (request, response) => {
        emptyQuery.parse(request.query);
        response.json({ data: request.admin, meta: {} });
    };
    return { login, logout, me };
}

import { Router } from 'express';
import { authController } from './controller.js';
import type { AuthService } from './service.js';
import type { sessionCookie } from './cookie.js';
import { requireAdmin } from '../../middleware/require-admin.js';
import { requestLimit } from '../../middleware/rate-limit.js';
export function authRouter(auth: AuthService, cookie: ReturnType<typeof sessionCookie>) {
    const router = Router();
    const controller = authController(auth, cookie);
    router.post('/login', requestLimit(10, 15 * 60000), controller.login);
    router.post('/logout', controller.logout);
    router.get('/me', requireAdmin(auth, cookie.name), controller.me);
    return router;
}

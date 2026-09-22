import type {ProductMutationHook} from './modules/products/events.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { healthRouter } from './modules/health/routes.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { protectMutations } from './middleware/csrf.js';
import { requireAdmin } from './middleware/require-admin.js';
import { requestLimit } from './middleware/rate-limit.js';
import { createAuthService } from './modules/auth/service.js';
import { authRepository } from './modules/auth/repository.js';
import { authRouter } from './modules/auth/routes.js';
import { sessionCookie } from './modules/auth/cookie.js';
import { getPrismaClient } from './infrastructure/prisma/client.js';
import type { PrismaClient } from './generated/prisma/client.js';
import { adminRouter } from './admin-router.js';
import { catalogRouter } from './modules/catalog/routes.js';
import { logEvent } from './shared/logger.js';
export function createApp(options: {
    corsOrigins: readonly string[];
    production?: boolean;
    sessionTtlSeconds?: number;
    database?: PrismaClient;
    productMutationHook?:ProductMutationHook;
}) {
    const app = express();
    const production = options.production ?? false, ttl = options.sessionTtlSeconds ?? 28800;
    const cookie = sessionCookie(production, ttl);
    const database = () => options.database ?? getPrismaClient();
    const auth = createAuthService(() => authRepository(database()), ttl);
    app.disable('x-powered-by');
    app.set('trust proxy', false);
    app.use(helmet());
    app.use(cors({ origin: (origin, callback) => callback(null, origin !== undefined && options.corsOrigins.includes(origin)), credentials: true,
        methods: ['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'X-BCM-Admin'] }));
    app.use(express.json({ limit: '100kb' }));
    app.use('/api/v1/health', healthRouter);
    app.use('/api/v1/public', (_req, res, next) => { res.set('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400'); next(); }, (req, res, next) => catalogRouter(database())(req, res, next));
    app.use(['/api/v1/auth', '/api/v1/admin'], (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, protectMutations(options.corsOrigins));
    app.use('/api/v1/auth', authRouter(auth, cookie));
    let admin: ReturnType<typeof adminRouter> | undefined;
    const mutationLimit = requestLimit(120, 60000);
    app.use('/api/v1/admin', requireAdmin(auth, cookie.name), (req, res, next) => {
        if (['GET', 'HEAD', 'OPTIONS'].includes(req.method))
            return next();
        mutationLimit(req, res, next);
    }, (req, res, next) => {
        if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method))
            res.on('finish', () => {
                if (res.statusCode < 400 && req.admin)
                    logEvent('admin.mutation', { adminId: req.admin.id, status: res.statusCode });
            });
        next();
    }, (req, res, next) => { admin ??= adminRouter(database(),options.productMutationHook); admin(req, res, next); });
    app.use(notFound);
    app.use(errorHandler);
    return app;
}

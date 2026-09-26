import 'dotenv/config';
import { createApp } from './app.js';
import { disconnectPrisma } from './infrastructure/prisma/client.js';
import { parseEnvironment } from './config/env.js';
import { createFrontendInvalidation, productInvalidationHook } from './shared/public-cache.js';
const env = parseEnvironment(process.env);
const invalidate = createFrontendInvalidation(env.PUBLIC_REVALIDATE_URL, env.REVALIDATION_SECRET);
const app = createApp({
    corsOrigins: env.CORS_ORIGINS,
    production: env.NODE_ENV === 'production',
    sessionTtlSeconds: env.SESSION_TTL_SECONDS,
    trustProxyHops: env.TRUST_PROXY_HOPS,
    productMutationHook: productInvalidationHook(invalidate),
    publicInvalidationHook: invalidate
});
const server = app.listen(env.PORT, env.HOST);
server.on('listening', () => {
    console.info(`BCM API listening on port ${env.PORT}`);
});
server.on('error', () => {
    console.error('BCM API could not start. Check the configured host and port.');
    process.exitCode = 1;
});
function shutdown() {
    const timeout = setTimeout(() => process.exit(1), 10000).unref();
    server.close(() => {
        void disconnectPrisma().then(() => {
            clearTimeout(timeout);
            process.exitCode = 0;
        }).catch(() => {
            clearTimeout(timeout);
            console.error('Database shutdown failed.');
            process.exitCode = 1;
        });
    });
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

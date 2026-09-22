import { createHash, randomBytes } from 'node:crypto';
import { DomainError } from '../../shared/domain-error.js';
import { logEvent } from '../../shared/logger.js';
import { adminIdentity } from './mapper.js';
import { loginSchema } from './schema.js';
import { verifyPassword } from './password.js';
import type { AuthRepository } from './repository.js';
export const sessionHash = (token: string) => createHash('sha256').update(token).digest('hex');
export function createAuthService(repository: () => AuthRepository, ttlSeconds: number) {
    return {
        async login(input: unknown, previousToken?: string) {
            const data = loginSchema.parse(input);
            const admin = await repository().findByEmail(data.email);
            const valid = await verifyPassword(admin?.passwordHash, data.password);
            if (!admin?.active || !valid) {
                logEvent('auth.login.failed');
                throw new DomainError('AUTH_INVALID_CREDENTIALS', 'Credenciales inválidas', 401);
            }
            const token = randomBytes(32).toString('base64url');
            await repository().createSession(admin.id, sessionHash(token), new Date(Date.now() + ttlSeconds * 1000), previousToken ? sessionHash(previousToken) : undefined);
            logEvent('auth.login.succeeded', { adminId: admin.id });
            return { token, admin: adminIdentity(admin) };
        },
        async identity(token?: string) {
            if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token))
                throw new DomainError('AUTH_REQUIRED', 'Iniciá sesión', 401);
            const session = await repository().session(sessionHash(token));
            if (!session || session.expiresAt.getTime() <= Date.now() || !session.admin.active) {
                throw new DomainError('AUTH_REQUIRED', 'Iniciá sesión', 401);
            }
            return adminIdentity(session.admin);
        },
        async logout(token?: string) {
            if (token && /^[A-Za-z0-9_-]{43}$/.test(token))
                await repository().revoke(sessionHash(token));
            logEvent('auth.logout');
        }
    };
}
export type AuthService = ReturnType<typeof createAuthService>;

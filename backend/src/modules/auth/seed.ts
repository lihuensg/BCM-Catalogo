import type { PrismaClient } from '../../generated/prisma/client.js';
import { adminSeedSchema } from './schema.js';
import { hashPassword } from './password.js';
import { authRepository } from './repository.js';
/** Never rotates an existing admin password or reactivates an existing account. */
export async function seedAdmin(db: PrismaClient, source: NodeJS.ProcessEnv) {
    const supplied = [source.ADMIN_EMAIL, source.ADMIN_PASSWORD, source.ADMIN_NAME].some(Boolean);
    if (!supplied)
        return false;
    if (source.NODE_ENV === 'production')
        throw new Error('Development admin seed is disabled in production');
    const { password, ...data } = adminSeedSchema.parse({ email: source.ADMIN_EMAIL, password: source.ADMIN_PASSWORD, name: source.ADMIN_NAME });
    const repo = authRepository(db);
    if (!await repo.findByEmail(data.email))
        await repo.seed({ ...data, passwordHash: await hashPassword(password) });
    return true;
}

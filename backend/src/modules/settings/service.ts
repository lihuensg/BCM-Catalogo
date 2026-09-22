import type { PrismaClient } from '../../generated/prisma/client.js';
import { settingsRepository } from './repository.js';
import { siteSettingsSchema } from './schema.js';
import { persistence } from '../../infrastructure/prisma/errors.js';
export function settingsService(db: PrismaClient) {
    const repo = settingsRepository(db);
    return {
        get: () => repo.get(), put: (input: unknown) => persistence('SETTINGS', () => repo.put(siteSettingsSchema.parse(input)))
    };
}

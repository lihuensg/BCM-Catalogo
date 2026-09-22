import type { Prisma } from '../../generated/prisma/client.js';
export function settingsRepository(db: Prisma.TransactionClient) {
    return {
        get: () => db.siteSettings.findUnique({ where: { singleton: true } }),
        put: (data: Omit<Prisma.SiteSettingsCreateInput, 'singleton'>) => db.siteSettings.upsert({ where: { singleton: true }, create: data, update: data })
    };
}

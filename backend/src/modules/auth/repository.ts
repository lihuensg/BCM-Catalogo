import type { PrismaClient } from '../../generated/prisma/client.js';
export function authRepository(db: PrismaClient) {
    return {
        findByEmail: (email: string) => db.adminUser.findUnique({ where: { email } }),
        session: (tokenHash: string) => db.adminSession.findUnique({ where: { tokenHash }, include: { admin: true } }),
        async createSession(adminId: string, tokenHash: string, expiresAt: Date, previousHash?: string) {
            await db.$transaction(async (tx) => {
                await tx.adminSession.deleteMany({ where: { OR: [
                            { adminId, expiresAt: { lte: new Date() } }, ...(previousHash ? [{ tokenHash: previousHash }] : [])
                        ] } });
                await tx.adminSession.create({ data: { adminId, tokenHash, expiresAt } });
            });
        },
        revoke: (tokenHash: string) => db.adminSession.deleteMany({ where: { tokenHash } }),
        seed: (data: {
            email: string;
            name: string;
            passwordHash: string;
        }) => db.adminUser.upsert({
            where: { email: data.email }, create: { ...data, active: true }, update: {}
        })
    };
}
export type AuthRepository = ReturnType<typeof authRepository>;

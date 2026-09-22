import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client.js';
import { requireDatabaseUrl } from '../../config/database.js';
export function createPrismaClient(connectionString: string, options: {connectionTimeoutMillis?:number} = {}) {
    const url = requireDatabaseUrl(connectionString);
    const schema = new URL(url).searchParams.get('schema') ?? 'public';
    const adapter = new PrismaPg({ connectionString: url, connectionTimeoutMillis: options.connectionTimeoutMillis ?? 5000 }, { schema });
    return new PrismaClient({ adapter });
}
let client: PrismaClient | undefined;
/** Lazy: liveness can start without a database. One pool per backend process. */
export function getPrismaClient() {
    client ??= createPrismaClient(requireDatabaseUrl(process.env.DATABASE_URL));
    return client;
}
export async function disconnectPrisma() {
    await client?.$disconnect();
    client = undefined;
}

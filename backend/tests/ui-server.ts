import '../scripts/integration-env.js';
import {createApp} from '../src/app.js';
import {createPrismaClient} from '../src/infrastructure/prisma/client.js';
const db=createPrismaClient(process.env.TEST_DATABASE_URL!,{connectionTimeoutMillis:20000});
await db.$queryRawUnsafe('SELECT 1');
const server=createApp({corsOrigins:['http://localhost:3100'],database:db}).listen(4200,'127.0.0.1',()=>console.log('UI test API ready'));
async function close(){server.close();await db.$disconnect();}process.on('SIGTERM',close);process.on('SIGINT',close);

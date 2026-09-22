import 'dotenv/config';
import {readFile} from 'node:fs/promises';
import {getPrismaClient,disconnectPrisma} from '../src/infrastructure/prisma/client.js';
import {seedStructure} from '../src/infrastructure/prisma/seed.js';
import {seedAdmin} from '../src/modules/auth/seed.js';
async function main(){
 const path=process.env.SEED_DATA_FILE;
 const hasAdmin=[process.env.ADMIN_EMAIL,process.env.ADMIN_PASSWORD,process.env.ADMIN_NAME].some(Boolean);
 if(!path && !hasAdmin){console.info('No seed data supplied; no data was written.');return;}
 const db=getPrismaClient();
 if(hasAdmin){await seedAdmin(db,process.env);console.info('Development admin seed completed. Existing credentials preserved.');}
 if(path){const result=await seedStructure(db,JSON.parse(await readFile(path,'utf8')) as unknown);console.info('Structural seed completed:',result.categories,'categories,',result.brands,'brands.');}
}
try{await main();}catch{console.error('Seed failed. Check input, environment and applied migrations.');process.exitCode=1;}finally{await disconnectPrisma();}

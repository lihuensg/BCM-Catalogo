import '../scripts/integration-env.js';
import {mkdirSync,writeFileSync,readFileSync,existsSync,unlinkSync} from 'node:fs';
import {randomUUID,randomBytes} from 'node:crypto';
import {createPrismaClient} from '../src/infrastructure/prisma/client.js';
import {hashPassword} from '../src/modules/auth/password.js';
const db=createPrismaClient(process.env.TEST_DATABASE_URL!,{connectionTimeoutMillis:20000});const file='../artifacts/ui-fixture.json';
try {if(process.argv[2]==='cleanup'){
 if(existsSync(file)){const f=JSON.parse(readFileSync(file,'utf8')) as {prefix:string;email:string};if(!/^ui-[0-9a-f-]{36}$/.test(f.prefix))throw new Error('Invalid fixture scope');
 await db.product.deleteMany({where:{slug:{startsWith:f.prefix}}});await db.categoryAttribute.deleteMany({where:{category:{slug:{startsWith:f.prefix}}}});await db.attributeOption.deleteMany({where:{attribute:{slug:{startsWith:f.prefix}}}});await db.attributeDefinition.deleteMany({where:{slug:{startsWith:f.prefix}}});await db.category.updateMany({where:{slug:{startsWith:f.prefix}},data:{parentId:null}});await db.category.deleteMany({where:{slug:{startsWith:f.prefix}}});await db.brand.deleteMany({where:{slug:{startsWith:f.prefix}}});await db.banner.deleteMany({where:{title:{startsWith:f.prefix}}});await db.siteSettings.deleteMany({where:{siteName:f.prefix}});await db.adminUser.deleteMany({where:{email:f.email}});unlinkSync(file);console.log('UI fixtures cleaned');}
 }else {if(existsSync(file))throw new Error('Clean the previous UI fixtures first');if(await db.siteSettings.count())throw new Error('UI tests require an unconfigured test singleton');const prefix='ui-'+randomUUID(),email=prefix+'@example.test',password=randomBytes(24).toString('base64url');
 mkdirSync('../artifacts',{recursive:true});writeFileSync(file,JSON.stringify({prefix,email,password}));
 const category=await db.category.create({data:{name:'QA Categoría',slug:prefix+'-category',active:true}});const brand=await db.brand.create({data:{name:'QA Marca',slug:prefix+'-brand',active:true}});
 const attribute=await db.attributeDefinition.create({data:{name:'Especificación QA',slug:prefix+'-attribute',dataType:'TEXT',active:true}});await db.categoryAttribute.create({data:{categoryId:category.id,attributeId:attribute.id,required:true}});
 await db.adminUser.create({data:{email,name:'Administrador QA',passwordHash:await hashPassword(password),active:true}});
 mkdirSync('../artifacts',{recursive:true});writeFileSync(file,JSON.stringify({prefix,email,password,categoryId:category.id,brandId:brand.id}));console.log('UI test fixtures prepared');
 }}finally{await db.$disconnect();}

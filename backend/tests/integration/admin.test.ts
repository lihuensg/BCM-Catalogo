import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {randomUUID,randomBytes} from 'node:crypto';
import request from 'supertest';
import {createPrismaClient} from '../../src/infrastructure/prisma/client.js';
import {requireDatabaseUrl} from '../../src/config/database.js';
import {createApp} from '../../src/app.js';
import {hashPassword,verifyPassword} from '../../src/modules/auth/password.js';
import {sessionHash} from '../../src/modules/auth/service.js';
import {seedAdmin} from '../../src/modules/auth/seed.js';
const db=createPrismaClient(requireDatabaseUrl(process.env.TEST_DATABASE_URL,'TEST_DATABASE_URL'));
const prefix='api-'+randomUUID();
const email=prefix+'@example.test',password=randomBytes(24).toString('base64url');
const origin='http://localhost:3000';
const app=createApp({corsOrigins:[origin],database:db});
const agent=request.agent(app);
const authApp=()=>createApp({corsOrigins:[origin],database:db});
const slug=(suffix:string)=>prefix+'-'+suffix;
let adminId:string;
let ownedSettingsId:string|undefined;
const headers={'X-BCM-Admin':'1',Origin:origin};
const login=(target=app,body={email,password})=>request(target).post('/api/v1/auth/login').set(headers).send(body);
before(async()=>{
 await db.$connect();
 const user=await db.adminUser.create({data:{name:'API fixture',email,passwordHash:await hashPassword(password),active:true}});adminId=user.id;
 await agent.post('/api/v1/auth/login').set(headers).send({email,password}).expect(200);
});
after(async()=>{
 try{
  await db.product.deleteMany({where:{slug:{startsWith:prefix}}});
  await db.categoryAttribute.deleteMany({where:{category:{slug:{startsWith:prefix}}}});
  await db.attributeOption.deleteMany({where:{attribute:{slug:{startsWith:prefix}}}});
  await db.attributeDefinition.deleteMany({where:{slug:{startsWith:prefix}}});
  await db.category.updateMany({where:{slug:{startsWith:prefix}},data:{parentId:null}});
  await db.category.deleteMany({where:{slug:{startsWith:prefix}}});
  await db.brand.deleteMany({where:{slug:{startsWith:prefix}}});
  await db.banner.deleteMany({where:{title:{startsWith:prefix}}});
  if(ownedSettingsId)await db.siteSettings.deleteMany({where:{id:ownedSettingsId}});
  await db.adminUser.deleteMany({where:{email:{startsWith:prefix}}});
 }finally{await db.$disconnect();}
});
function cookieFrom(response:{headers:Record<string,unknown>}){
 const raw=response.headers['set-cookie'];assert.ok(Array.isArray(raw));
 const cookie=raw[0] as string;assert.ok(cookie);return cookie.split(';')[0]!;
}
test('auth login returns safe identity, cookie, me and supports another app instance',async()=>{
 const r=await login().expect(200),cookie=cookieFrom(r);
 assert.deepEqual(Object.keys(r.body.data).sort(),['email','id','name']);
 assert.equal(r.body.data.id,adminId);assert.equal(JSON.stringify(r.body).includes('password'),false);
 assert.match((r.headers['set-cookie'] as unknown as string[])[0]!,/HttpOnly/);
 assert.match((r.headers['set-cookie'] as unknown as string[])[0]!,/SameSite=Lax/);
 assert.equal(r.headers['cache-control'],'no-store');
 const token=cookie.slice(cookie.indexOf('=')+1);
 const session=await db.adminSession.findUniqueOrThrow({where:{tokenHash:sessionHash(token)}});
 assert.notEqual(session.tokenHash,token);assert.ok(session.expiresAt>new Date());
 await request(authApp()).get('/api/v1/auth/me').set('Cookie',cookie).expect(200);
 await request(app).post('/api/v1/auth/logout').set(headers).set('Cookie',cookie).expect(204);
});
test('wrong password, nonexistent email and inactive admin produce identical generic errors',async()=>{
 const wrong=await login(authApp(),{email,password:'incorrect'}).expect(401);
 const missing=await login(authApp(),{email:prefix+'-missing@example.test',password}).expect(401);
 await db.adminUser.update({where:{id:adminId},data:{active:false}});
 try{
  const inactive=await login(authApp()).expect(401);
  assert.deepEqual(wrong.body,missing.body);assert.deepEqual(wrong.body,inactive.body);
  assert.equal(wrong.body.error.code,'AUTH_INVALID_CREDENTIALS');
  await agent.get('/api/v1/auth/me').expect(401);
 }finally{await db.adminUser.update({where:{id:adminId},data:{active:true}});}
});
test('logout invalidates replay, login rotates previous session, expired/random sessions fail',async()=>{
 const first=await login(authApp()).expect(200),old=cookieFrom(first);
 const second=await login(authApp()).set('Cookie',old).expect(200),current=cookieFrom(second);
 await request(app).get('/api/v1/auth/me').set('Cookie',old).expect(401);
 const out=await request(app).post('/api/v1/auth/logout').set(headers).set('Cookie',current).expect(204);
 assert.match((out.headers['set-cookie'] as unknown as string[])[0]!,/Expires=Thu, 01 Jan 1970/);
 await request(app).get('/api/v1/auth/me').set('Cookie',current).expect(401);
 const exp=cookieFrom(await login(authApp()).expect(200));
 await db.adminSession.update({where:{tokenHash:sessionHash(exp.split('=')[1]!)},data:{expiresAt:new Date(0)}});
 await request(app).get('/api/v1/auth/me').set('Cookie',exp).expect(401);
 await request(app).get('/api/v1/admin/categories').set('Cookie','bcm_session='+randomBytes(32).toString('base64url')).expect(401);
});
test('development admin seed hashes, is idempotent, preserves existing credentials and forbids production',async()=>{
 const seedEmail=prefix+'-seed@example.test',env={ADMIN_EMAIL:seedEmail,ADMIN_PASSWORD:password,ADMIN_NAME:'Seed fixture',NODE_ENV:'test'};
 await seedAdmin(db,env);const first=await db.adminUser.findUniqueOrThrow({where:{email:seedEmail}});
 await seedAdmin(db,{...env,ADMIN_PASSWORD:randomBytes(24).toString('base64url')});const second=await db.adminUser.findUniqueOrThrow({where:{email:seedEmail}});
 assert.equal(first.id,second.id);assert.equal(first.passwordHash,second.passwordHash);assert.equal(await verifyPassword(first.passwordHash,password),true);
 await assert.rejects(seedAdmin(db,{...env,NODE_ENV:'production'}));await assert.rejects(seedAdmin(db,{ADMIN_EMAIL:seedEmail}));
});
test('category CRUD, partial update, unique slug, parent validation and cycle prevention',async()=>{
 const create=(suffix:string,extra:object={})=>agent.post('/api/v1/admin/categories').set(headers).send({name:slug(suffix),slug:slug(suffix),...extra});
 const root=(await create('root',{active:true,sortOrder:7}).expect(201)).body.data;
 const child=(await create('child',{parentId:root.id,active:true,sortOrder:4}).expect(201)).body.data;
 const edited=await agent.patch('/api/v1/admin/categories/'+child.id).set(headers).send({name:'Edited'}).expect(200);
 assert.equal(edited.body.data.active,true);assert.equal(edited.body.data.parentId,root.id);assert.equal(edited.body.data.sortOrder,4);
 assert.equal((await agent.patch('/api/v1/admin/categories/'+root.id).set(headers).send({parentId:child.id}).expect(409)).body.error.code,'CATEGORY_CYCLE');
 await agent.patch('/api/v1/admin/categories/'+root.id).set(headers).send({parentId:root.id}).expect(409);
 await create('invalid-parent',{parentId:randomUUID()}).expect(404);
 assert.equal((await create('root').expect(409)).body.error.code,'CATEGORY_SLUG_EXISTS');
 await agent.get('/api/v1/admin/categories/'+child.id).expect(200);
 await agent.delete('/api/v1/admin/categories/'+root.id).set(headers).expect(409);
 await agent.delete('/api/v1/admin/categories/'+child.id).set(headers).expect(204);
 await agent.delete('/api/v1/admin/categories/'+root.id).set(headers).expect(204);
 await agent.get('/api/v1/admin/categories/'+root.id).expect(404);
});
test('master records cannot be deleted while referenced and active category cannot be disabled',async()=>{
 const category=(await agent.post('/api/v1/admin/categories').set(headers).send({name:'Used',slug:slug('used'),active:true}).expect(201)).body.data;
 const brand=(await agent.post('/api/v1/admin/brands').set(headers).send({name:'Used',slug:slug('used')}).expect(201)).body.data;
 const product=await db.product.create({data:{name:'Generic fixture',slug:slug('product'),shortDescription:'Test',categoryId:category.id,brandId:brand.id,active:true,publishedAt:new Date(),price:'1234567890123456.78',showPrice:false}});
 assert.equal((await agent.delete('/api/v1/admin/categories/'+category.id).set(headers).expect(409)).body.error.code,'CATEGORY_IN_USE');
 await agent.patch('/api/v1/admin/categories/'+category.id).set(headers).send({active:false}).expect(409);
 assert.equal((await agent.delete('/api/v1/admin/brands/'+brand.id).set(headers).expect(409)).body.error.code,'BRAND_IN_USE');
 const detail=await agent.get('/api/v1/admin/products/'+product.id).expect(200);
 assert.equal(detail.body.data.price,'1234567890123456.78');assert.equal(detail.body.data.category.id,category.id);
 const list=await agent.get('/api/v1/admin/products').query({search:slug('product'),categoryId:category.id,brandId:brand.id,active:'true'}).expect(200);
 assert.equal(list.body.meta.total,1);assert.equal(list.body.data[0].id,product.id);
 await agent.post('/api/v1/admin/products').set(headers).send({}).expect(400);
 await request(app).get('/api/v1/products/'+product.slug).expect(404);
});
test('brand CRUD and reusable pagination/filter/sort reject unbounded and arbitrary queries',async()=>{
 const ids:string[]=[];
 for(let i=0;i<3;i++)ids.push((await agent.post('/api/v1/admin/brands').set(headers).send({name:slug('page')+i,slug:slug('page')+i,active:i<2}).expect(201)).body.data.id);
 const r=await agent.get('/api/v1/admin/brands').query({search:slug('page'),active:'true',pageSize:1,page:2,sort:'slug',order:'asc'}).expect(200);
 assert.equal(r.body.data.length,1);assert.deepEqual(r.body.meta,{page:2,pageSize:1,total:2,totalPages:2});
 assert.equal(r.body.data[0].id,ids[1]);
 const edit=await agent.patch('/api/v1/admin/brands/'+ids[0]).set(headers).send({description:'Edited'}).expect(200);assert.equal(edit.body.data.active,true);
 await agent.get('/api/v1/admin/brands/'+ids[0]).expect(200);
 for(const query of [{pageSize:101},{page:0},{sort:'passwordHash'},{active:'yes'},{unknown:1}])await agent.get('/api/v1/admin/brands').query(query).expect(400);
 await agent.get('/api/v1/admin/brands/not-uuid').expect(400);
 await agent.patch('/api/v1/admin/brands/'+ids[0]).set(headers).send({}).expect(400);
 await agent.post('/api/v1/admin/brands').set(headers).send({name:'Secret',slug:slug('secret'),passwordHash:'secret'}).expect(400);
 for(const id of ids)await agent.delete('/api/v1/admin/brands/'+id).set(headers).expect(204);
});
test('OPTION CRUD creates options atomically and protects ownership, active last option and values',async()=>{
 const create=(suffix:string,extra:object={})=>agent.post('/api/v1/admin/attributes').set(headers).send({name:'Attribute',slug:slug(suffix),dataType:'OPTION',active:true,...extra});
 await create('empty').expect(400);
 await create('duplicate-options',{options:[{label:'A',value:'a'},{label:'B',value:'a'}]}).expect(400);
 assert.equal(await db.attributeDefinition.count({where:{slug:slug('duplicate-options')}}),0);
 const attr=(await create('option',{options:[{label:'A',value:'a'}]}).expect(201)).body.data;
 const optionList=await agent.get('/api/v1/admin/attributes/'+attr.id+'/options').expect(200),first=optionList.body.data[0];
 assert.equal(optionList.body.meta.total,1);
 const second=(await agent.post('/api/v1/admin/attributes/'+attr.id+'/options').set(headers).send({label:'B',value:'b',sortOrder:5}).expect(201)).body.data;
 await agent.patch('/api/v1/admin/attributes/'+attr.id+'/options/'+second.id).set(headers).send({label:'Updated'}).expect(200);
 assert.equal((await agent.get('/api/v1/admin/attributes/'+attr.id+'/options/'+second.id).expect(200)).body.data.sortOrder,5);
 await agent.patch('/api/v1/admin/attributes/'+randomUUID()+'/options/'+second.id).set(headers).send({label:'Wrong'}).expect(404);
 await agent.patch('/api/v1/admin/attributes/'+attr.id).set(headers).send({dataType:'TEXT'}).expect(409);
 await agent.delete('/api/v1/admin/attributes/'+attr.id+'/options/'+second.id).set(headers).expect(204);
 await agent.delete('/api/v1/admin/attributes/'+attr.id+'/options/'+first.id).set(headers).expect(409);
 await agent.patch('/api/v1/admin/attributes/'+attr.id).set(headers).send({active:false}).expect(200);
 await agent.delete('/api/v1/admin/attributes/'+attr.id+'/options/'+first.id).set(headers).expect(204);
 await agent.delete('/api/v1/admin/attributes/'+attr.id).set(headers).expect(204);
});
test('category attribute associations preserve published product requirements and existing values',async()=>{
 const category=(await agent.post('/api/v1/admin/categories').set(headers).send({name:'Relations',slug:slug('relations'),active:true}).expect(201)).body.data;
 const attribute=(await agent.post('/api/v1/admin/attributes').set(headers).send({name:'Text',slug:slug('relations'),dataType:'TEXT',active:true}).expect(201)).body.data;
 const path='/api/v1/admin/categories/'+category.id+'/attributes';
 await agent.post(path).set(headers).send({attributeId:attribute.id,required:false,sortOrder:3}).expect(201);
 const product=await db.product.create({data:{name:'Relations',slug:slug('relations'),shortDescription:'Test',categoryId:category.id,active:true,publishedAt:new Date()}});
 await agent.patch(path+'/'+attribute.id).set(headers).send({required:true}).expect(409);
 await db.productAttributeValue.create({data:{productId:product.id,categoryId:category.id,attributeId:attribute.id,dataType:'TEXT',textValue:'Fixture'}});
 await agent.patch('/api/v1/admin/attributes/'+attribute.id).set(headers).send({active:false}).expect(409);
 await agent.patch('/api/v1/admin/attributes/'+attribute.id).set(headers).send({dataType:'NUMBER'}).expect(409);
 await agent.delete(path+'/'+attribute.id).set(headers).expect(409);
 await agent.delete('/api/v1/admin/attributes/'+attribute.id).set(headers).expect(409);
 await agent.get(path).query({required:'false'}).expect(200);
 await agent.get(path+'/'+attribute.id).expect(200);
 const edit=await agent.patch(path+'/'+attribute.id).set(headers).send({sortOrder:9}).expect(200);assert.equal(edit.body.data.required,false);
 await db.product.delete({where:{id:product.id}});
 await agent.patch(path+'/'+attribute.id).set(headers).send({required:true}).expect(200);
 await agent.delete(path+'/'+attribute.id).set(headers).expect(204);
 await agent.delete('/api/v1/admin/attributes/'+attribute.id).set(headers).expect(204);
});
test('banner CRUD accepts equal interval bounds, validates partial merged interval and URLs',async()=>{
 const body={title:slug('banner'),imageUrl:'https://assets.example/banner.jpg',placement:'HOME_HERO',active:true,sortOrder:8,startsAt:'2026-09-20T00:00:00Z',endsAt:'2026-09-20T00:00:00Z'};
 const banner=(await agent.post('/api/v1/admin/banners').set(headers).send(body).expect(201)).body.data;
 await agent.patch('/api/v1/admin/banners/'+banner.id).set(headers).send({endsAt:'2026-09-19T00:00:00Z'}).expect(400);
 await agent.patch('/api/v1/admin/banners/'+banner.id).set(headers).send({imageUrl:'javascript:alert(1)'}).expect(400);
 const edit=await agent.patch('/api/v1/admin/banners/'+banner.id).set(headers).send({subtitle:'Edited'}).expect(200);
 assert.equal(edit.body.data.active,true);assert.equal(edit.body.data.sortOrder,8);assert.equal(edit.body.data.startsAt,banner.startsAt);
 await agent.get('/api/v1/admin/banners').query({search:slug('banner'),placement:'HOME_HERO',active:'true'}).expect(200);
 await agent.get('/api/v1/admin/banners/'+banner.id).expect(200);
 await agent.delete('/api/v1/admin/banners/'+banner.id).set(headers).expect(204);
});
test('settings PUT maintains singleton, validates business settings and does not expose internal flag',async()=>{
 assert.equal(await db.siteSettings.count(),0,'Dedicated integration DB must have no existing settings; do not overwrite business data');
 assert.equal((await agent.get('/api/v1/admin/settings').expect(200)).body.data,null);
 const body={siteName:'Fixture',defaultSeoTitle:'Fixture',defaultSeoDescription:'Fixture'};
 const first=await agent.put('/api/v1/admin/settings').set(headers).send(body).expect(200);ownedSettingsId=first.body.data.id;
 const second=await agent.put('/api/v1/admin/settings').set(headers).send({...body,heroTitle:'Updated'}).expect(200);
 assert.equal(first.body.data.id,second.body.data.id);assert.equal(await db.siteSettings.count(),1);assert.equal('singleton' in second.body.data,false);
 await agent.put('/api/v1/admin/settings').set(headers).send({...body,instagramUrl:'https://evil.example'}).expect(400);
 await agent.put('/api/v1/admin/settings').set(headers).send({...body,whatsappNumber:'1234567',whatsappMessageTemplate:'{{password}}'}).expect(400);
 await agent.put('/api/v1/admin/settings').set(headers).send({...body,whatsappNumber:'1234567',whatsappMessageTemplate:'Hola {{productName}}'}).expect(200);
});

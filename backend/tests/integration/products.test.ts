import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {randomUUID,randomBytes} from 'node:crypto';
import request from 'supertest';
import type {ProductAdminDetailDto} from '@bcm/shared';
import {createApp} from '../../src/app.js';
import {createPrismaClient} from '../../src/infrastructure/prisma/client.js';
import {requireDatabaseUrl} from '../../src/config/database.js';
import {hashPassword} from '../../src/modules/auth/password.js';
import {productRepository} from '../../src/modules/products/repository.js';
import {productAdminService} from '../../src/modules/products/admin-service.js';
import {querySchema} from '../../src/modules/products/admin-schema.js';
import type {ProductMutationEvent} from '../../src/modules/products/events.js';
const db=createPrismaClient(requireDatabaseUrl(process.env.TEST_DATABASE_URL,'TEST_DATABASE_URL'));
const prefix='product-'+randomUUID(),slug=(s:string)=>prefix+'-'+s;
const headers={'X-BCM-Admin':'1'};
const events:ProductMutationEvent[]=[],committed:boolean[]=[];
const app=createApp({corsOrigins:[],database:db,productMutationHook:async event=>{
 events.push(event);committed.push(await db.product.count({where:{id:event.productId,slug:event.slug}})===1);
}});
const agent=request.agent(app);
let categoryId:string,otherCategoryId:string,attributeCategoryId:string,brandId:string,textId:string,numberId:string,booleanId:string,optionId:string,choiceId:string,wrongChoiceId:string;
const data=(suffix:string,extra:object={})=>({name:'Producto genérico',slug:slug(suffix),shortDescription:'Descripción',categoryId,...extra});
const create=async(suffix:string,extra:object={})=>(await agent.post('/api/v1/admin/products').set(headers).send(data(suffix,extra)).expect(201)).body.data as ProductAdminDetailDto;
const edit=async(id:string,body:object)=>(await agent.patch('/api/v1/admin/products/'+id).set(headers).send(body).expect(200)).body.data as ProductAdminDetailDto;
const detail=async(id:string)=>(await agent.get('/api/v1/admin/products/'+id).expect(200)).body.data as ProductAdminDetailDto;
const values=()=>[
 {attributeId:textId,dataType:'TEXT',textValue:'Floral'},
 {attributeId:numberId,dataType:'NUMBER',numberValue:'100.125'},
 {attributeId:booleanId,dataType:'BOOLEAN',booleanValue:false},
 {attributeId:optionId,dataType:'OPTION',optionId:choiceId}
];
const image=(suffix:string,primary=false,sortOrder=0)=>({url:'https://assets.example/'+suffix+'.jpg',altText:'Imagen '+suffix,isPrimary:primary,sortOrder});
before(async()=>{
 await db.$connect();
 const email=prefix+'@example.test',password=randomBytes(24).toString('base64url');
 await db.adminUser.create({data:{name:'Product QA',email,passwordHash:await hashPassword(password),active:true}});
 await agent.post('/api/v1/auth/login').set(headers).send({email,password}).expect(200);
 categoryId=(await db.category.create({data:{name:'Simple',slug:slug('category'),active:true}})).id;
 attributeCategoryId=(await db.category.create({data:{name:'Attributes',slug:slug('attributes'),active:true}})).id;
 otherCategoryId=(await db.category.create({data:{name:'Other',slug:slug('other'),active:true}})).id;
 brandId=(await db.brand.create({data:{name:'Brand',slug:slug('brand')}})).id;
 textId=(await db.attributeDefinition.create({data:{name:'Text',slug:slug('text'),dataType:'TEXT',active:true}})).id;
 numberId=(await db.attributeDefinition.create({data:{name:'Number',slug:slug('number'),dataType:'NUMBER',active:true}})).id;
 booleanId=(await db.attributeDefinition.create({data:{name:'Boolean',slug:slug('boolean'),dataType:'BOOLEAN',active:true}})).id;
 optionId=(await db.attributeDefinition.create({data:{name:'Option',slug:slug('option'),dataType:'OPTION',active:true}})).id;
 const otherOption=(await db.attributeDefinition.create({data:{name:'Foreign',slug:slug('foreign'),dataType:'OPTION',active:true}})).id;
 choiceId=(await db.attributeOption.create({data:{attributeId:optionId,label:'One',value:'one'}})).id;
 wrongChoiceId=(await db.attributeOption.create({data:{attributeId:otherOption,label:'Wrong',value:'wrong'}})).id;
 await db.categoryAttribute.createMany({data:[...([textId,numberId,booleanId,optionId].map(attributeId=>({categoryId:attributeCategoryId,attributeId,required:attributeId===textId||attributeId===optionId}))),{categoryId:otherCategoryId,attributeId:textId,required:true}]});
});
after(async()=>{
 try{
  await db.product.deleteMany({where:{slug:{startsWith:prefix}}});
  await db.categoryAttribute.deleteMany({where:{category:{slug:{startsWith:prefix}}}});
  await db.attributeOption.deleteMany({where:{attribute:{slug:{startsWith:prefix}}}});
  await db.attributeDefinition.deleteMany({where:{slug:{startsWith:prefix}}});
  await db.category.deleteMany({where:{slug:{startsWith:prefix}}});
  await db.brand.deleteMany({where:{slug:{startsWith:prefix}}});
  await db.adminUser.deleteMany({where:{email:prefix+'@example.test'}});
 }finally{await db.$disconnect();}
});
test('product creation covers minimal, unknown/internal/visible price, nullable brand and made to order',async()=>{
 const minimum=await create('minimal');assert.equal(minimum.price,null);assert.equal(minimum.brand,null);assert.equal(minimum.active,false);assert.equal(minimum.publishedAt,null);
 const priced=await create('priced',{price:'1234567890123456.78',showPrice:true,brandId});assert.equal(priced.price,'1234567890123456.78');assert.equal(priced.brand?.id,brandId);
 const hidden=await create('hidden',{price:'10.20',showPrice:false,compareAtPrice:'20.00'});assert.equal(hidden.price,'10.20');assert.equal(hidden.onSale,false);
 const ordered=await create('ordered',{saleMode:'MADE_TO_ORDER',availability:'MADE_TO_ORDER'});assert.equal(ordered.saleMode,'MADE_TO_ORDER');assert.equal(ordered.brandId,null);
 await agent.post('/api/v1/admin/products').set(headers).send(data('missing-category',{categoryId:randomUUID()})).expect(400);
 await agent.post('/api/v1/admin/products').set(headers).send(data('missing-brand',{brandId:randomUUID()})).expect(400);
});
test('product rejects invalid money and sale combinations without writes or events',async()=>{
 const beforeEvents=events.length;
 for(const [suffix,extra,code]of [
  ['negative',{price:'-1'},'PRODUCT_PRICE_INVALID'],['compare',{price:'10',compareAtPrice:'10'},'PRODUCT_PRICE_INVALID'],
  ['floating',{price:0.1},'PRODUCT_PRICE_INVALID'],['orphan-compare',{compareAtPrice:'5'},'PRODUCT_PRICE_INVALID'],
  ['sale',{saleMode:'MADE_TO_ORDER',availability:'AVAILABLE'},'VALIDATION_ERROR']
 ] as const){const response=await agent.post('/api/v1/admin/products').set(headers).send(data(suffix,extra)).expect(400);assert.equal(response.body.error.code,code);assert.equal(await db.product.count({where:{slug:slug(suffix)}}),0);}
 assert.equal(events.length,beforeEvents);
});
test('slug/SKU conflicts have separate codes and failed edit restores attributes, images and scalar fields',async()=>{
 const existing=await create('conflict',{sku:slug('sku')});
 assert.equal((await agent.post('/api/v1/admin/products').set(headers).send(data('conflict')).expect(409)).body.error.code,'PRODUCT_SLUG_EXISTS');
 assert.equal((await agent.post('/api/v1/admin/products').set(headers).send(data('conflict-sku',{sku:slug('sku')})).expect(409)).body.error.code,'PRODUCT_SKU_EXISTS');
 const product=await create('rollback',{categoryId:attributeCategoryId,attributeValues:values(),images:[image('original',true)]});
 const beforeEvents=events.length;
 await agent.patch('/api/v1/admin/products/'+product.id).set(headers).send({name:'Must rollback',slug:existing.slug,attributeValues:[],images:[]}).expect(409);
 const after=await detail(product.id);assert.deepEqual(after,product);assert.equal(events.length,beforeEvents);
 await agent.patch('/api/v1/admin/products/'+product.id).set(headers).send({sku:slug('sku')}).expect(409);
 const changed=await edit(product.id,{sku:'  Mixed-SKU  '});assert.equal(changed.sku,'Mixed-SKU');
 assert.equal((await edit(product.id,{sku:null})).sku,null);
});
test('publication validates required attributes while drafts remain incomplete; date retained across activation',async()=>{
 const draft=await create('draft',{categoryId:attributeCategoryId});
 const failed=await agent.patch('/api/v1/admin/products/'+draft.id).set(headers).send({active:true}).expect(400);assert.equal(failed.body.error.code,'PRODUCT_ATTRIBUTE_REQUIRED');
 assert.equal((await detail(draft.id)).publishedAt,null);
 const published=await edit(draft.id,{active:true,attributeValues:values()});assert.ok(published.publishedAt);assert.equal(published.images.length,0);
 assert.equal(published.attributeValues.find(v=>v.attributeId===booleanId)?.booleanValue,false);
 assert.equal(published.attributeValues.find(v=>v.attributeId===optionId)?.option?.label,'One');
 assert.equal(published.attributeValues.find(v=>v.attributeId===numberId)?.definition.dataType,'NUMBER');
 await agent.delete('/api/v1/admin/products/'+draft.id).set(headers).expect(204);
 assert.equal((await detail(draft.id)).active,false);assert.equal(await db.productAttributeValue.count({where:{productId:draft.id}}),4);
 const again=await edit(draft.id,{active:true});assert.equal(again.publishedAt,published.publishedAt);
 const at=await detail(draft.id);const flags=await edit(draft.id,{featured:true,onSale:true,newArrival:true,sortOrder:7});
 assert.equal(flags.price,at.price);assert.equal(flags.availability,at.availability);assert.equal(flags.publishedAt,at.publishedAt);
});
test('attribute validation rejects wrong category/type/option and category switch requires explicit replacement',async()=>{
 const product=await create('attributes-case',{categoryId:attributeCategoryId,active:true,attributeValues:values()});
 const invalid=[
 [{attributeId:textId,dataType:'BOOLEAN',booleanValue:true}],
 [{attributeId:optionId,dataType:'OPTION',optionId:wrongChoiceId}],
 [{attributeId:randomUUID(),dataType:'TEXT',textValue:'Wrong'}]
 ];
 for(const attributeValues of invalid){const r=await agent.patch('/api/v1/admin/products/'+product.id).set(headers).send({attributeValues}).expect(400);assert.equal(r.body.error.code,'PRODUCT_ATTRIBUTE_INVALID');}
 await agent.patch('/api/v1/admin/products/'+product.id).set(headers).send({categoryId:otherCategoryId}).expect(400);
 await agent.patch('/api/v1/admin/products/'+product.id).set(headers).send({categoryId:otherCategoryId,attributeValues:[]}).expect(400);
 assert.deepEqual(await detail(product.id),product);
 const moved=await edit(product.id,{categoryId:otherCategoryId,attributeValues:[{attributeId:textId,dataType:'TEXT',textValue:'Kept explicitly'}]});
 assert.equal(moved.category.id,otherCategoryId);assert.equal(moved.attributeValues.length,1);
 assert.equal(await db.productAttributeValue.count({where:{productId:product.id,categoryId:attributeCategoryId}}),0);
 const emptied=await edit(product.id,{categoryId,attributeValues:[]});assert.deepEqual(emptied.attributeValues,[]);
});
test('gallery replacement preserves retained IDs and creation dates, reorders and replaces/removes primary atomically',async()=>{
 const product=await create('gallery',{images:[image('front',true),image('back',false,1)]});
 const first=product.images[0]!,second=product.images[1]!;
 const originalDate=(await db.productImage.findUniqueOrThrow({where:{id:first.id}})).createdAt;
 const swapped=await edit(product.id,{images:[{...second,isPrimary:true,sortOrder:0},{...first,isPrimary:false,sortOrder:1}]});
 assert.equal(swapped.images[0]?.id,second.id);assert.equal(swapped.primaryImageId,second.id);
 assert.equal((await db.productImage.findUniqueOrThrow({where:{id:first.id}})).createdAt.getTime(),originalDate.getTime());
 const other=await create('other-gallery',{images:[image('foreign',true)]});
 for(const images of [[...swapped.images,{...other.images[0]!,isPrimary:false}],[first,first],[{...first,isPrimary:true},{...second,isPrimary:true}],[{...first,url:'javascript:bad'}]]){
  const r=await agent.patch('/api/v1/admin/products/'+product.id).set(headers).send({images}).expect(400);assert.equal(r.body.error.code,'PRODUCT_IMAGE_INVALID');
 }
 assert.deepEqual(await detail(product.id),swapped);
 const removed=await edit(product.id,{images:[{...first,isPrimary:false}]});assert.equal(removed.primaryImageId,null);assert.equal(removed.images.length,1);
 assert.equal(await db.productImage.count({where:{id:second.id}}),0);
 assert.equal((await edit(product.id,{images:[]})).images.length,0);
 const full=await edit(product.id,{images:Array.from({length:30},(_,i)=>image('bulk'+i,i===29,i))});assert.equal(full.images.length,30);assert.equal(full.images.filter(i=>i.isPrimary).length,1);
});
test('list combines all admin filters, searches SKU, paginates and excludes heavy columns at repository level',async()=>{
 const a=await create('list-a',{brandId,price:'20',showPrice:false,featured:true,newArrival:true,saleMode:'MADE_TO_ORDER',availability:'MADE_TO_ORDER',sku:slug('search-sku'),fullDescription:'Large private description'});
 const b=await create('list-b',{brandId,price:'5',showPrice:true,active:true});
 await create('list-c',{brandId,price:'300',featured:true,onSale:true});
 const response=await agent.get('/api/v1/admin/products').query({search:slug('list-').slice(0,-1),categoryId,brandId,active:'false',availability:'MADE_TO_ORDER',saleMode:'MADE_TO_ORDER',featured:'true',onSale:'false',newArrival:'true',showPrice:'false'}).expect(200);
 assert.equal(response.body.meta.total,1);assert.equal(response.body.data[0].id,a.id);
 const page=await agent.get('/api/v1/admin/products').query({search:slug('list'),sort:'price',order:'asc',page:2,pageSize:1}).expect(200);
 assert.equal(page.body.data[0].id,a.id);assert.equal(page.body.meta.total,3);
 assert.equal((await agent.get('/api/v1/admin/products').query({search:slug('search-sku')}).expect(200)).body.data[0].id,a.id);
 await agent.get('/api/v1/admin/products').query({sort:'publishedAt',order:'desc'}).expect(200);
 const raw=await productRepository(db).list(querySchema.parse({search:slug('list')}));
 for(const row of raw.data)assert.ok(row.images.length<=1);
 for(const row of page.body.data)assert.equal('images' in row,false);
 for(const row of [...raw.data,...page.body.data])for(const field of ['fullDescription','attributeValues','seoDescription'])assert.equal(field in row,false);
 assert.equal((await detail(b.id)).active,true);
});
test('deactivation is non-destructive and idempotent; hooks observe committed state and hook failure cannot roll it back',async()=>{
 const product=await create('deactivate',{active:true,images:[image('saved',true)]});
 const beforeEvents=events.length;
 await agent.delete('/api/v1/admin/products/'+product.id).set(headers).expect(204);
 await agent.delete('/api/v1/admin/products/'+product.id).set(headers).expect(204);
 assert.equal(events.length,beforeEvents+1);assert.equal(events.at(-1)?.type,'ProductUnpublished');
 const row=await detail(product.id);assert.equal(row.active,false);assert.equal(row.images.length,1);assert.equal(row.slug,product.slug);
 const service=productAdminService(db,()=>{throw new Error('consumer-secret');});
 const changed=await service.update(product.id,{name:'Committed despite consumer failure'});assert.equal((await detail(product.id)).name,changed.name);
 assert.ok(committed.every(Boolean));
 await agent.delete('/api/v1/admin/products/'+randomUUID()).set(headers).expect(404);
});
test('nested PostgreSQL insert failure leaves no partial product, gallery or values',async()=>{
 await assert.rejects(productRepository(db).create({...data('db-rollback'),images:{create:[image('valid'),{...image('bad'),sortOrder:-1}]}}));
 assert.equal(await db.product.count({where:{slug:slug('db-rollback')}}),0);
 assert.equal(await db.productImage.count({where:{product:{slug:slug('db-rollback')}}}),0);
});

 test('dashboard requires auth, returns exact counts and bounded safe summary blocks',async()=>{
 await request(app).get('/api/v1/admin/dashboard').expect(401);
 const response=await agent.get('/api/v1/admin/dashboard').expect(200);const result=response.body.data;
 assert.equal(result.counts.total,await db.product.count());assert.equal(result.counts.active,await db.product.count({where:{active:true}}));
 for(const key of ['recent','withoutImage','withoutVisiblePrice','inactive']){assert.ok(result[key].length<=5);for(const row of result[key])assert.deepEqual(Object.keys(row).sort(),['active','id','name','slug','updatedAt']);}
 for(const row of result.withoutImage)assert.equal(await db.productImage.count({where:{productId:row.id}}),0);
 await agent.get('/api/v1/admin/dashboard?unknown=1').expect(400);
 });
 test('product table projects one primary thumbnail, names, and no full gallery',async()=>{
 const item=await create('table-projection',{brandId,images:[image('table-main',true),image('table-secondary')]});
 const response=await agent.get('/api/v1/admin/products?search='+item.slug).expect(200);const row=response.body.data[0];
 assert.equal(row.categoryName,'Simple');assert.equal(row.brandName,'Brand');assert.equal(row.thumbnail.url,'https://assets.example/table-main.jpg');assert.equal('images'in row,false);assert.equal('attributeValues'in row,false);
 });
 test('form definitions are category scoped, paginated, and include safe definitions',async()=>{
 await request(app).get('/api/v1/admin/categories/'+attributeCategoryId+'/product-attributes').expect(401);
 const response=await agent.get('/api/v1/admin/categories/'+attributeCategoryId+'/product-attributes?pageSize=2').expect(200);
 assert.equal(response.body.data.length,2);assert.equal(response.body.meta.total,4);for(const row of response.body.data){assert.equal(row.categoryId,attributeCategoryId);assert.equal(row.definition.id,row.attributeId);assert.equal('values'in row.definition,false);}
 await agent.get('/api/v1/admin/categories/'+randomUUID()+'/product-attributes').expect(404);
 });

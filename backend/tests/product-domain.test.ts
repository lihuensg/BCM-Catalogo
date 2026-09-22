import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import request from 'supertest';
import {Prisma} from '../src/generated/prisma/client.js';
import {createApp} from '../src/app.js';
import {patchSchema} from '../src/modules/products/mutation-schema.js';
import {productSchema} from '../src/modules/products/schema.js';
import {productOperation} from '../src/modules/products/errors.js';
import {validateGalleryOwnership} from '../src/modules/products/state.js';
import {notifyProductMutation,type ProductMutationEvent} from '../src/modules/products/events.js';
import {querySchema} from '../src/modules/products/admin-schema.js';
const base={name:'Producto',slug:'producto',shortDescription:'Descripción',categoryId:randomUUID()};
test('product PATCH preserves omissions and accepts explicit null, false and zero without defaults',()=>{
 assert.deepEqual(patchSchema.parse({name:'Edited'}),{name:'Edited'});
 assert.deepEqual(patchSchema.parse({images:[],attributeValues:[],brandId:null,active:false,sortOrder:0}),{images:[],attributeValues:[],brandId:null,active:false,sortOrder:0});
 for(const body of [{},{publishedAt:'2026-01-01T00:00:00Z'},{createdAt:'x'},{categoryId:null},{name:''}])assert.equal(patchSchema.safeParse(body).success,false);
 assert.equal(patchSchema.parse({price:'1234567890123456.78'}).price?.toFixed(2),'1234567890123456.78');
});
test('product mutation error codes distinguish money, gallery, attributes and unique slug/SKU',async()=>{
 for(const [body,code] of [[{price:'-1'},'PRODUCT_PRICE_INVALID'],[{images:[{url:'javascript:bad',altText:'x'}]},'PRODUCT_IMAGE_INVALID'],[{attributeValues:[{attributeId:randomUUID(),dataType:'TEXT',booleanValue:true}]},'PRODUCT_ATTRIBUTE_INVALID']] as const){
  await assert.rejects(productOperation(async()=>productSchema.parse({...base,...body})),{code});
 }
 for(const field of ['slug','sku']){
  const error=new Prisma.PrismaClientKnownRequestError('private SQL',{code:'P2002',clientVersion:'test',meta:{target:[field]}});
  await assert.rejects(productOperation(async()=>{throw error;}),{code:field==='slug'?'PRODUCT_SLUG_EXISTS':'PRODUCT_SKU_EXISTS'});
 }
});
test('gallery validates ownership, duplicate IDs, limits and primary multiplicity',()=>{
 const id=randomUUID(),image={id,url:'https://assets.example/a.jpg',altText:'A',isPrimary:true,sortOrder:0};
 assert.doesNotThrow(()=>validateGalleryOwnership([image],[{id}]));
 assert.throws(()=>validateGalleryOwnership([image],[]),{code:'PRODUCT_IMAGE_INVALID'});
 assert.throws(()=>validateGalleryOwnership([image,image],[{id}]),{code:'PRODUCT_IMAGE_INVALID'});
 const {id:_id,...newImage}=image;void _id;
 assert.equal(productSchema.safeParse({...base,images:[newImage,newImage]}).success,false);
 assert.equal(productSchema.safeParse({...base,images:Array.from({length:31},()=>({...newImage,isPrimary:false}))}).success,false);
});
test('drafts may omit price, gallery and required values but retain the canonical identifying fields',()=>{
 const draft=productSchema.parse(base);
 assert.equal(draft.active,false);assert.equal(draft.price,null);assert.equal(draft.brandId,null);assert.deepEqual(draft.images,[]);assert.deepEqual(draft.attributeValues,[]);
 assert.equal(productSchema.parse({...base,price:'20',compareAtPrice:'30'}).onSale,false);
 assert.equal(productSchema.parse({...base,price:'20',showPrice:false,featured:true,newArrival:true}).availability,'CHECK_AVAILABILITY');
});
test('product list accepts publication sort and false visibility filter with bounded pages',()=>{
 const q=querySchema.parse({showPrice:'false',sort:'publishedAt',order:'desc',pageSize:'100'});
 assert.equal(q.showPrice,false);assert.equal(q.sort,'publishedAt');assert.equal(q.pageSize,100);
 for(const input of [{sort:'fullDescription'},{pageSize:101},{showPrice:'0'}])assert.equal(querySchema.safeParse(input).success,false);
});
test('product mutation notifications classify transitions and never include internal prices',async()=>{
 const events:ProductMutationEvent[]=[],row={id:randomUUID(),slug:'new',categoryId:randomUUID(),active:true,updatedAt:new Date()};
 const hook=(event:ProductMutationEvent)=>{events.push(event);};
 await notifyProductMutation(hook,row);
 await notifyProductMutation(hook,row,{slug:'old',categoryId:row.categoryId,active:true});
 await notifyProductMutation(hook,{...row,active:false},row);
 assert.deepEqual(events.map(e=>e.type),['ProductPublished','ProductUpdated','ProductUnpublished']);
 assert.equal(events[1]?.previousSlug,'old');assert.equal('price' in events[0]!,false);
});
test('notification failure is isolated and logs no consumer error secrets',async()=>{
 const output:string[]=[],previous=console.error;console.error=(value:unknown)=>{output.push(String(value));};
 try{await notifyProductMutation(()=>{throw new Error('private-credential');},{id:randomUUID(),slug:'test',categoryId:randomUUID(),active:false,updatedAt:new Date()});}
 finally{console.error=previous;}
 assert.equal(output.length,1);assert.equal(output[0]?.includes('private-credential'),false);
});
test('POST PATCH DELETE product routes require authentication and CSRF header',async()=>{
 const app=createApp({corsOrigins:[]}),id=randomUUID();
 await request(app).post('/api/v1/admin/products').set('X-BCM-Admin','1').send(base).expect(401);
 await request(app).patch('/api/v1/admin/products/'+id).set('X-BCM-Admin','1').send({active:true}).expect(401);
 await request(app).delete('/api/v1/admin/products/'+id).set('X-BCM-Admin','1').expect(401);
 await request(app).post('/api/v1/admin/products').send(base).expect(403);
});

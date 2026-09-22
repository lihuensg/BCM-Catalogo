import assert from 'node:assert/strict';
import {test} from 'node:test';
import request from 'supertest';
import {randomBytes} from 'node:crypto';
import {createApp} from '../src/app.js';
import {sessionCookie} from '../src/modules/auth/cookie.js';
import {hashPassword,verifyPassword} from '../src/modules/auth/password.js';
import {patchSchema as categoryPatch} from '../src/modules/categories/admin-schema.js';
import {patchSchema as brandPatch} from '../src/modules/brands/admin-schema.js';
import {optionPatch,associationPatch} from '../src/modules/attributes/admin-schema.js';
import {patchSchema as bannerPatch} from '../src/modules/banners/admin-schema.js';
import {createAuthService} from '../src/modules/auth/service.js';
const origin='http://localhost:3000';
test('all admin prefixes and me reject absent, malformed and duplicate session cookies',async()=>{
 const app=createApp({corsOrigins:[origin]});
 for(const path of ['categories','brands','attributes','banners','settings','products','unknown']){
  const r=await request(app).get('/api/v1/admin/'+path).expect(401);assert.equal(r.body.error.code,'AUTH_REQUIRED');
 }
 await request(app).get('/api/v1/auth/me').set('Cookie','bcm_session=invalid').expect(401);
 const token=randomBytes(32).toString('base64url');
 await request(app).get('/api/v1/auth/me').set('Cookie','bcm_session='+token+'; bcm_session='+token).expect(401);
 await request(app).post('/api/v1/admin/categories').set('X-BCM-Admin','1').send({}).expect(401);
});
test('CSRF guard rejects simple requests and untrusted origins; credentialed CORS preflight is explicit',async()=>{
 const app=createApp({corsOrigins:[origin]});
 await request(app).post('/api/v1/auth/login').send({}).expect(403);
 await request(app).post('/api/v1/auth/logout').set('X-BCM-Admin','1').set('Origin','https://evil.example').expect(403);
 const r=await request(app).options('/api/v1/auth/login').set('Origin',origin).set('Access-Control-Request-Method','POST').set('Access-Control-Request-Headers','X-BCM-Admin').expect(204);
 assert.equal(r.headers['access-control-allow-credentials'],'true');
 assert.equal(r.headers['access-control-allow-origin'],origin);
 assert.match(r.headers['access-control-allow-headers'] ?? '',/X-BCM-Admin/);
});
test('login limit returns the standard 429 envelope and retry headers without touching DB',async()=>{
 const app=createApp({corsOrigins:[origin]});
 for(let i=0;i<10;i++)await request(app).post('/api/v1/auth/login').set('X-BCM-Admin','1').send({email:'bad',password:'secret'}).expect(400);
 const r=await request(app).post('/api/v1/auth/login').set('X-BCM-Admin','1').send({}).expect(429);
 assert.equal(r.body.error.code,'RATE_LIMITED');assert.ok(r.headers['retry-after']);
 assert.equal(JSON.stringify(r.body).includes('secret'),false);
});
test('production cookies are host-only, HttpOnly, Secure, SameSite Lax with finite expiration',()=>{
 const cookie=sessionCookie(true,28800);
 assert.equal(cookie.name,'__Host-bcm_session');
 assert.deepEqual(cookie.options,{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:28800000});
 assert.equal(sessionCookie(false,28800).options.secure,false);
});
test('Argon2id hashes with fresh salts and verifies without reversible password storage',async()=>{
 const password=randomBytes(24).toString('base64url'),a=await hashPassword(password),b=await hashPassword(password);
 assert.match(a,/^\$argon2id\$/);assert.notEqual(a,b);assert.equal(a.includes(password),false);
 assert.equal(await verifyPassword(a,password),true);assert.equal(await verifyPassword(a,'incorrect'),false);
 assert.equal(await verifyPassword(undefined,password),false);
});
test('PATCH omits create defaults, rejects empty/unknown fields and keeps explicit false/zero/null',()=>{
 assert.deepEqual(categoryPatch.parse({name:'Edited'}),{name:'Edited'});
 assert.deepEqual(brandPatch.parse({name:'Edited'}),{name:'Edited'});
 assert.deepEqual(optionPatch.parse({label:'Edited'}),{label:'Edited'});
 assert.deepEqual(associationPatch.parse({required:false}),{required:false});
 assert.deepEqual(bannerPatch.parse({title:'Edited'}),{title:'Edited'});
 assert.deepEqual(categoryPatch.parse({active:false,sortOrder:0,parentId:null}),{active:false,sortOrder:0,parentId:null});
 assert.throws(()=>categoryPatch.parse({}));assert.throws(()=>categoryPatch.parse({passwordHash:'secret'}));
});
test('invalid session tokens are rejected before repository access',async()=>{
 const auth=createAuthService(()=>{throw new Error('Repository must not be reached');},28800);
 for(const token of [undefined,'','invalid','a'.repeat(10000)])await assert.rejects(auth.identity(token),{code:'AUTH_REQUIRED'});
});

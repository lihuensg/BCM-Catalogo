import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { parseEnvironment } from '../src/config/env.js';
import { adminResourceInvalidationTags } from '../src/shared/public-cache.js';

const origin = 'http://localhost:3000';
const app = createApp({ corsOrigins: [origin] });

test('health returns the public liveness contract without database or environment details', async () => {
  const response = await request(app).get('/api/v1/health').expect(200);
  assert.deepEqual(response.body, { data: { status: 'ok' }, meta: {} });
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['x-powered-by'], undefined);
});

test('only allowlisted origins receive CORS permission', async () => {
  const allowed = await request(app).get('/api/v1/health').set('Origin', origin);
  assert.equal(allowed.headers['access-control-allow-origin'], origin);
  const denied = await request(app).get('/api/v1/health').set('Origin', 'https://untrusted.example');
  assert.equal(denied.headers['access-control-allow-origin'], undefined);
});

test('unimplemented public endpoints remain unavailable', async () => {
  for (const path of ['/api/v1/products', '/api/v1/auth/login']) {
    const response = await request(app).get(path).expect(404);
    assert.deepEqual(response.body, { error: { code: 'NOT_FOUND', message: 'Recurso no encontrado', details: {} } });
  }
});

test('malformed JSON and oversized payloads return sanitized errors', async () => {
  const malformed = await request(app).post('/api/v1/health').set('Content-Type', 'application/json').send('{secret').expect(400);
  assert.equal(malformed.body.error.code, 'INVALID_JSON');
  assert.equal(JSON.stringify(malformed.body).includes('secret'), false);
  const oversized = await request(app).post('/api/v1/health').send({ value: 'x'.repeat(110_000) }).expect(413);
  assert.equal(oversized.body.error.code, 'PAYLOAD_TOO_LARGE');
});

test('environment rejects invalid ports and CORS origins without exposing values', () => {
  assert.throws(() => parseEnvironment({ PORT: '0' }), /PORT/);
  assert.throws(() => parseEnvironment({ CORS_ORIGINS: '*' }), /CORS_ORIGINS/);
  assert.throws(() => parseEnvironment({ CORS_ORIGINS: `${origin}/path` }), /CORS_ORIGINS/);
  assert.deepEqual(parseEnvironment({}).CORS_ORIGINS, []);
  assert.equal(parseEnvironment({}).TRUST_PROXY_HOPS, 0);
  assert.equal(parseEnvironment({ TRUST_PROXY_HOPS: '1' }).TRUST_PROXY_HOPS, 1);
  assert.throws(() => parseEnvironment({ TRUST_PROXY_HOPS: '3' }), /TRUST_PROXY_HOPS/);
  assert.equal(createApp({ corsOrigins: [], trustProxyHops: 1 }).get('trust proxy'), 1);
  assert.throws(() => parseEnvironment({ PUBLIC_REVALIDATE_URL: 'https://catalogo.example/api/revalidate' }), /REVALIDATION_SECRET/);
  assert.throws(() => parseEnvironment({ REVALIDATION_SECRET: 'x'.repeat(32) }), /REVALIDATION_SECRET/);
  const revalidation = parseEnvironment({ PUBLIC_REVALIDATE_URL: 'https://catalogo.example/api/revalidate', REVALIDATION_SECRET: 'x'.repeat(32) });
  assert.equal(revalidation.PUBLIC_REVALIDATE_URL, 'https://catalogo.example/api/revalidate');
});


test('admin public cache invalidation covers every storefront data family', () => {
  assert.deepEqual(adminResourceInvalidationTags('categories'), ['public-categories', 'public-products', 'public-home']);
  assert.deepEqual(adminResourceInvalidationTags('brands'), ['public-brands', 'public-products', 'public-home']);
  assert.deepEqual(adminResourceInvalidationTags('attributes'), ['public-products']);
  assert.deepEqual(adminResourceInvalidationTags('banners'), ['public-banners', 'public-home', 'public-products']);
  assert.deepEqual(adminResourceInvalidationTags('settings'), ['public-settings', 'public-home']);
  assert.deepEqual(adminResourceInvalidationTags('unknown'), []);
});

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { blankProduct, productErrors, replaceAttribute, priceLabel, productQuery } from '../features/products/model';
import { settingsErrors, placeholders } from '../features/settings/model';
import { masterErrors, formPayload } from '../features/masters/form-model';
import { ApiFailure, errorMessage } from '../services/admin/errors';
import { queryString, request } from '../services/admin/client';
import { catalogQuery, formatAmount, publicPrice, whatsappUrl } from '../features/catalog/model';
import type { PublicProductListDto, PublicSettingsDto } from '@bcm/shared';
test('product form validates minimums without preventing incomplete drafts', () => { const value = { ...blankProduct(), name: 'Producto', slug: 'producto', shortDescription: 'Descripción', categoryId: 'category' }; assert.deepEqual(productErrors(value), {}); assert.ok(productErrors({ ...value, slug: 'BAD SLUG' }).slug); assert.equal(value.active, false); });
test('price validation remains exact for large decimals and hidden internal prices', () => { const value = { ...blankProduct(), price: '9999999999999999.98', compareAtPrice: '9999999999999999.99', showPrice: false }; assert.equal(productErrors(value).compareAtPrice, undefined); assert.ok(productErrors({ ...value, compareAtPrice: value.price }).compareAtPrice); assert.ok(productErrors({ ...value, price: '-1' }).price); assert.equal(priceLabel('1234567890123456.78', false), '1.234.567.890.123.456,78 · Interno'); assert.equal(priceLabel(null, true), 'Sin precio'); });
test('dynamic attributes preserve explicit false and replace without duplicate ids', () => { const result = replaceAttribute([{ attributeId: 'a', dataType: 'BOOLEAN', booleanValue: true }], 'a', { attributeId: 'a', dataType: 'BOOLEAN', booleanValue: false }); assert.deepEqual(result, [{ attributeId: 'a', dataType: 'BOOLEAN', booleanValue: false }]); assert.deepEqual(replaceAttribute(result, 'a', null), []); });
test('product filters retain false values and ignore unsupported query keys', () => { const q = productQuery(new URLSearchParams('showPrice=false&active=false&page=2&pageSize=100&admin=true')); assert.equal(q.get('showPrice'), 'false'); assert.equal(q.get('page'), '2'); assert.equal(q.has('admin'), false); assert.equal(queryString({ active: false, page: 2, search: '' }), 'active=false&page=2'); });
test('API errors use safe actionable Spanish messages', () => { assert.match(errorMessage(new ApiFailure('PRODUCT_SLUG_EXISTS', 409)), /slug/); assert.match(errorMessage(new ApiFailure('PRODUCT_SKU_EXISTS', 409)), /SKU/); assert.equal(errorMessage(new Error('private SQL password')), 'No pudimos completar la operación. Intentá nuevamente.'); assert.match(errorMessage(new ApiFailure('AUTH_INVALID_CREDENTIALS', 401)), /email o la contraseña/); });
test('settings allow only documented placeholders and require paired contact settings', () => { assert.deepEqual(placeholders, ['productName', 'productUrl', 'sku', 'price']); assert.deepEqual(settingsErrors({ whatsappNumber: '5491112345678', whatsappMessageTemplate: 'Hola {{productName}} {{productUrl}} {{sku}} {{price}}' }), {}); assert.ok(settingsErrors({ whatsappNumber: '5491112345678' }).whatsappNumber); assert.ok(settingsErrors({ whatsappMessageTemplate: '{{secret}}' }).whatsappMessageTemplate); assert.ok(settingsErrors({ instagramUrl: 'https://other.example' }).instagramUrl); });
test('master form payload excludes readonly fields and preserves false zero and null', () => { assert.deepEqual(formPayload([{ key: 'active', label: 'Activo' }, { key: 'sortOrder', label: 'Orden' }, { key: 'description', label: 'Descripción' }], { active: false, sortOrder: 0, description: ' ', id: 'private' }), { active: false, sortOrder: 0, description: null }); assert.ok(masterErrors({ ctaText: 'Ver', ctaHref: null }).ctaHref); assert.ok(masterErrors({ startsAt: '2026-10-01', endsAt: '2026-09-01' }).endsAt); });
test('HTTP client sends cookie credentials, CSRF and preserves caller abort signal', async () => { const original = globalThis.fetch; const controller = new AbortController(); let called = false; try {
    globalThis.fetch = async (url, options) => { called = true; assert.equal(url, '/api/admin-proxy/auth/login'); assert.equal(options?.credentials, 'include'); assert.equal(options?.signal, controller.signal); assert.equal(new Headers(options?.headers).get('X-BCM-Admin'), '1'); return Response.json({ data: { name: 'Admin' }, meta: {} }); };
    await request('/auth/login', { method: 'POST', body: { email: 'test@example.test', password: 'test' }, signal: controller.signal });
    assert.equal(called, true);
}
finally {
    globalThis.fetch = original;
} });
test('HTTP client normalizes network and credential errors without leaking response internals', async () => { const original = globalThis.fetch; try {
    globalThis.fetch = async () => Response.json({ error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'internal', details: {} } }, { status: 401 });
    await assert.rejects(request('/auth/login'), e => e instanceof ApiFailure && e.code === 'AUTH_INVALID_CREDENTIALS' && !e.message.includes('internal'));
    globalThis.fetch = async () => { throw new Error('secret host'); };
    await assert.rejects(request('/auth/login'), e => e instanceof ApiFailure && e.code === 'NETWORK_ERROR');
}
finally {
    globalThis.fetch = original;
} });

import {permittedProxyPath,permittedMutation,boundedBody} from '../services/admin/proxy-policy';
test('proxy rejects traversal, arbitrary origins and missing CSRF before forwarding',()=>{assert.equal(permittedProxyPath(['admin','products']),true);assert.equal(permittedProxyPath(['https:','private']),false);assert.equal(permittedProxyPath(['admin','..']),false);assert.equal(permittedMutation('https://evil.example','http://localhost:3000','1'),false);assert.equal(permittedMutation(null,'http://localhost:3000','1'),false);assert.equal(permittedMutation('http://localhost:3000','http://localhost:3000',null),false);});
test('proxy bounds streamed bodies even without Content-Length',async()=>{await assert.rejects(boundedBody(new Request('http://localhost',{method:'POST',body:'abcdef'}),4),RangeError);assert.equal(await boundedBody(new Request('http://localhost',{method:'POST',body:'{}'}),4),'{}');});


test('public money formatting and hidden prices never leak the internal amount', () => {
  assert.equal(formatAmount('1234567.80'), '1.234.567,80');
  const product = { showPrice: false, price: '999999.99' } as PublicProductListDto;
  assert.equal(publicPrice(product), null);
});

test('public WhatsApp template uses only public product values and hides price when configured', () => {
  const settings = {
    whatsappNumber: '+54 9 11 1234-5678',
    whatsappMessageTemplate: 'Hola {{productName}} {{productUrl}} {{sku}} {{price}}',
  } as PublicSettingsDto;
  const product = { name: 'Producto', slug: 'producto', sku: 'ABC', showPrice: false, price: '100.00' } as PublicProductListDto & { sku: string };
  const url = whatsappUrl(settings, product, 'https://bcm.example');
  assert.ok(url?.startsWith('https://wa.me/5491112345678?text='));
  assert.equal(decodeURIComponent(url ?? '').includes('100,00'), false);
  assert.match(decodeURIComponent(url ?? ''), /Producto/);
});

test('public catalog query ignores unknown input and normalizes invalid pagination and sorting', () => {
  const query = catalogQuery({ page: '-9', search: '  iphone  ', sort: 'privateField', category: 'celulares', unknown: 'secret' });
  assert.equal(query.page, 1);
  assert.equal(query.search, 'iphone');
  assert.equal(query.sort, 'sortOrder');
  assert.equal(query.category, 'celulares');
  assert.equal('unknown' in query, false);
});

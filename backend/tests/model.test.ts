import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Prisma } from '../src/generated/prisma/client.js';
import { requireDatabaseUrl } from '../src/config/database.js';
import { moneySchema, numericAttributeSchema } from '../src/shared/model-validation.js';
import { productSchema } from '../src/modules/products/schema.js';
import { validateProductAttributes, validatePublication, type AttributeRequirement } from '../src/modules/products/rules.js';
import { validateCategoryParent } from '../src/modules/categories/rules.js';
import { attributeValueSchema } from '../src/modules/attributes/schema.js';
import { bannerSchema } from '../src/modules/banners/schema.js';
import { siteSettingsSchema, whatsappTemplateSchema } from '../src/modules/settings/schema.js';
import { adminUserSchema } from '../src/modules/auth/schema.js';
import { structuralSeedSchema } from '../src/infrastructure/prisma/seed-schema.js';
import { catalogSeedSchema } from '../src/infrastructure/prisma/catalog-seed-schema.js';
import { readFile } from 'node:fs/promises';
import { publicBannersQuery, publicProductsQuery } from '../src/modules/catalog/schema.js';
import { publicProductDto } from '../src/modules/catalog/mapper.js';
import type { PublicProductRow } from '../src/modules/catalog/repository.js';

const categoryId = randomUUID();
const attributeId = randomUUID();
const baseProduct = { name: 'Producto', slug: 'producto', shortDescription: 'Descripcion', categoryId };

test('money is Decimal, exact, and accepts zero and maximum precision', () => {
  const value = moneySchema.parse('1234567890123456.78');
  assert.ok(value instanceof Prisma.Decimal);
  assert.equal(value.toFixed(2), '1234567890123456.78');
  assert.equal(moneySchema.parse('0.10').plus(moneySchema.parse('0.20')).toFixed(2), '0.30');
  assert.equal(moneySchema.parse('0').toString(), '0');
});
for (const value of [0.1, -1, '-1.00', '1.001', '1e3', 'NaN', 'Infinity', '10000000000000000', '', ' 5']) {
  test('rejects invalid money input ' + JSON.stringify(value), () => {
    assert.equal(moneySchema.safeParse(value).success, false);
  });
}
test('numeric attributes support signed decimals without silently rounding', () => {
  assert.equal(numericAttributeSchema.parse('-12.123456').toString(), '-12.123456');
  assert.equal(numericAttributeSchema.safeParse('1.1234567').success, false);
});
test('category is required, brand optional and price may be unknown or internal', () => {
  assert.equal(productSchema.safeParse({ ...baseProduct, categoryId: undefined }).success, false);
  const unknown = productSchema.parse(baseProduct);
  assert.equal(unknown.price, null);
  assert.equal(unknown.brandId, null);
  const hidden = productSchema.parse({ ...baseProduct, price: '500000', showPrice: false });
  assert.equal(hidden.price?.toString(), '500000');
  assert.equal(hidden.showPrice, false);
  assert.equal(productSchema.parse({ ...baseProduct, showPrice: true }).price, null);
});
test('compare-at must exceed current price and cannot exist alone', () => {
  for (const compareAtPrice of ['99', '100']) assert.equal(productSchema.safeParse({ ...baseProduct, price: '100', compareAtPrice }).success, false);
  assert.equal(productSchema.safeParse({ ...baseProduct, compareAtPrice: '200' }).success, false);
  assert.equal(productSchema.parse({ ...baseProduct, price: '100', compareAtPrice: '200', onSale: true }).onSale, true);
  assert.equal(productSchema.parse({ ...baseProduct, onSale: true }).price, null);
});
test('sale mode and availability remain distinct but coherent', () => {
  assert.equal(productSchema.safeParse({ ...baseProduct, saleMode: 'IN_STOCK', availability: 'MADE_TO_ORDER' }).success, false);
  assert.equal(productSchema.safeParse({ ...baseProduct, saleMode: 'MADE_TO_ORDER', availability: 'AVAILABLE' }).success, false);
  for (const availability of ['MADE_TO_ORDER', 'CHECK_AVAILABILITY', 'OUT_OF_STOCK']) {
    assert.equal(productSchema.safeParse({ ...baseProduct, saleMode: 'MADE_TO_ORDER', availability }).success, true);
  }
});
test('generic product rejects technology columns and caller-managed timestamps', () => {
  for (const field of ['ram', 'camera', 'perfumeSize', 'createdAt', 'publishedAt']) {
    assert.equal(productSchema.safeParse({ ...baseProduct, [field]: 'unexpected' }).success, false);
  }
});
test('slugs, SKU, image count and primary image multiplicity are validated', () => {
  assert.equal(productSchema.safeParse({ ...baseProduct, slug: 'Invalid Slug' }).success, false);
  assert.equal(productSchema.safeParse({ ...baseProduct, sku: ' ' }).success, false);
  assert.equal(productSchema.parse({ ...baseProduct, sku: ' ABC ' }).sku, 'ABC');
  const image = { url: 'https://assets.example/image.jpg', altText: 'Producto', isPrimary: true };
  assert.equal(productSchema.safeParse({ ...baseProduct, images: [image, image] }).success, false);
  assert.equal(productSchema.safeParse({ ...baseProduct, images: [{ ...image, altText: '' }] }).success, false);
});
test('typed attributes accept false/zero and reject empty, multiple or wrong slots', () => {
  assert.equal(attributeValueSchema.parse({ attributeId, dataType: 'BOOLEAN', booleanValue: false }).dataType, 'BOOLEAN');
  assert.equal(attributeValueSchema.parse({ attributeId, dataType: 'NUMBER', numberValue: '0' }).dataType, 'NUMBER');
  for (const value of [
    { attributeId, dataType: 'TEXT', textValue: '' },
    { attributeId, dataType: 'TEXT', booleanValue: true },
    { attributeId, dataType: 'TEXT', textValue: 'value', numberValue: '1' }
  ]) assert.equal(attributeValueSchema.safeParse(value).success, false);
});
const textRequirement: AttributeRequirement = { attributeId, required: true, attribute: { dataType: 'TEXT', active: true, options: [] } };
test('required attributes apply when publishing, not to incomplete drafts', () => {
  assert.doesNotThrow(() => validateProductAttributes([], [textRequirement], false));
  assert.throws(() => validateProductAttributes([], [textRequirement], true), { code: 'REQUIRED_ATTRIBUTE_MISSING' });
  assert.doesNotThrow(() => validateProductAttributes([{ attributeId, dataType: 'TEXT', textValue: 'Value' }], [textRequirement], true));
});
test('attributes require correct category, type, active state and unique identity', () => {
  const value = { attributeId, dataType: 'TEXT' as const, textValue: 'Value' };
  assert.throws(() => validateProductAttributes([value], [], false), { code: 'ATTRIBUTE_NOT_ASSIGNED' });
  assert.throws(() => validateProductAttributes([{ attributeId, dataType: 'BOOLEAN', booleanValue: false }], [textRequirement], false), { code: 'ATTRIBUTE_TYPE_MISMATCH' });
  assert.throws(() => validateProductAttributes([value, value], [textRequirement], false), { code: 'DUPLICATE_ATTRIBUTE' });
  assert.throws(() => validateProductAttributes([value], [{ ...textRequirement, attribute: { ...textRequirement.attribute, active: false } }], false), { code: 'ATTRIBUTE_INACTIVE' });
});
test('option must belong to its definition', () => {
  const optionId = randomUUID();
  const requirement: AttributeRequirement = { attributeId, required: false, attribute: { dataType: 'OPTION', active: true, options: [{ id: optionId }] } };
  assert.doesNotThrow(() => validateProductAttributes([{ attributeId, dataType: 'OPTION', optionId }], [requirement], false));
  assert.throws(() => validateProductAttributes([{ attributeId, dataType: 'OPTION', optionId: randomUUID() }], [requirement], false), { code: 'INVALID_ATTRIBUTE_OPTION' });
});
test('publishing requires an active category', () => {
  assert.throws(() => validatePublication(null), { code: 'CATEGORY_INACTIVE' });
  assert.throws(() => validatePublication({ active: false }), { code: 'CATEGORY_INACTIVE' });
  assert.doesNotThrow(() => validatePublication({ active: true }));
});
test('category hierarchy rejects direct, indirect and pre-existing cycles', () => {
  const tree = [{ id: 'a', parentId: null }, { id: 'b', parentId: 'a' }, { id: 'c', parentId: 'b' }];
  for (const parentId of ['a', 'b', 'c']) assert.throws(() => validateCategoryParent('a', parentId, tree), { code: 'CATEGORY_CYCLE' });
  assert.throws(() => validateCategoryParent('a', 'missing', tree), { code: 'CATEGORY_NOT_FOUND' });
  assert.throws(() => validateCategoryParent('x', 'a', [{ id: 'a', parentId: 'b' }, { id: 'b', parentId: 'a' }]), { code: 'CATEGORY_CYCLE' });
  assert.doesNotThrow(() => validateCategoryParent('c', 'a', tree));
  assert.doesNotThrow(() => validateCategoryParent('a', null, tree));
});
test('banners validate period, CTA pair and safe link protocols', () => {
  const banner = { imageUrl: 'https://assets.example/banner.jpg', placement: 'HOME_HERO' };
  assert.equal(bannerSchema.safeParse(banner).success, true);
  assert.equal(bannerSchema.safeParse({ ...banner, startsAt: new Date(2), endsAt: new Date(1) }).success, false);
  assert.equal(bannerSchema.safeParse({ ...banner, ctaText: 'Ver' }).success, false);
  for (const ctaHref of ['javascript:alert(1)', '//external.example', '/\\external.example']) {
    assert.equal(bannerSchema.safeParse({ ...banner, ctaText: 'Ver', ctaHref }).success, false);
  }
  assert.equal(bannerSchema.safeParse({ ...banner, ctaText: 'Ver', ctaHref: '/catalogo' }).success, true);
});
test('settings can omit social channels and whitelist WhatsApp placeholders', () => {
  const settings = { siteName: 'Test', defaultSeoTitle: 'Test', defaultSeoDescription: 'Description' };
  assert.equal(siteSettingsSchema.parse(settings).whatsappNumber, null);
  assert.equal(siteSettingsSchema.safeParse({ ...settings, whatsappNumber: '1234567' }).success, false);
  assert.equal(whatsappTemplateSchema.safeParse('Hola {{productName}} {{productUrl}} {{sku}} {{price}}').success, true);
  for (const template of ['Hola {{password}}', 'Hola {{productName}', '{{}}']) assert.equal(whatsappTemplateSchema.safeParse(template).success, false);
  for (const instagramUrl of ['https://instagram.com.evil.example', 'invalid', 'javascript:alert(1)']) {
    assert.equal(siteSettingsSchema.safeParse({ ...settings, instagramUrl }).success, false);
  }
});
test('admin normalizes email and rejects plaintext passwords', () => {
  assert.equal(adminUserSchema.safeParse({ name: 'Admin', email: 'ADMIN@example.test', passwordHash: 'plaintext' }).success, false);
  const hash = '$argon2id$v=19$m=65536,t=3,p=1$testfixturesalt$testfixturehashvalue';
  assert.equal(adminUserSchema.parse({ name: 'Admin', email: 'ADMIN@example.test', passwordHash: hash }).email, 'admin@example.test');
});
test('seed is structural only and rejects duplicate slugs', () => {
  assert.deepEqual(structuralSeedSchema.parse({}), { categories: [], brands: [] });
  assert.equal(structuralSeedSchema.safeParse({ products: [] }).success, false);
  const category = { name: 'Test', slug: 'test' };
  assert.equal(structuralSeedSchema.safeParse({ categories: [category, category] }).success, false);
});
test('media URLs require HTTPS except explicit local development hosts', () => {
  for (const value of ['https://assets.example/image.jpg', 'http://localhost:3100/logo.jpg', 'http://127.0.0.1:3100/logo.jpg']) {
    assert.equal(productSchema.safeParse({ ...baseProduct, images: [{ url: value, altText: 'Producto', isPrimary: true }] }).success, true);
  }
  for (const value of ['http://example.com/image.jpg', 'http://192.168.1.10/image.jpg', 'https://user:secret@example.com/image.jpg']) {
    assert.equal(productSchema.safeParse({ ...baseProduct, images: [{ url: value, altText: 'Producto', isPrimary: true }] }).success, false);
  }
});
test('database URL errors never contain credentials', () => {
  assert.throws(() => requireDatabaseUrl(undefined), /DATABASE_URL/);
  assert.throws(() => requireDatabaseUrl('https://user:secret@example.test/db'), (error: unknown) => error instanceof Error && !error.message.includes('secret'));
});


test('public catalog query validates filters, price range and maximum page size', () => {
  const parsed = publicProductsQuery.parse({ page: '2', pageSize: '60', onSale: 'true', minPrice: '10.00', maxPrice: '20.00' });
  assert.equal(parsed.page, 2);
  assert.equal(parsed.pageSize, 60);
  assert.equal(parsed.onSale, true);
  assert.equal(parsed.minPrice?.toFixed(2), '10.00');
  assert.equal(publicProductsQuery.safeParse({ pageSize: '61' }).success, false);
  assert.equal(publicProductsQuery.safeParse({ minPrice: '20', maxPrice: '10' }).success, false);
  assert.equal(publicProductsQuery.safeParse({ sort: 'passwordHash' }).success, false);
});

test('public product mapper never exposes hidden price values', () => {
  const row = {
    id: randomUUID(),
    name: 'Producto privado',
    slug: 'producto-privado',
    shortDescription: 'Descripción',
    price: new Prisma.Decimal('999999.99'),
    compareAtPrice: new Prisma.Decimal('1200000.00'),
    showPrice: false,
    saleMode: 'IN_STOCK',
    availability: 'AVAILABLE',
    featured: false,
    onSale: true,
    newArrival: false,
    publishedAt: new Date('2026-09-20T12:00:00Z'),
    category: { id: randomUUID(), name: 'Categoría', slug: 'categoria' },
    brand: null,
    images: []
  } as PublicProductRow;
  const dto = publicProductDto(row);
  assert.equal(dto.price, null);
  assert.equal(dto.compareAtPrice, null);
  assert.equal(dto.showPrice, false);
});


test('public banner query accepts only known placements', () => {
  assert.equal(publicBannersQuery.parse({ placement: 'CATALOG_TOP' }).placement, 'CATALOG_TOP');
  assert.equal(publicBannersQuery.safeParse({ placement: 'PRIVATE' }).success, false);
  assert.equal(publicBannersQuery.safeParse({ placement: 'CATALOG_TOP', extra: 'x' }).success, false);
});


test('committed demo catalog seed is valid, diverse and contains exactly 20 products', async () => {
  const raw = JSON.parse(await readFile(new URL('../prisma/catalog.seed.json', import.meta.url), 'utf8')) as unknown;
  const seed = catalogSeedSchema.parse(raw);
  assert.equal(seed.products.length, 20);
  assert.ok(seed.categories.length >= 6);
  assert.ok(seed.brands.length >= 8);
  assert.ok(seed.attributes.length >= 6);
  assert.equal(new Set(seed.products.map(product => product.slug)).size, seed.products.length);
  assert.ok(seed.products.some(product => product.showPrice === false));
  assert.ok(seed.products.some(product => product.onSale));
  assert.ok(seed.products.some(product => product.featured));
  assert.ok(seed.products.some(product => product.newArrival));
  assert.ok(seed.products.every(product => product.attributeValues.length >= 1));
});

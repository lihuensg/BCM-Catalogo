import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { createPrismaClient } from '../../src/infrastructure/prisma/client.js';
import { requireDatabaseUrl } from '../../src/config/database.js';
import { createUnitOfWork } from '../../src/infrastructure/prisma/unit-of-work.js';
import { createCategoryService } from '../../src/modules/categories/service.js';
import { createBrandService } from '../../src/modules/brands/service.js';
import { createAttributeService } from '../../src/modules/attributes/service.js';
import { productRepository } from '../../src/modules/products/repository.js';
import { createProductService } from '../../src/modules/products/service.js';
import { seedStructure } from '../../src/infrastructure/prisma/seed.js';
import { seedCatalog } from '../../src/infrastructure/prisma/catalog-seed.js';
import { catalogService } from '../../src/modules/catalog/service.js';
import { Prisma } from '../../src/generated/prisma/client.js';

const client = createPrismaClient(requireDatabaseUrl(process.env.TEST_DATABASE_URL, 'TEST_DATABASE_URL'));
const transaction = createUnitOfWork(client);
const categories = createCategoryService(transaction);
const brands = createBrandService(transaction);
const attributes = createAttributeService(transaction);
const products = createProductService(transaction);
const prefix = 'it-' + randomUUID();
const slug = (name: string) => prefix + '-' + name;
const ownedSettings: string[] = [];
before(async () => {
  await client.$connect();
  await client.product.count(); // Fail if migrations are absent, never silently skip.
});
after(async () => {
  try {
    await client.product.deleteMany({ where: { slug: { startsWith: prefix } } });
    await client.categoryAttribute.deleteMany({ where: { category: { slug: { startsWith: prefix } } } });
    await client.attributeOption.deleteMany({ where: { attribute: { slug: { startsWith: prefix } } } });
    await client.attributeDefinition.deleteMany({ where: { slug: { startsWith: prefix } } });
    await client.category.updateMany({ where: { slug: { startsWith: prefix } }, data: { parentId: null } });
    await client.category.deleteMany({ where: { slug: { startsWith: prefix } } });
    await client.brand.deleteMany({ where: { slug: { startsWith: prefix } } });
    await client.siteSettings.deleteMany({ where: { id: { in: ownedSettings } } });
    await client.banner.deleteMany({ where: { title: prefix } });
    await client.adminUser.deleteMany({ where: { email: prefix + '@example.test' } });
  } finally {
    await client.$disconnect();
  }
});

function productData(categoryId: string, suffix: string) {
  return { name: 'Integration product', slug: slug(suffix), shortDescription: 'Fixture', categoryId };
}
function isUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
function isForeignKeyError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003';
}

test('repository/service creates generic product with Decimal, relations, images and all attribute types', async () => {
  const category = await categories.create({ name: 'Category', slug: slug('generic'), active: true });
  const brand = await brands.create({ name: 'Brand', slug: slug('brand'), active: true });
  const text = await attributes.create({ name: 'Family', slug: slug('text'), dataType: 'TEXT', active: true });
  const number = await attributes.create({ name: 'Volume', slug: slug('number'), dataType: 'NUMBER', active: true });
  const boolean = await attributes.create({ name: 'Refillable', slug: slug('boolean'), dataType: 'BOOLEAN', active: true });
  const option = await attributes.create({ name: 'Type', slug: slug('option'), dataType: 'OPTION', active: true });
  for (const attribute of [text, number, boolean, option]) await attributes.associateCategory({ categoryId: category.id, attributeId: attribute.id, required: true });
  const choice = await attributes.createOption({ attributeId: option.id, label: 'Choice', value: 'choice' });
  const product = await products.create({
    ...productData(category.id, 'full'), brandId: brand.id, price: '1234567890123456.78', showPrice: false, active: true,
    images: [
      { url: 'https://assets.example/front.jpg', altText: 'Front', isPrimary: true },
      { url: 'https://assets.example/back.jpg', altText: 'Back', sortOrder: 1 }
    ],
    attributeValues: [
      { attributeId: text.id, dataType: 'TEXT', textValue: 'Floral' },
      { attributeId: number.id, dataType: 'NUMBER', numberValue: '100.125' },
      { attributeId: boolean.id, dataType: 'BOOLEAN', booleanValue: false },
      { attributeId: option.id, dataType: 'OPTION', optionId: choice.id }
    ]
  });
  const found = await productRepository(client).find(product.id);
  assert.ok(found);
  assert.equal(found.category.id, category.id);
  assert.equal(found.brand?.id, brand.id);
  assert.equal(found.price?.toFixed(2), '1234567890123456.78');
  assert.equal(found.showPrice, false);
  assert.equal(found.attributeValues.length, 4);
  assert.equal(found.images.length, 2);
  assert.ok(found.createdAt instanceof Date && found.updatedAt instanceof Date && found.publishedAt instanceof Date);
  assert.equal(found.images[0]?.isPrimary, true);
  assert.equal(found.attributeValues.find((value) => value.attributeId === boolean.id)?.booleanValue, false);
  const secondImage = found.images[1];
  assert.ok(secondImage);
  await products.setPrimaryImage(found.id, secondImage.id);
  assert.equal((await productRepository(client).find(found.id))?.images.filter((image) => image.isPrimary).length, 1);
  const updated = await client.product.update({ where: { id: found.id }, data: { name: 'Updated' } });
  assert.ok(updated.updatedAt > found.updatedAt);
  await assert.rejects(attributes.associateCategory({ categoryId: category.id, attributeId: (await attributes.create({ name: 'New', slug: slug('new-required'), dataType: 'TEXT', active: true })).id, required: true }), { code: 'ACTIVE_PRODUCTS_EXIST' });
});

test('PostgreSQL enforces slug/SKU uniqueness, optional brand/price and required category', async () => {
  const category = await categories.create({ name: 'Category', slug: slug('unique') });
  const first = await products.create({ ...productData(category.id, 'unique'), sku: slug('sku') });
  assert.equal(first.price, null);
  assert.equal(first.brandId, null);
  await assert.rejects(products.create(productData(category.id, 'unique')), isUniqueError);
  await assert.rejects(products.create({ ...productData(category.id, 'unique2'), sku: slug('sku') }), isUniqueError);
  await products.create(productData(category.id, 'null-sku1'));
  await products.create(productData(category.id, 'null-sku2'));
  await assert.rejects(client.product.create({ data: productData(randomUUID(), 'invalid-category') }), isForeignKeyError);
  await assert.rejects(categories.create({ name: 'Duplicate', slug: category.slug }), isUniqueError);
});

test('database price constraints apply even when bypassing services', async () => {
  const category = await categories.create({ name: 'Category', slug: slug('prices') });
  for (const [index, price, compareAtPrice] of [
    [0, '-1', null], [1, '100', '100'], [2, '100', '90'], [3, null, '200'], [4, 'NaN', null]
  ] as const) {
    await assert.rejects(client.product.create({ data: { ...productData(category.id, 'bad-price' + index), price, compareAtPrice } }));
  }
  const product = await products.create({ ...productData(category.id, 'offer'), price: '450000', compareAtPrice: '500000', onSale: true });
  assert.equal(product.price?.toFixed(2), '450000.00');
  await assert.rejects(client.product.update({ where: { id: product.id }, data: { saleMode: 'MADE_TO_ORDER', availability: 'AVAILABLE' } }));
});

test('publication validates required attributes and category activity in a transaction', async () => {
  const category = await categories.create({ name: 'Category', slug: slug('publish'), active: true });
  const attribute = await attributes.create({ name: 'Required', slug: slug('required'), dataType: 'TEXT', active: true });
  await attributes.associateCategory({ categoryId: category.id, attributeId: attribute.id, required: true });
  const draft = await products.create(productData(category.id, 'draft'));
  await assert.rejects(products.publish(draft.id), { code: 'REQUIRED_ATTRIBUTE_MISSING' });
  await assert.rejects(products.create({ ...productData(category.id, 'invalid-published'), active: true }), { code: 'REQUIRED_ATTRIBUTE_MISSING' });
  assert.equal(await client.product.count({ where: { slug: slug('invalid-published') } }), 0);
  await client.productAttributeValue.create({ data: {
    productId: draft.id, categoryId: category.id, attributeId: attribute.id, dataType: 'TEXT', textValue: 'Complete'
  } });
  const published = await products.publish(draft.id);
  assert.equal(published.active, true);
  assert.ok(published.publishedAt);
  assert.equal((await products.publish(draft.id)).publishedAt?.getTime(), published.publishedAt.getTime());
  const inactive = await categories.create({ name: 'Inactive', slug: slug('inactive') });
  await assert.rejects(products.create({ ...productData(inactive.id, 'inactive'), active: true }), { code: 'CATEGORY_INACTIVE' });
});

test('composite foreign keys and CHECK enforce category, definition, option and typed slots', async () => {
  const category = await categories.create({ name: 'Category', slug: slug('integrity') });
  const otherCategory = await categories.create({ name: 'Other', slug: slug('integrity-other') });
  const attribute = await attributes.create({ name: 'Option', slug: slug('integrity-option'), dataType: 'OPTION', active: true });
  const otherAttribute = await attributes.create({ name: 'Other', slug: slug('integrity-other-option'), dataType: 'OPTION', active: true });
  const choice = await attributes.createOption({ attributeId: attribute.id, label: 'A', value: 'a' });
  const wrongChoice = await attributes.createOption({ attributeId: otherAttribute.id, label: 'B', value: 'b' });
  const product = await products.create(productData(category.id, 'integrity'));
  const value = { productId: product.id, categoryId: category.id, attributeId: attribute.id, dataType: 'OPTION' as const, optionId: choice.id };
  await assert.rejects(client.productAttributeValue.create({ data: value }), isForeignKeyError); // unassigned
  await attributes.associateCategory({ categoryId: category.id, attributeId: attribute.id });
  await assert.rejects(client.productAttributeValue.create({ data: { ...value, categoryId: otherCategory.id } }), isForeignKeyError);
  await assert.rejects(client.productAttributeValue.create({ data: { ...value, optionId: wrongChoice.id } }), isForeignKeyError);
  await assert.rejects(client.productAttributeValue.create({ data: { ...value, dataType: 'TEXT', optionId: null, textValue: 'Wrong' } }), isForeignKeyError);
  await assert.rejects(client.productAttributeValue.create({ data: { ...value, textValue: 'Extra slot' } }));
  await assert.rejects(client.productAttributeValue.create({ data: { ...value, optionId: null } }));
  await client.productAttributeValue.create({ data: value });
  await assert.rejects(client.productAttributeValue.create({ data: value }), isUniqueError);
  await assert.rejects(client.attributeOption.delete({ where: { id: choice.id } }), isForeignKeyError);
  await assert.rejects(client.attributeDefinition.delete({ where: { id: attribute.id } }), isForeignKeyError);
  await assert.rejects(client.categoryAttribute.delete({ where: { categoryId_attributeId: { categoryId: category.id, attributeId: attribute.id } } }), isForeignKeyError);
  await assert.rejects(client.product.update({ where: { id: product.id }, data: { categoryId: otherCategory.id } }), isForeignKeyError);
});

test('primary image is unique under concurrent writes and product-owned data cascades', async () => {
  const category = await categories.create({ name: 'Category', slug: slug('images') });
  const brand = await brands.create({ name: 'Brand', slug: slug('images-brand') });
  const product = await products.create({ ...productData(category.id, 'images'), brandId: brand.id });
  const results = await Promise.allSettled([1, 2].map((index) => client.productImage.create({
    data: { productId: product.id, url: 'https://assets.example/' + index, altText: 'Fixture', isPrimary: true }
  })));
  assert.equal(results.filter((result) => result.status === 'fulfilled').length, 1);
  assert.equal(await client.productImage.count({ where: { productId: product.id, isPrimary: true } }), 1);
  await assert.rejects(client.category.delete({ where: { id: category.id } }), isForeignKeyError);
  await assert.rejects(client.brand.delete({ where: { id: brand.id } }), isForeignKeyError);
  await client.product.delete({ where: { id: product.id } });
  assert.equal(await client.productImage.count({ where: { productId: product.id } }), 0);
});

test('category hierarchy protects referenced parents and rejects concurrent cycles', async () => {
  const a = await categories.create({ name: 'A', slug: slug('tree-a') });
  const b = await categories.create({ name: 'B', slug: slug('tree-b'), parentId: a.id });
  await assert.rejects(client.category.delete({ where: { id: a.id } }), isForeignKeyError);
  await assert.rejects(categories.move(a.id, b.id), { code: 'CATEGORY_CYCLE' });
  await assert.rejects(client.category.update({ where: { id: a.id }, data: { parentId: a.id } }));
  await categories.move(b.id, null);
  const outcomes = await Promise.allSettled([categories.move(a.id, b.id), categories.move(b.id, a.id)]);
  assert.equal(outcomes.filter((outcome) => outcome.status === 'fulfilled').length, 1);
  const tree = await client.category.findMany({ where: { id: { in: [a.id, b.id] } } });
  assert.equal(tree.filter((node) => node.parentId !== null).length, 1);
});

test('singleton, banner interval and normalized admin email constraints are real PostgreSQL constraints', async () => {
  const settings = { siteName: 'Fixture', defaultSeoTitle: 'Fixture', defaultSeoDescription: 'Fixture' };
  if (await client.siteSettings.count() === 0) ownedSettings.push((await client.siteSettings.create({ data: settings })).id);
  await assert.rejects(client.siteSettings.create({ data: settings }), isUniqueError);
  await assert.rejects(client.siteSettings.create({ data: { ...settings, singleton: false } }));
  await assert.rejects(client.banner.create({ data: { title: prefix, imageUrl: 'https://assets.example/banner', placement: 'HOME_HERO', startsAt: new Date(2), endsAt: new Date(1) } }));
  await assert.rejects(client.adminUser.create({ data: { name: 'Fixture', email: prefix + '@example.test', passwordHash: 'plaintext' } }));
});

test('structural seed is idempotent and never creates products', async () => {
  const data = { categories: [{ name: 'Seed category', slug: slug('seed-category') }], brands: [{ name: 'Seed brand', slug: slug('seed-brand') }] };
  const beforeCount = await client.product.count();
  await seedStructure(client, data);
  const first = await client.category.findUniqueOrThrow({ where: { slug: slug('seed-category') } });
  await seedStructure(client, data);
  const second = await client.category.findUniqueOrThrow({ where: { slug: slug('seed-category') } });
  assert.equal(first.id, second.id);
  assert.equal(first.updatedAt.getTime(), second.updatedAt.getTime());
  assert.equal(await client.brand.count({ where: { slug: slug('seed-brand') } }), 1);
  assert.equal(await client.product.count(), beforeCount);
});

test('failed transaction rolls back rows already written before a foreign-key error', async () => {
  await assert.rejects(transaction(async ({ categories: categoryRepo, products: productRepo }) => {
    const category = await categoryRepo.create({ name: 'Rollback fixture', slug: slug('rollback-category') });
    await productRepo.create({
      ...productData(category.id, 'rollback-product'),
      brandId: randomUUID()
    });
  }), isForeignKeyError);
  assert.equal(await client.category.count({ where: { slug: slug('rollback-category') } }), 0);
  assert.equal(await client.product.count({ where: { slug: slug('rollback-product') } }), 0);
});


test('public catalog service hides internal prices and returns active catalog campaigns', async () => {
  const category = await categories.create({ name: 'Public category', slug: slug('public-category'), active: true });
  const brand = await brands.create({ name: 'Public brand', slug: slug('public-brand'), active: true });
  await products.create({
    ...productData(category.id, 'public-hidden'),
    name: 'Hidden price integration',
    brandId: brand.id,
    price: '987654.32',
    showPrice: false,
    active: true
  });
  const visible = await products.create({
    ...productData(category.id, 'public-visible'),
    name: 'Visible price integration',
    brandId: brand.id,
    price: '123456.78',
    showPrice: true,
    active: true,
    featured: true
  });
  await client.banner.create({
    data: {
      title: prefix,
      subtitle: 'Integration campaign',
      imageUrl: 'https://assets.example/catalog-banner.jpg',
      placement: 'CATALOG_TOP',
      active: true
    }
  });

  const service = catalogService(client);
  const hiddenPage = await service.list({ search: 'Hidden price integration' });
  assert.equal(hiddenPage.data.length, 1);
  assert.equal(hiddenPage.data[0]?.price, null);
  assert.equal(hiddenPage.data[0]?.compareAtPrice, null);

  const visibleDetail = await service.product(visible.slug);
  assert.equal(visibleDetail.product.price, '123456.78');
  assert.equal(visibleDetail.product.slug, visible.slug);

  const campaigns = await service.banners('CATALOG_TOP');
  assert.ok(campaigns.some((banner) => banner.title === prefix));
});

test('catalog seed is idempotent and preserves rows edited after first import', async () => {
  const existingSettings = await client.siteSettings.findUnique({ where: { singleton: true } });
  const data = {
    site: { siteName: 'Seed BCM', defaultSeoTitle: 'Seed BCM', defaultSeoDescription: 'Seed description' },
    categories: [{ name: 'Seed public category', slug: slug('catalog-seed-category'), sortOrder: 10 }],
    brands: [{ name: 'Seed public brand', slug: slug('catalog-seed-brand') }],
    products: [{
      name: 'Seed product',
      slug: slug('catalog-seed-product'),
      shortDescription: 'Seed fixture',
      categorySlug: slug('catalog-seed-category'),
      brandSlug: slug('catalog-seed-brand'),
      price: '100.00',
      showPrice: true,
      featured: true,
      sortOrder: 10
    }]
  };

  const first = await seedCatalog(client, data);
  assert.equal(first.productsCreated, 1);
  const created = await client.product.findUniqueOrThrow({ where: { slug: slug('catalog-seed-product') } });
  await client.product.update({ where: { id: created.id }, data: { name: 'Edited after seed' } });

  const second = await seedCatalog(client, data);
  assert.equal(second.productsCreated, 0);
  assert.equal((await client.product.findUniqueOrThrow({ where: { id: created.id } })).name, 'Edited after seed');
  assert.equal(await client.product.count({ where: { slug: slug('catalog-seed-product') } }), 1);

  if (!existingSettings) {
    const settings = await client.siteSettings.findUnique({ where: { singleton: true } });
    if (settings) ownedSettings.push(settings.id);
  }
});

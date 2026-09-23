import '../scripts/integration-env.js';
import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { randomUUID, randomBytes } from 'node:crypto';
import { createPrismaClient } from '../src/infrastructure/prisma/client.js';
import { hashPassword } from '../src/modules/auth/password.js';

const db = createPrismaClient(process.env.TEST_DATABASE_URL!, { connectionTimeoutMillis: 20000 });
const file = '../artifacts/ui-fixture.json';

try {
  if (process.argv[2] === 'cleanup') {
    if (existsSync(file)) {
      const fixture = JSON.parse(readFileSync(file, 'utf8')) as { prefix: string; email: string };
      if (!/^ui-[0-9a-f-]{36}$/.test(fixture.prefix)) throw new Error('Invalid fixture scope');
      await db.product.deleteMany({ where: { slug: { startsWith: fixture.prefix } } });
      await db.categoryAttribute.deleteMany({ where: { category: { slug: { startsWith: fixture.prefix } } } });
      await db.attributeOption.deleteMany({ where: { attribute: { slug: { startsWith: fixture.prefix } } } });
      await db.attributeDefinition.deleteMany({ where: { slug: { startsWith: fixture.prefix } } });
      await db.category.updateMany({ where: { slug: { startsWith: fixture.prefix } }, data: { parentId: null } });
      await db.category.deleteMany({ where: { slug: { startsWith: fixture.prefix } } });
      await db.brand.deleteMany({ where: { slug: { startsWith: fixture.prefix } } });
      await db.banner.deleteMany({ where: { title: { startsWith: fixture.prefix } } });
      await db.siteSettings.deleteMany({ where: { siteName: fixture.prefix } });
      await db.adminUser.deleteMany({ where: { email: fixture.email } });
      unlinkSync(file);
      console.log('UI fixtures cleaned');
    }
  } else {
    if (existsSync(file)) throw new Error('Clean the previous UI fixtures first');
    if (await db.siteSettings.count()) throw new Error('UI tests require an unconfigured test singleton');

    const prefix = 'ui-' + randomUUID();
    const email = prefix + '@example.test';
    const password = randomBytes(24).toString('base64url');
    mkdirSync('../artifacts', { recursive: true });
    writeFileSync(file, JSON.stringify({ prefix, email, password }));

    const category = await db.category.create({ data: { name: 'QA Categoría', slug: prefix + '-category', active: true, sortOrder: 1 } });
    const brand = await db.brand.create({ data: { name: 'QA Marca', slug: prefix + '-brand', active: true } });
    const attribute = await db.attributeDefinition.create({ data: { name: 'Especificación QA', slug: prefix + '-attribute', dataType: 'TEXT', active: true } });
    await db.categoryAttribute.create({ data: { categoryId: category.id, attributeId: attribute.id, required: true } });

    const visible = await db.product.create({
      data: {
        name: 'Producto público QA',
        slug: prefix + '-public-visible',
        shortDescription: 'Producto público de prueba con precio visible.',
        fullDescription: 'Detalle público controlado por la suite end-to-end.',
        categoryId: category.id,
        brandId: brand.id,
        price: '123456.78',
        compareAtPrice: '150000.00',
        showPrice: true,
        availability: 'AVAILABLE',
        active: true,
        featured: true,
        onSale: true,
        newArrival: true,
        publishedAt: new Date(),
        sortOrder: 1,
        images: { create: [
          { url: 'http://localhost:3100/logo.jpg', altText: 'Logo BCM en producto público QA', isPrimary: true, sortOrder: 1 },
          { url: 'http://localhost:3100/logo.jpg?gallery=2', altText: 'Segunda imagen BCM de prueba', isPrimary: false, sortOrder: 2 }
        ] }
      }
    });
    await db.productAttributeValue.create({
      data: {
        productId: visible.id,
        categoryId: category.id,
        attributeId: attribute.id,
        dataType: 'TEXT',
        textValue: 'Valor público QA'
      }
    });

    const hidden = await db.product.create({
      data: {
        name: 'Producto precio oculto QA',
        slug: prefix + '-public-hidden',
        shortDescription: 'Producto público que conserva un precio interno sin exponerlo.',
        categoryId: category.id,
        brandId: brand.id,
        price: '987654.32',
        showPrice: false,
        saleMode: 'MADE_TO_ORDER',
        availability: 'MADE_TO_ORDER',
        active: true,
        publishedAt: new Date(),
        sortOrder: 2
      }
    });

    await db.siteSettings.create({
      data: {
        siteName: prefix,
        defaultSeoTitle: 'QA BCM',
        defaultSeoDescription: 'Catálogo público temporal de pruebas BCM.',
        heroTitle: 'Catálogo BCM de prueba',
        heroSubtitle: 'Validación integral del storefront público.',
        whatsappNumber: '5491112345678',
        whatsappMessageTemplate: 'Hola, consulto por {{productName}} {{productUrl}} {{sku}} {{price}}',
        instagramUrl: 'https://instagram.com/bcm.qa'
      }
    });

    await db.banner.create({
      data: {
        title: prefix + '-hero',
        subtitle: 'Hero público controlado por E2E',
        imageUrl: 'http://localhost:3100/logo.jpg',
        ctaText: 'Ver catálogo QA',
        ctaHref: '/catalogo',
        placement: 'HOME_HERO',
        active: true,
        sortOrder: 1
      }
    });

    await db.adminUser.create({ data: { email, name: 'Administrador QA', passwordHash: await hashPassword(password), active: true } });

    writeFileSync(file, JSON.stringify({
      prefix, email, password, categoryId: category.id, brandId: brand.id,
      publicVisibleSlug: visible.slug, publicHiddenSlug: hidden.slug
    }));
    console.log('UI test fixtures prepared');
  }
} finally {
  await db.$disconnect();
}

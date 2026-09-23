import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';

const fixture = () => JSON.parse(readFileSync('../artifacts/ui-fixture.json', 'utf8')) as {
  prefix: string;
  publicVisibleSlug: string;
  publicHiddenSlug: string;
};

test('public storefront exposes published catalog data without leaking hidden prices', async ({ page }) => {
  const data = fixture();

  await page.goto('/');
  await expect(page.getByRole('heading', { name: data.prefix + '-hero' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver catálogo QA' })).toHaveAttribute('href', '/catalogo');
  await expect(page.getByRole('link', { name: /Producto público QA/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Hablar por WhatsApp' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver Instagram' })).toHaveAttribute('href', 'https://instagram.com/bcm.qa');

  await page.goto('/catalogo?search=' + encodeURIComponent('Producto público QA'));
  await expect(page.getByRole('heading', { name: data.prefix + '-catalog-banner' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver destacados QA' })).toHaveAttribute('href', '/destacados');
  await expect(page.getByRole('link', { name: /Producto público QA/ })).toBeVisible();
  await expect(page.getByText('123.456,78', { exact: true })).toBeVisible();

  await page.goto('/producto/' + data.publicHiddenSlug);
  await expect(page.getByRole('heading', { name: 'Producto precio oculto QA' })).toBeVisible();
  await expect(page.getByText('Consultar precio', { exact: true })).toBeVisible();
  await expect(page.getByText(/987[.,]654/)).toHaveCount(0);
});

test('product detail renders dynamic specs, availability and configured WhatsApp', async ({ page }) => {
  const data = fixture();
  await page.goto('/producto/' + data.publicVisibleSlug);

  await expect(page.getByRole('heading', { name: 'Producto público QA' })).toBeVisible();
  await expect(page.getByText('Valor público QA', { exact: true })).toBeVisible();
  await expect(page.getByText('Disponible', { exact: true })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Logo BCM en producto público QA' })).toBeVisible();
  await page.getByRole('button', { name: 'Ver imagen 2: Segunda imagen BCM de prueba' }).click();
  await expect(page.getByRole('img', { name: 'Segunda imagen BCM de prueba' })).toBeVisible();

  const whatsapp = page.getByRole('link', { name: 'Consultar por WhatsApp' });
  await expect(whatsapp).toBeVisible();
  const href = await whatsapp.getAttribute('href');
  expect(href).toContain('https://wa.me/5491112345678');
  expect(decodeURIComponent(href ?? '')).toContain('Producto público QA');
  expect(decodeURIComponent(href ?? '')).toContain('123.456,78');
});

test('filters, empty state and special listings stay navigable', async ({ page }) => {
  const data = fixture();

  await page.goto('/ofertas');
  await expect(page.getByRole('link', { name: /Producto público QA/ })).toBeVisible();

  await page.goto('/nuevos');
  await expect(page.getByRole('link', { name: /Producto público QA/ })).toBeVisible();

  await page.goto('/catalogo?category=' + data.prefix + '-category&availability=MADE_TO_ORDER&saleMode=MADE_TO_ORDER');
  await expect(page.getByRole('link', { name: /Producto precio oculto QA/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Producto público QA/ })).toHaveCount(0);

  await page.goto('/buscar?search=no-such-public-product-' + data.prefix);
  await expect(page.getByRole('heading', { name: 'No encontramos productos' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ver todo el catálogo' })).toBeVisible();
});

test('public pages pass responsive smoke QA at required viewports', async ({ page }) => {
  test.setTimeout(240000);
  const data = fixture();
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('Failed to load resource')) errors.push(message.text());
  });
  mkdirSync('../artifacts/public-ui-qa', { recursive: true });

  for (const width of [360, 430, 768, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const [name, route] of [['home', '/'], ['catalog', '/catalogo'], ['product', '/producto/' + data.publicVisibleSlug]] as const) {
      await page.goto(route);
      await expect(page.locator('main')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
      await page.screenshot({ path: '../artifacts/public-ui-qa/' + width + '-' + name + '.png', fullPage: true });
    }
  }

  expect(errors).toEqual([]);
});

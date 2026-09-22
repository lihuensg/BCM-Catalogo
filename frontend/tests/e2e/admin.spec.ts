import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';
const fixture = () => JSON.parse(readFileSync('../artifacts/ui-fixture.json', 'utf8')) as {
    prefix: string;
    email: string;
    password: string;
    categoryId: string;
    brandId: string;
};
async function login(page: Page) { const f = fixture(); await page.goto('/admin/login'); await page.getByLabel('Email', { exact: true }).fill(f.email); await page.getByLabel('Contraseña', { exact: true }).fill(f.password); await page.getByRole('button', { name: 'Ingresar al panel' }).click(); await expect(page).toHaveURL(/\/admin$/); await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible(); }
async function choose(page: Page, label: string, value: string) { await expect(page.getByLabel(label, { exact: true }).locator('option[value="' + value + '"]')).toBeAttached(); await page.getByLabel(label, { exact: true }).selectOption(value); }
test('login validates credentials, protects routes server-side and revokes logout', async ({ page }) => { await page.goto('/admin/productos'); await expect(page).toHaveURL(/\/admin\/login$/); await page.getByLabel('Email', { exact: true }).fill('missing@example.test'); await page.getByLabel('Contraseña', { exact: true }).fill('invalid'); await page.getByRole('button', { name: 'Ingresar al panel' }).click(); await expect(page.locator('.notice-error')).toContainText('email o la contraseña'); await login(page); await page.goto('/admin/login'); await expect(page).toHaveURL(/\/admin$/); await page.getByRole('button', { name: 'Salir', exact: true }).click(); await expect(page).toHaveURL(/\/admin\/login$/); await page.goto('/admin/configuracion'); await expect(page).toHaveURL(/\/admin\/login$/); });
test('real product journey creates, validates, edits and deactivates with dynamic attributes and media', async ({ page }) => { const f = fixture(); await login(page); await page.goto('/admin/productos/nuevo'); await page.getByLabel('Nombre', { exact: true }).fill('Producto QA con nombre largo para validar el diseño responsive'); await page.getByLabel('Slug', { exact: true }).fill(f.prefix + '-product'); await page.getByLabel('Descripción breve', { exact: true }).fill('Producto de prueba controlado por la suite de UI.'); await choose(page, 'Categoría', f.categoryId); await page.getByLabel('Precio actual', { exact: true }).fill('1234567890123456.78'); await page.getByRole('switch', { name: 'Producto activo / publicado' }).check(); await page.getByRole('button', { name: 'Guardar producto' }).click(); await expect(page.getByText('Completá todas las especificaciones requeridas para publicar.')).toBeVisible(); await page.getByLabel('Especificación QA · Requerido al publicar', { exact: true }).fill('Valor QA'); await page.getByRole('button', { name: '+ Agregar imagen', exact: true }).click(); await page.getByLabel('URL de imagen 1', { exact: true }).fill('http://localhost:3100/logo.jpg'); await page.getByLabel('Texto alternativo 1', { exact: true }).fill('Imagen BCM de prueba'); await page.getByLabel('Imagen principal', { exact: true }).check(); await page.getByRole('button', { name: 'Guardar producto' }).click(); await expect(page).toHaveURL(/\/admin\/productos\/[^/]+\/editar$/); await page.getByLabel('Nombre', { exact: true }).fill('Producto QA editado'); await page.getByRole('button', { name: 'Guardar producto' }).click(); await expect(page.getByRole('status').filter({ hasText: 'Producto guardado correctamente.' })).toBeVisible(); await page.goto('/admin/productos?search=' + f.prefix); await expect(page.getByRole('link', { name: 'Producto QA editado' })).toBeVisible(); await page.getByRole('button', { name: 'Desactivar', exact: true }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Desactivar', exact: true }).click(); await expect(page.getByRole('status').filter({ hasText: 'Producto desactivado.' })).toBeVisible(); await expect(page.getByRole('cell', { name: 'Inactivo', exact: true })).toBeVisible(); });
test('master forms persist categories, brands, options, associations and banners', async ({ page }) => {
    const f = fixture();
    await login(page);
    for (const [route, singular] of [['categorias', 'categoría'], ['marcas', 'marca'], ['atributos', 'atributo']] as const) {
        await page.goto('/admin/' + route);
        await page.getByRole('button', { name: '+ Crear ' + singular, exact: true }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByLabel('Nombre', { exact: true }).fill('QA ' + singular);
        await dialog.getByLabel('Slug', { exact: true }).fill(f.prefix + '-' + route);
        if (route === 'atributos')
            await dialog.getByLabel('Tipo de dato', { exact: true }).selectOption('OPTION');
        await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
        await expect(dialog).not.toBeVisible();
        await expect(page.getByRole('status').filter({ hasText: 'Cambios guardados.' })).toBeVisible();
    }
    const row = page.getByRole('row').filter({ hasText: 'QA atributo' });
    await row.getByRole('button', { name: 'Opciones', exact: true }).click();
    await page.getByRole('button', { name: '+ Crear opción', exact: true }).click();
    await page.getByLabel('Nombre visible', { exact: true }).fill('Opción QA');
    await page.getByLabel('Valor', { exact: true }).fill('qa');
    await page.getByRole('dialog').getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByRole('cell', { name: 'Opción QA', exact: true })).toBeVisible();
    await page.getByRole('button', { name: '← Volver a definiciones' }).click();
    await page.getByRole('tab', { name: 'Asociaciones a categorías' }).click();
    await choose(page, 'Categoría', f.categoryId);
    await expect(page.getByRole('cell', { name: 'Especificación QA', exact: true })).toBeVisible();
    await page.goto('/admin/banners');
    await page.getByRole('button', { name: '+ Crear banner', exact: true }).click();
    await page.getByLabel('Título', { exact: true }).fill(f.prefix + '-banner');
    await page.getByLabel('Imagen desktop URL', { exact: true }).fill('http://localhost:3100/logo.jpg');
    await page.getByRole('dialog').getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByRole('cell', { name: f.prefix + '-banner', exact: true })).toBeVisible();
});
test('settings validate placeholders and save actual configuration', async ({ page }) => { const f = fixture(); await login(page); await page.goto('/admin/configuracion'); await page.getByLabel('Nombre del sitio', { exact: true }).fill(f.prefix); await page.getByLabel('Título SEO predeterminado', { exact: true }).fill('QA BCM'); await page.getByLabel('Descripción SEO predeterminada', { exact: true }).fill('Configuración temporal de pruebas'); await page.getByLabel('Número de WhatsApp', { exact: true }).fill('5491112345678'); await page.getByLabel('Mensaje de WhatsApp', { exact: true }).fill('{{unsupported}}'); await page.getByRole('button', { name: 'Guardar configuración' }).click(); await expect(page.getByText('Usá únicamente los placeholders indicados, sin modificar las llaves.')).toBeVisible(); await page.getByLabel('Número de WhatsApp', { exact: true }).fill(''); await page.getByLabel('Mensaje de WhatsApp', { exact: true }).fill(''); await page.getByRole('button', { name: 'Guardar configuración' }).click(); await expect(page.getByRole('status').filter({ hasText: 'Configuración guardada.' })).toBeVisible(); await page.reload(); await expect(page.getByLabel('Nombre del sitio', { exact: true })).toHaveValue(f.prefix); });
test('all admin screens remain usable across five viewports with no React errors', async ({ page }) => { test.setTimeout(240000); const errors: string[] = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', msg => { if (msg.type() === 'error' && !msg.text().includes('Failed to load resource'))
    errors.push(msg.text()); }); await login(page); mkdirSync('../artifacts/ui-qa', { recursive: true }); for (const width of [360, 430, 768, 1366, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['', '/productos', '/productos/nuevo', '/categorias', '/marcas', '/atributos', '/banners', '/configuracion']) {
        await page.goto('/admin' + route);
        await expect(page.locator('main h1')).toBeVisible();
        await expect(page.getByText('Cargando datos…', { exact: true })).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBeTruthy();
        // Playwright temporarily hides carets while capturing. Wait for React to
        // finish hydration so that temporary screenshot styles cannot race it.
        await page.waitForTimeout(500);
        await page.screenshot({ path: '../artifacts/ui-qa/' + width + '-' + (route.replaceAll('/', '-') || 'dashboard') + '.png', fullPage: true });
    }
    if (width < 900) {
        await page.getByRole('button', { name: 'Abrir navegación' }).click();
        await expect(page.getByRole('dialog')).toBeVisible();
        await page.getByRole('dialog').getByRole('link', { name: 'Productos', exact: true }).click();
        await expect(page).toHaveURL(/\/admin\/productos$/);
        await expect(page.getByRole('dialog')).not.toBeVisible();
    }
} expect(errors).toEqual([]); });
test('API outage offers retry and empty results preserve navigation', async ({ page }) => { await login(page); await page.route('**/api/admin-proxy/admin/products?**', route => route.abort()); await page.goto('/admin/productos'); await expect(page.locator('.notice-error')).toContainText('No pudimos conectar'); await page.unroute('**/api/admin-proxy/admin/products?**'); await page.getByRole('button', { name: 'Volver a intentar' }).click(); await expect(page.locator('.notice-error')).toHaveCount(0); await page.goto('/admin/productos?search=no-such-product-' + fixture().prefix); await expect(page.getByRole('heading', { name: 'No encontramos productos' })).toBeVisible(); });

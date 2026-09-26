# Catálogo BCM

Catálogo comercial administrable construido como monorepo npm workspaces.

No es ecommerce: no hay carrito, checkout, pagos, clientes ni órdenes. El objetivo es publicar productos, navegar, buscar, filtrar y convertir consultas por WhatsApp.

## Estado
Consultar docs/PROJECT_STATUS.md.

Implementado:
- panel admin completo;
- auth con sesiones PostgreSQL;
- categorías, marcas, atributos, banners y settings;
- CRUD de productos;
- atributos dinámicos;
- galería;
- API pública;
- storefront;
- búsqueda y filtros;
- precio visible/oculto;
- ofertas, destacados y nuevos;
- WhatsApp e Instagram configurables;
- cache y revalidación;
- SEO base;
- CI y suites de tests.

## Stack
- Next.js 16 / React 19 / TypeScript;
- Tailwind CSS 4;
- Node.js / Express 5;
- Prisma 7;
- PostgreSQL / Neon;
- Zod;
- Playwright;
- npm workspaces.

## Estructura
```text
apps/public/          Next.js del catálogo público
apps/admin/           Next.js del panel de gestión
backend/              Express + Prisma + PostgreSQL
packages/shared/      DTOs y contratos compartidos
docs/                 arquitectura, negocio, QA y operación
.github/workflows/    gates CI
render.yaml           blueprint backend preparado
```

## Requisitos
- Node.js 24.x;
- npm 11.x;
- PostgreSQL real para persistencia/integración.

## Instalación
```sh
npm ci
npm run build:shared
npm run prisma:generate
```

Crear archivos locales desde los ejemplos y nunca versionar secretos.

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item backend/.env.test.example backend/.env.test
Copy-Item apps/public/.env.example apps/public/.env.local
Copy-Item apps/admin/.env.example apps/admin/.env.local
```

## Desarrollo
Backend:
```sh
npm run dev:backend
```

Frontend público:
```sh
npm run dev:public
```

Panel administrador:
```sh
npm run dev:admin
```

URLs:
- público: http://localhost:3000
- admin: http://localhost:3001
- login admin: http://localhost:3001/login
- health: http://127.0.0.1:4100/api/v1/health

## Base de datos
Desarrollo usa DATABASE_URL.
Tests de integración y E2E usan exclusivamente TEST_DATABASE_URL dedicada.

```sh
npm run prisma:validate
npm run prisma:generate
npm run prisma:deploy
npm run prisma:status
```

No usar prisma db push ni migrate reset como sustituto de migraciones versionadas.

## Seed
```sh
npm run prisma:seed
```

Variables opcionales:
- SEED_DATA_FILE;
- SEED_CATALOG_FILE=prisma/catalog.seed.json;
- ADMIN_EMAIL;
- ADMIN_PASSWORD;
- ADMIN_NAME.

El catálogo demo contiene 20 productos de referencia. Es idempotente por slug y no sobrescribe productos editados. Sus precios son demo y deben revisarse antes de un uso comercial real.

## Calidad
```sh
npm run lint
npm run typecheck
npm test
npm run test:frontend
npm run build:public
npm run build:admin
npm run build:backend
npm run build
npm run prisma:validate
npm run prisma:generate
```

Integración real:
```sh
npm run prisma:test:migrate
npm run test:integration
```

Browser QA:
```sh
npm exec --workspace @bcm/public -- playwright install chromium
npm run test:e2e
```

Los tests con DB crean fixtures propios y no deben apuntar jamás a producción.

## Producción
Arquitectura prevista:
- catálogo público: Netlify, `catalogo.bcm.com.ar`;
- panel admin: Netlify, `gestion.bcm.com.ar`;
- backend único: Render, `api.bcm.com.ar`;
- DB: Neon.

Leer docs/DEPLOYMENT_RUNBOOK.md antes de desplegar.

## Documentación clave
- AGENTS.md
- docs/PROJECT_STATUS.md
- docs/ARCHITECTURE.md
- docs/BUSINESS_RULES.md
- docs/PUBLIC_CATALOG.md
- docs/ADMIN_UI_IMPLEMENTATION.md
- docs/PRODUCT_DOMAIN.md
- docs/CACHE_AND_DEPLOYMENT.md
- docs/DEPLOYMENT_RUNBOOK.md
- docs/SECURITY.md
- docs/TESTING.md
- docs/UI_QA.md

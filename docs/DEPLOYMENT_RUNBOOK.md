# DEPLOYMENT_RUNBOOK.md

## Objetivo
Preparar producción sin guardar secretos en el repositorio.

Topología prevista:
- frontend Next.js: Vercel;
- backend Express: Render;
- PostgreSQL: Neon;
- código y CI: GitHub.

No desplegar hasta que el PR de release tenga gates verdes y exista una base productiva separada de la DB usada para integración/E2E.

## 1. Neon producción
Crear una base productiva independiente de TEST_DATABASE_URL.

En Render configurar únicamente la DATABASE_URL productiva.

Antes de exponer tráfico:
1. verificar que no sea la DB de test;
2. aplicar migraciones versionadas con prisma migrate deploy;
3. verificar prisma migrate status;
4. no usar db push ni migrate reset.

El seed demo es opcional. Sus precios deben revisarse antes de un uso comercial real.

## 2. Backend en Render
El repositorio incluye render.yaml y conserva el root del monorepo porque backend depende de packages/shared.

Runtime:
- NODE_ENV=production
- HOST=0.0.0.0
- TRUST_PROXY_HOPS=1

Build: npm ci && npm run build:backend

Pre-deploy: npm run prisma:deploy

Start: npm run start --workspace @bcm/backend

Health: /api/v1/health

Variables no versionadas:
- DATABASE_URL
- CORS_ORIGINS
- FRONTEND_REVALIDATE_URL
- REVALIDATION_SECRET

CORS_ORIGINS debe contener el origen exacto del frontend final, sin slash final.

## 3. Frontend en Vercel
Importar el repositorio como proyecto Next.js y mantener acceso al workspace compartido durante instalación/build.

Configuración objetivo:
- Framework: Next.js;
- aplicación: frontend;
- Node.js: 24.x;
- instalación desde el workspace;
- build equivalente a npm run build:frontend desde el root o al workspace frontend precedido por build:shared.

Variables:
- API_BASE_URL=https://<backend>/api/v1
- NEXT_PUBLIC_SITE_URL=https://<frontend>
- REVALIDATION_SECRET=<mismo secreto que Render>

No exponer DATABASE_URL en Vercel.

## 4. Revalidación
Render: FRONTEND_REVALIDATE_URL=https://<frontend>/api/revalidate

Render y Vercel deben compartir un REVALIDATION_SECRET aleatorio de al menos 32 caracteres.

Una mutación admin se confirma primero en PostgreSQL. La invalidación de cache es posterior y best-effort.

## 5. Orden de salida
1. merge de release con CI verde;
2. crear Neon productiva;
3. crear backend Render;
4. verificar health;
5. crear frontend Vercel;
6. configurar CORS;
7. configurar revalidación;
8. crear admin operativo;
9. cargar settings/banners/productos;
10. smoke test;
11. recién entonces apuntar dominio público.

## 6. Smoke test
Público:
- home;
- catálogo;
- búsqueda;
- categoría;
- marca;
- ofertas/destacados/nuevos;
- producto con precio;
- producto sin precio;
- WhatsApp;
- sitemap y robots.

Admin:
- login/logout;
- producto create/edit/deactivate;
- categorías/marcas/atributos;
- banners;
- settings.

Infra:
- health 200;
- migraciones al día;
- cookie Secure/HttpOnly;
- CORS solo al frontend;
- revalidación posterior a mutación;
- storefront cacheado utilizable ante cold start del backend.

## 7. Rollback
Si una release falla:
- volver frontend/backend al último commit válido;
- no ejecutar rollback destructivo de DB;
- mantener migraciones forward-compatible;
- crear migración compensatoria solo después de diagnosticar.

Nunca usar prisma migrate reset en producción.

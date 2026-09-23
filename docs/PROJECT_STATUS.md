# PROJECT_STATUS.md

## Estado actual
Rama de trabajo: `feature/complete-bcm-catalog`.

La arquitectura base, persistencia, seguridad administrativa y dominio de producto
están estabilizados. El trabajo actual completa storefront, caché, QA y preparación
operativa sin hacer deploy ni tocar una base productiva.

## Etapas

| Etapa | Estado | Alcance |
| --- | --- | --- |
| 00 | Cerrada | Monorepo, Next.js, Express, TypeScript, Prisma, tooling |
| 01 | Cerrada | PostgreSQL/Neon, schema, migración, constraints, integración |
| 02 | Cerrada | Auth admin, sesiones, seguridad, CRUD de maestros |
| 03 | Cerrada | Dominio completo de producto, galería, atributos, publicación |
| 04 | Cerrada | Panel admin visual y journeys principales |
| 05 | Implementada | API pública, home, catálogo, búsqueda, categorías, marcas, detalle |
| 06 | En pulido | Branding BCM, responsive, campañas, contacto y galería |
| 07 | Implementada | Cache tags, stale/revalidation y hook post-commit |
| 08 | En validación | CI, seguridad frontend, E2E público, SEO, responsive |
| 09 | Pendiente | Deploy y smoke tests productivos |

## Storefront implementado
- home comercial BCM;
- hero administrable;
- banners secundarios;
- destacados, ofertas y nuevos ingresos;
- marcas y categorías;
- catálogo paginado;
- búsqueda;
- filtros por categoría, marca, precio, disponibilidad y tipo de venta;
- páginas de ofertas/destacados/nuevos;
- detalle con galería, ficha técnica dinámica y relacionados;
- precio público/oculto;
- WhatsApp e Instagram desde settings;
- sitemap y robots condicionados al dominio configurado;
- estados loading/error/not-found;
- responsive.

## Datos demo
Existe `backend/prisma/catalog.seed.json` con 20 productos demo persistibles y
`SEED_CATALOG_FILE` para carga idempotente. No se ejecuta automáticamente en una
base desconocida y no sobrescribe productos editados posteriormente.

Los precios son exclusivamente datos demo y deben revisarse antes de publicar.

## Calidad automática
GitHub Actions valida:
- lint;
- TypeScript estricto;
- unit tests backend/frontend;
- build;
- Prisma validate/generate.

El browser E2E se activa con un secret `TEST_DATABASE_URL` dedicado. Sin ese
secret queda omitido de manera explícita.

## Seguridad relevante
- sesión admin HttpOnly y revocable;
- CSRF y CORS;
- rate limiting;
- Helmet backend;
- headers defensivos frontend;
- DTO público separado;
- precio interno no se expone cuando `showPrice=false`;
- URLs multimedia HTTPS salvo localhost de desarrollo;
- secrets fuera del repositorio;
- endpoint de revalidación autenticado.

## Pendientes antes de considerar producción cerrada
1. ejecutar E2E completo con una Neon dedicada de test desde CI o local;
2. revisar screenshots reales del storefront y corregir cualquier detalle visual;
3. cargar/validar imágenes comerciales definitivas o un storage/CDN;
4. definir dominio público;
5. configurar variables finales Vercel/Render/Neon;
6. aplicar migraciones productivas;
7. crear admin operativo fuera del repositorio;
8. ejecutar seed comercial solo si se decide usar los datos demo;
9. smoke test público y admin después del deploy;
10. convertir el PR draft a listo únicamente cuando todos los gates estén verdes.

## Regla de cierre
No marcar el proyecto como productivo solo porque compile. El cierre requiere
validación real de frontend, backend, DB, cache/revalidación, seguridad, responsive
y el entorno desplegado.

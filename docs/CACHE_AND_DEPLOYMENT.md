# Cache público y revalidación

El storefront usa Server Components y el Data Cache de Next.js. Las lecturas públicas se cachean por tags durante 5 minutos y admiten contenido stale mientras el backend vuelve a estar disponible.

## Tags
- `public-home`
- `public-settings`
- `public-categories`
- `public-brands`
- `public-products`
- `public-product-<slug>`

## Invalidación
Las mutaciones administrativas se confirman primero en PostgreSQL. Después del commit el backend notifica de forma best-effort a `FRONTEND_REVALIDATE_URL`; un fallo de red nunca revierte la mutación ya guardada.

Productos invalidan catálogo, home y slug actual/anterior. Categorías, marcas, atributos, banners y settings invalidan únicamente las familias públicas relacionadas.

El endpoint frontend `POST /api/revalidate`:
- exige Bearer secret server-only;
- compara el secreto en tiempo constante;
- solo acepta tags del namespace público conocido;
- limita cada llamada a 30 tags;
- nunca devuelve el secreto.

## Variables
Backend:
- `FRONTEND_REVALIDATE_URL`
- `REVALIDATION_SECRET`

Frontend:
- `REVALIDATION_SECRET`
- `NEXT_PUBLIC_SITE_URL` para URLs canónicas/WhatsApp.

URL y secreto de revalidación son opcionales en local, pero deben configurarse juntos en producción.

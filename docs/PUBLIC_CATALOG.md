# PUBLIC_CATALOG.md

## Rutas
- `/`
- `/catalogo`
- `/categoria/[slug]`
- `/marca/[slug]`
- `/producto/[slug]`
- `/ofertas`
- `/destacados`
- `/nuevos`
- `/buscar`

## Header
- logo BCM;
- navegación;
- buscador;
- acceso catálogo;
- ofertas;
- Instagram;
- CTA WhatsApp en desktop cuando no sature;
- menú mobile.

## Home
Orden recomendado:
1. Hero visual BCM.
2. Buscador/entrada al catálogo.
3. Categorías destacadas.
4. Productos destacados.
5. Ofertas.
6. Nuevos ingresos.
7. Marcas.
8. Bloque editorial/beneficios.
9. CTA WhatsApp.
10. Instagram.
11. Footer.

No todas las secciones deben renderizarse si no tienen contenido.

## Hero
Administrable parcialmente.
Debe soportar:
- imagen;
- título;
- subtítulo;
- CTA;
- responsive.

Usar imágenes demo alineadas a BCM hasta contar con material definitivo.

## Catálogo
Desktop:
- sidebar o panel de filtros;
- grid adaptable;
- toolbar con resultados, sort y vista.

Mobile:
- filtros en drawer;
- sort accesible;
- no sacrificar ancho de cards.

### Filtros
- búsqueda;
- categoría;
- marca;
- precio;
- disponibilidad;
- oferta;
- destacados;
- nuevos;
- por encargo.

## ProductCard
Debe mostrar según disponibilidad:
- imagen;
- marca;
- nombre;
- badges relevantes;
- precio / consultar;
- disponibilidad resumida;
- CTA secundario o navegación a detalle.

No sobrecargar con especificaciones.

## Detalle
- breadcrumbs;
- galería;
- marca;
- nombre;
- SKU si aporta;
- badges;
- precio/consultar;
- disponibilidad;
- CTA WhatsApp;
- descripción;
- ficha técnica dinámica;
- productos relacionados;
- compartir opcional.

## Búsqueda
- tolerar query vacía;
- mostrar término;
- sugerir corrección solo si existe lógica real;
- empty state útil;
- filtros compatibles.

## Sin resultados
No dejar página vacía.
Mostrar:
- mensaje claro;
- limpiar filtros;
- categorías sugeridas;
- WhatsApp opcional.

## Rendimiento
- imagen principal priorizada en hero/producto;
- lazy load resto;
- paginación;
- evitar enviar atributos completos de todos los productos en listados;
- catálogo público cacheado.


## Implementación Etapa 05
La lectura pública se expone bajo `/api/v1/public` con DTOs propios. Estos DTOs son deliberadamente distintos de los administrativos:
- nunca devuelven precios internos cuando `showPrice=false`;
- nunca exponen IDs/flags sensibles de administración innecesarios;
- solo listan productos activos, publicados y pertenecientes a categorías activas;
- las marcas desactivadas no se usan como filtro público;
- listados no cargan galería completa ni atributos.

Endpoints:
- `GET /api/v1/public/home`
- `GET /api/v1/public/products`
- `GET /api/v1/public/products/:slug`
- `GET /api/v1/public/categories`
- `GET /api/v1/public/brands`
- `GET /api/v1/public/settings`

El frontend usa Server Components y `fetch` cacheado con revalidación temporal. La home y los listados degradan a estados útiles si todavía no existe una API configurada; no se crean productos mock en frontend.

La capa visual pública vive en `components/catalog` y `features/catalog`, separada del panel admin. El catálogo soporta búsqueda, categoría, marca, orden, páginas especiales (ofertas, nuevos, destacados), detalle, ficha dinámica y CTA WhatsApp basado en settings.

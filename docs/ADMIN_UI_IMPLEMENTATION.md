# Panel administrador — Etapa 04

## Alcance
Panel conectado a la API real. Sin catálogo público, deploy, storage, uploads,
productos finales ni ecommerce. Se conserva PostgreSQL exclusivamente para tests.
La base de desarrollo y las credenciales operativas deben configurarse antes del uso
cotidiano; los tests crean y eliminan su administrador temporal.

## Rutas
- /admin/login: login real; sesión existente redirige al dashboard.
- /admin: dashboard agregado.
- /admin/productos: tabla, filtros en URL, orden y paginación.
- /admin/productos/nuevo y /admin/productos/[id]/editar: formulario de producto.
- /admin/categorias, /admin/marcas: mantenimiento de maestros.
- /admin/atributos: definiciones/opciones y asociaciones a categorías separadas.
- /admin/banners: imágenes, textos, CTA, placement, fechas y actividad.
- /admin/configuracion: singleton real, inicialmente vacío si no está configurado.

El route group (protected) verifica /auth/me desde el servidor antes de renderizar.
La API mantiene requireAdmin como autoridad en cada operación; un layout cacheado
no concede acceso a datos. Un 401 posterior descarta el estado de la página mediante
navegación completa a login. No se persisten tokens ni passwords en localStorage.
Todas las rutas administrativas tienen noindex y rendering dinámico.

## HTTP y sesiones
services/admin/client.ts centraliza fetch, cookies, JSON, CSRF, errores, abort y
expiración. /api/admin-proxy/[...path] permite únicamente segmentos seguros bajo
auth/admin y usa API_BASE_URL del servidor. Conserva Set-Cookie y Cache-Control:
no-store. Mutaciones requieren X-BCM-Admin: 1 y Origin igual al del frontend;
el backend vuelve a verificar Origin contra CORS_ORIGINS. No relaja cookies.
En desarrollo normal usar frontend localhost:3000 y la API del ejemplo en 4100.

La verificación de sesión en servidor no confunde un fallo de red con logout:
los errores de servicio tienen estado de error y retry. Login conserva el email
ante errores, no registra credenciales y revoca la sesión al salir.
El proxy conserva el rate limiting existente; revisar IP/trust proxy y dominios al
planificar despliegue. Esta etapa no configura infraestructura productiva.

## Componentes y estado
components/ui concentra Button, IconButton, Input, Textarea, Select, SearchInput,
Checkbox, Switch, Badge, Card, DataTable, Pagination, PageSize, Dropdown, Dialog,
Drawer, Tabs, Toast, Skeleton, Breadcrumb, PageHeader, FormField y estados vacíos.
Dialog/Drawer usan dialog nativo: foco contenido, Escape y retorno de foco del
navegador. Tabs admiten flechas. Los controles tienen labels y foco visible.
No se incorporó una segunda biblioteca visual: Untitled UI es referencia de
jerarquía/espaciado, adaptada a tokens BCM y componentes locales existentes.

Estado local para formularios; URL para filtros de productos; useResource para
queries cancelables y retry. No Redux ni caché pública. Los cambios de query no
presentan datos anteriores como si fueran actuales. Selectores remotos consultan
páginas de 20 opciones con búsqueda; no descargan todos los productos ni maestros.
Los atributos de la categoría se cargan por páginas de 100 para validar el conjunto.

## Formularios
ProductForm usa contratos compartidos y solo envía campos editables. Dividido en
información, categorización, precio/venta, disponibilidad, imágenes, especificaciones,
merchandising, SEO y publicación. El backend sigue siendo autoridad.
Dinero se conserva como string; validación comparativa mediante enteros exactos,
sin floats ni pérdida de centavos en importes grandes. No se inventa moneda comercial.
Ocultar precio conserva el monto interno. Apagar oferta conserva compareAtPrice y
ofrece retirarlo explícitamente. Nunca se infiere onSale.

Cambiar categoría advierte sobre valores existentes y exige confirmación para
retirarlos en el formulario. La escritura posterior conserva la transacción del
dominio. BOOLEAN distingue ausencia de false mediante un control Definir valor.
OPTION usa selector remoto; TEXT/NUMBER dependen de definición y unidad del backend.

MediaEditor recibe la colección y onChange, sin conocer persistencia ni upload;
permite URL, preview, alt, orden, principal y eliminación confirmada. MediaPreview
usa Next Image sin optimizador para URLs administrativas arbitrarias, fallback,
proporción estable y no-referrer. No se descargan imágenes desde el backend.

ResourceManager/ResourceForm/ResourceFields componen formularios de maestros sin
replicar controles. Las reglas específicas siguen en modelos de feature/backend.
Categorías distinguen raíz/subcategoría; se verifica la cadena de ancestros antes
de aceptar un padre, además de la validación transaccional del servidor. Crear
un atributo OPTION inactivo permite agregar opciones antes de activarlo.
Las asociaciones explicitan atributo, categoría, required y orden por separado.
Banners convierten fechas locales a ISO con zona; CTA requiere texto y enlace juntos.
Settings admite solamente productName/productUrl/sku/price en el template WhatsApp.

Los errores usan mensajes españoles, nunca JSON o SQL. Campos Zod se marcan con
mensaje contextual; conflictos de slug/SKU tienen mensajes específicos. Submit
bloqueado durante guardado, valores conservados ante fallo y feedback de éxito.
Formularios con cambios avisan al navegar/cerrar; no hay autosave.

## Adiciones mínimas de backend
- GET /api/v1/admin/dashboard: ocho conteos y cuatro bloques de hasta 5 productos.
  Consultas de cantidad fija, sin N+1 ni agregaciones del catálogo en el navegador.
  Sin analytics ficticios. Conteos/filas pueden observar instantes ligeramente
  distintos durante escrituras concurrentes, igual que listados existentes.
- GET /api/v1/admin/categories/:categoryId/product-attributes: definiciones activas
  asignadas, required y orden; paginado, sin valores de productos ni opciones pesadas.
- GET products: ProductAdminListDto suma categoryName, brandName y thumbnail nullable.
  Prisma selecciona nombres y hasta una imagen principal (URL/alt), nunca la galería.
  Si no hay principal, la miniatura muestra fallback aunque existan otras imágenes.
- GET asociaciones: agrega definición resumida para evitar una consulta por fila.

Se conservan endpoints de mutación, schema y migraciones. Nuevas lecturas heredan
auth/no-store; controllers llaman services y no Prisma. Contratos en packages/shared.

## Responsive y QA
Sidebar fija en desktop y Drawer por debajo de 900px; formularios de dos columnas
pasan a una en mobile. Tablas mantienen scroll dentro de una región enfocable,
con acciones accesibles por desplazamiento; no ensanchan el documento.
Tokens de espaciado, tipografía, radios, contraste y reduced-motion en globals.css.
Logo original sin recortar ni recolorear.

Playwright es dependencia exclusivamente de desarrollo para E2E y capturas.
El navegador integrado falló al inicializar (Cannot redefine property: process),
por lo que se usa Chromium local de Playwright. No requiere ningún servicio externo
además de la conexión de test ya autorizada.

## Comandos
Desde raíz, ejecutar secuencialmente:

~~~sh
npm run lint
npm run typecheck
npm run test:frontend
npm test
npm run test:integration
npm run test:e2e
npm run build
npm run prisma:validate
npm run prisma:generate
~~~

Preparación del navegador: npm exec --workspace @bcm/frontend -- playwright install chromium.
E2E levanta frontend en localhost:3100 y API en 127.0.0.1:4200, con TEST_DATABASE_URL
y guardia de separación existentes. Global setup crea fixtures con prefijo UUID;
teardown elimina solo esos registros. Credenciales temporales únicamente en
artifacts/ui-fixture.json ignorado, eliminado al finalizar. No se guardan traces
que puedan contener el password de login. Capturas en artifacts/ui-qa.
Si una interrupción impide cleanup, ejecutar desde backend:
node ../node_modules/tsx/dist/cli.mjs tests/ui-fixture.ts cleanup.
No ejecutar integración y E2E simultáneamente: ambos prueban settings singleton.

## Límites explícitos
No hay guardado automático, editor enriquecido, upload ni preview público conectado.
La edición por snapshots conserva las limitaciones de concurrencia de Etapa 03.
No hay recuperación de contraseña; se conserva el mecanismo de seed existente.
El logo raster conserva sus limitaciones de contraste/tamaño; no se inventó otro.

Etapa 05, solo con autorización: definir API pública y comenzar catálogo cache-first,
con DTOs que oculten precios internos. Confirmar alcance con el prompt de esa etapa.

El arnés E2E permite 20 segundos para conectar a Neon y verifica SELECT 1 antes
de servir la API, por timeouts observados al despertar la base. El cliente normal
conserva su timeout previo de 5 segundos. La opción no altera schema ni auth.

# Etapa 02 — autenticación y API administrativa

## Alcance

API REST en /api/v1. Sin registro público, RBAC, OAuth, uploads, nuevas pantallas,
storefront, deploy ni ecommerce. Etapa 03 amplía productos según [PRODUCT_DOMAIN.md](PRODUCT_DOMAIN.md).
La configuración local conserva Neon exclusivamente como test; DATABASE_URL de
backend/.env sigue vacía. Se necesita una conexión de desarrollo separada para
operar la API fuera de las pruebas. No se creó una cuenta operativa con credenciales
inventadas. Los administradores temporales de las pruebas se eliminan al finalizar.

## Autenticación y sesiones

Se eligió sesión server-side en PostgreSQL frente a JWT: logout revoca inmediatamente
el token y las sesiones sobreviven reinicios, sin Redis ni una lista adicional de
revocación. La migración 202609190002_admin_sessions agrega AdminSession: UUID,
adminId, tokenHash único, expiresAt, createdAt y updatedAt. Índices de admin y expiración;
FK Cascade al borrar el administrador. No cambia las entidades del catálogo.

El token es aleatorio de 32 bytes (256 bits), base64url. Solo su SHA-256 se persiste;
no se devuelve en JSON ni se registra. La cookie es bcm_session en desarrollo y
__Host-bcm_session en producción: HttpOnly, Path=/, sin Domain, SameSite=Lax,
Secure en producción. Expiración absoluta SESSION_TTL_SECONDS, 28800 por defecto
(8 horas), configurable entre 300 y 604800. No se renueva por actividad.
Login rota la sesión presentada y elimina sesiones vencidas del mismo admin;
logout borra la sesión en DB y expira la cookie, incluso si ya estaba ausente.
Una cookie inválida, vencida o de usuario inactivo obtiene AUTH_REQUIRED.
requireAdmin carga la identidad actual y la adjunta a request.admin con tipo compartido.

Argon2id usa 19456 KiB, dos iteraciones y paralelismo 1, sal aleatoria por hash.
Login verifica un hash señuelo si el email no existe y da el mismo error para usuario
inexistente, inactivo o password incorrecto. No se retorna passwordHash.
Passwords de login: 1–256 caracteres; nuevas cuentas de seed: 12–256.
Email normalizado a minúsculas. La API no expone creación ni edición de usuarios.

## Uso desde un cliente

Todas las mutaciones de auth/admin requieren X-BCM-Admin: 1. En un navegador,
este header exige preflight CORS. Si llega Origin, debe estar en CORS_ORIGINS;
una petición sin Origin con ese header puede usarse desde un cliente HTTP no navegador.
Esto protege login y logout también contra CSRF. Enviar JSON y usar credentials:
include. CORS permite credenciales solo para orígenes explícitos, nunca comodín.
No guardar tokens en localStorage. GET no muta datos.

SameSite=Lax requiere frontend/API del mismo sitio para peticiones autenticadas
entre orígenes. Para el futuro despliegue usar dominios propios del mismo sitio o
un proxy del mismo origen; los dominios genéricos de Vercel y Render entre sí no
satisfacen esta condición. No debilitar cookies para resolverlo sin revisar CSRF.
No se configuró ni realizó despliegue.

## Endpoints

| Método | Ruta relativa a /api/v1 | Resultado |
| --- | --- | --- |
| POST | /auth/login | 200 identidad segura + Set-Cookie |
| GET | /auth/me | 200 identidad, requiere sesión |
| POST | /auth/logout | 204 y revocación; idempotente |
| GET, POST | /admin/categories | listado / crear |
| GET, PATCH, DELETE | /admin/categories/:id | detalle / editar / borrar protegido |
| GET, POST | /admin/brands | listado / crear |
| GET, PATCH, DELETE | /admin/brands/:id | detalle / editar / borrar protegido |
| GET, POST | /admin/attributes | listado / crear definición y opciones atómicamente |
| GET, PATCH, DELETE | /admin/attributes/:id | detalle / editar definición / borrar protegido |
| GET, POST | /admin/attributes/:attributeId/options | listado / crear opción |
| GET, PATCH, DELETE | /admin/attributes/:attributeId/options/:id | detalle / editar / borrar protegido |
| GET, POST | /admin/categories/:categoryId/attributes | listado / asociar atributo |
| GET, PATCH, DELETE | /admin/categories/:categoryId/attributes/:attributeId | detalle / editar asociación / desasignar |
| GET, POST | /admin/banners | listado / crear |
| GET, PATCH, DELETE | /admin/banners/:id | detalle / editar / borrar |
| GET, PUT | /admin/settings | singleton o null / reemplazar-crearlo |
| GET, POST | /admin/products | listado / crear (Etapa 03) |
| GET, PATCH, DELETE | /admin/products/:id | detalle / editar / desactivar (Etapa 03) |

Todo /admin/* requiere sesión, incluso rutas todavía inexistentes. Creación devuelve
201; PATCH y PUT, 200; DELETE, 204. DELETE de maestros referenciados devuelve 409.
No hay PUT parcial de maestros: usar PATCH. En PATCH se validan únicamente campos
presentes y luego el registro completo resultante; los defaults de creación no
sobrescriben campos omitidos. Un PATCH vacío o con campos desconocidos se rechaza.
Settings PUT reemplaza toda la configuración editable; omisiones opcionales pasan
a null. Su GET devuelve data:null si todavía no existe, sin inventar valores.

Contratos TypeScript en packages/shared/src/index.ts. Fechas HTTP son ISO 8601 con
zona; dinero y números decimales de atributos se serializan como strings. Los DTOs
ProductAdmin contienen precios internos aunque showPrice=false y jamás deben
usarse como respuesta pública. Todos los mappers seleccionan campos explícitos.

## Inputs

- Login: email y password.
- Categoría: name, slug; opcionales description, imageUrl, parentId, active, sortOrder.
- Marca: name, slug; opcionales description, logoUrl, active.
- Definición: name, slug, dataType (TEXT/NUMBER/BOOLEAN/OPTION); unit, filterable,
  active y options opcionales. options admite hasta 100 entradas label/value/sortOrder.
  OPTION activo requiere opciones; un borrador inactivo puede completarse después.
  PATCH de definición no reemplaza opciones: usar sus endpoints específicos.
- Opción: label, value, sortOrder. attributeId proviene de la ruta; no puede cambiarse.
- Asociación: attributeId, required y sortOrder. PATCH solo required/sortOrder.
- Banner: imageUrl y placement; title, subtitle, mobileImageUrl, ctaText, ctaHref,
  active, sortOrder, startsAt y endsAt opcionales. CTA texto/URL juntos. Intervalo
  startsAt <= endsAt, incluidas fechas iguales, conforme a Etapa 02; la migración
  reemplaza el CHECK previo estricto sin modificar la migración histórica.
- Settings: siteName, defaultSeoTitle, defaultSeoDescription; campos sociales,
  heroTitle, heroSubtitle y defaultOgImageUrl opcionales. WhatsApp usa número
  internacional de 7–15 dígitos sin +/espacios y template juntos; placeholders
  productName/productUrl/sku/price. Instagram HTTPS en instagram.com o www.instagram.com.

## Paginación

page=1, pageSize=20, máximo 100; page máximo 100000. search hasta 160 caracteres.
order asc/desc (asc por defecto); desempate por UUID para orden determinista.
Filtros booleanos query aceptan literalmente true/false. Parámetros desconocidos
se rechazan. Respuesta: data:[...], meta:{page,pageSize,total,totalPages}.
Reads de filas y conteo no abren transacción; pueden diferir durante una mutación concurrente.

| Recurso | sort permitido (primero = default salvo indicado) | Filtros |
| --- | --- | --- |
| Categorías | sortOrder, name, slug, createdAt, updatedAt | active, parentId |
| Marcas | name, slug, createdAt, updatedAt | active |
| Atributos | name, slug, createdAt, updatedAt | active, dataType, filterable |
| Opciones | sortOrder, label, value, createdAt | atributo de la ruta |
| Asociaciones | sortOrder, createdAt | categoría de la ruta, required |
| Banners | sortOrder, title, createdAt, updatedAt, startsAt | active, placement |
| Productos | sortOrder, name, slug, price, createdAt, updatedAt, publishedAt | categoryId, brandId, active, availability, saleMode, featured, onSale, newArrival, showPrice |

search usa contains sin distinción de mayúsculas en nombres/slugs; productos también
SKU, banners título/subtítulo, opciones label/value y asociaciones nombre del atributo.
No hay búsquedas públicas, dashboard ni listado ilimitado.

## Reglas y transacciones

Los controllers no importan Prisma. Services coordinan repositorios y validaciones.
La unidad transaccional usa SERIALIZABLE, máximo tres intentos para P2034.
Cambios de jerarquía, edición de maestros con invariantes, creación atributo/opciones,
edición/borrado de opciones y asociaciones se validan dentro de su transacción.
Reads simples usan repositories sin transacción. Borrados simples se protegen con FKs.
Settings usa upsert atómico sobre singleton=true; no permite editar la bandera.

No se desactiva categoría con productos activos. No se desactiva un atributo usado
por valores de productos activos o requerido en una categoría con productos activos.
No se cambia tipo con valores/opciones existentes. No se cambia value de opción usada;
su label y orden son editables. No se elimina última opción de un atributo activo.
La DB protege referencias incluso de productos inactivos. Requerir un atributo nuevo
con productos activos se bloquea hasta desactivarlos/completarlos. No se borra en cascada
ningún maestro para hacer pasar una operación.

## Errores y logging

Envelopes comunes de BACKEND.md: error.code/message/details, sin SQL ni stack.
Zod devuelve VALIDATION_ERROR (400) y campos afectados sin valores de entrada.

| HTTP | Códigos |
| --- | --- |
| 400 | VALIDATION_ERROR, INVALID_JSON |
| 401 | AUTH_INVALID_CREDENTIALS, AUTH_REQUIRED |
| 403 | CSRF_REJECTED |
| 404 | NOT_FOUND, CATEGORY_NOT_FOUND, BRAND_NOT_FOUND, ATTRIBUTE_NOT_FOUND, OPTION_NOT_FOUND, ASSOCIATION_NOT_FOUND, BANNER_NOT_FOUND, PRODUCT_NOT_FOUND |
| 409 | CATEGORY_SLUG_EXISTS, BRAND_SLUG_EXISTS, ATTRIBUTE_SLUG_EXISTS, CATEGORY_IN_USE, BRAND_IN_USE, ATTRIBUTE_IN_USE, OPTION_IN_USE, ASSOCIATION_IN_USE, OPTION_ALREADY_EXISTS, ASSOCIATION_ALREADY_EXISTS, CATEGORY_CYCLE, ATTRIBUTE_TYPE_MISMATCH, ATTRIBUTE_INACTIVE, ATTRIBUTE_OPTIONS_REQUIRED, ACTIVE_PRODUCTS_EXIST, CONCURRENT_MODIFICATION |
| 413 | PAYLOAD_TOO_LARGE |
| 429 | RATE_LIMITED, con Retry-After |
| 500 | INTERNAL_ERROR, mensaje genérico |

Logging estructurado de login exitoso/fallido, logout, mutaciones exitosas y errores
internos. No serializa request, body, cookie, token, hashes, errores crudos ni URLs
privadas. No hay audit trail en DB. Helmet y límite JSON 100 KiB siguen activos.
Login permite 10 intentos/IP/15 minutos (incluye validaciones fallidas); mutaciones
admin, 120/IP/minuto. Store de rate limit en memoria por proceso; reinicios lo borran.
trust proxy=false impide confiar ciegamente en X-Forwarded-For.

## Seed de admin

En backend/.env, configurar ADMIN_EMAIL, ADMIN_PASSWORD y ADMIN_NAME juntos y
NODE_ENV=development. Password mínimo 12 caracteres. Ejecutar npm run prisma:seed
con DATABASE_URL propia y migraciones aplicadas. Sin esas variables no crea admin.
Un admin existente se conserva sin cambiar password, nombre ni actividad; no es un
comando de reset. Seed administrativo se rechaza con NODE_ENV=production.
SEED_DATA_FILE sigue siendo opcional e independiente para categorías/marcas.
No se cargan productos ni datos comerciales ficticios.

## Límites y siguiente etapa

- La única base local configurada sigue siendo test; no se configuró producción.
- Rate limiting distribuido y trust proxy requieren revisión al decidir despliegue.
- No hay rotación/reset de contraseña por HTTP ni recuperación por correo.
- Sesiones vencidas se rechazan siempre; limpieza masiva programada no implementada.
- No hay invalidación de caché pública: no existe todavía un catálogo público conectado.
  Integrarla después del commit al desarrollar la publicación pública.
- No se implementaron formularios, uploads ni dashboard. Productos POST/PATCH/DELETE
  están disponibles desde Etapa 03; DELETE desactiva.
- Las cuatro advertencias high preexistentes de Prisma siguen pendientes de revisión;
  no se usaron overrides ni audit fix --force.

Etapa 03 sugerida, solo con autorización: creación/edición/desactivación administrativa
de productos, atributos dinámicos, galería por URL, publicación y pruebas de integridad;
API y contratos primero. Mantener storefront, uploads y ecommerce fuera de ese alcance
salvo pedido explícito.

Referencias: [node-argon2](https://github.com/ranisalt/node-argon2),
[OWASP Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html),
[express-rate-limit](https://github.com/express-rate-limit/express-rate-limit).

## Validación de cierre — 20/09/2026

| Comprobación | Resultado |
| --- | --- |
| npm run lint | OK, cero errores/warnings de código |
| npm run typecheck | OK, frontend/backend/shared |
| npm test | 45/45 |
| Integración PostgreSQL real | 21/21: 11 auth/admin + 10 modelo |
| npm run build | OK, backend y frontend; páginas iniciales estáticas |
| npm run prisma:validate | OK |
| npm run prisma:generate | OK, Prisma 7.10.0 |
| Migración Etapa 02 | Aplicada en Neon test |
| Objetos en pg_catalog | 12 tablas, 33 índices, 57 restricciones esperadas presentes |
| Limpieza de fixtures | Cero filas de dominio restantes; sin reset/truncate |
| Revisión de secretos | 151 archivos de código/docs/config revisados, cero coincidencias con credenciales |
| Controllers | Cero imports de Prisma |

Total: 66 tests aprobados, 18 nuevos respecto de Etapa 01. Sin tests omitidos.
Se verificaron cookies, identidad segura, sesión compartida entre instancias, rotación,
logout/replay, expiración, usuario inactivo, seed idempotente, CRUD, referencias,
paginación/filtros, PATCH sin defaults y transacciones del modelo.

La suite se ejecutó contra TEST_DATABASE_URL, con TEST_DATABASE_ONLY=true y
DATABASE_URL vacía. Las credenciales siguen únicamente en archivos locales ignorados.
El workspace todavía no tiene .git: no existe índice Git que auditar ni se hizo commit.
No hubo cambios visuales, por lo que no correspondió QA de nuevas pantallas.

Un build diagnóstico lanzado en paralelo encontró EEXIST durante prisma generate;
la ejecución final secuencial de todos los gates terminó con código 0. Ejecutar
estos comandos secuencialmente dentro del mismo checkout, ya que regeneran el cliente.
Persisten warnings de pg sobre sslmode=require y consultas solapadas para una futura
versión mayor, además de las advertencias de dependencias previamente documentadas.
Ninguna validación requerida quedó bloqueada por el entorno. No hubo deploy ni
avance a Etapa 03.

## Soporte del panel — Etapa 04

Se agregó GET /admin/dashboard y GET /admin/categories/:categoryId/product-attributes,
ambos autenticados. GET asociaciones incluye definition para presentar nombres sin
consultas por fila; GET productos agrega categoryName, brandName y thumbnail.
El panel consume estas lecturas y las mutaciones existentes mediante proxy de mismo
origen, conservando CSRF y cookies. Ver ADMIN_UI_IMPLEMENTATION.md.

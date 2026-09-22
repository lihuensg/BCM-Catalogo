# DATABASE.md — Modelo inicial, Etapa 01

Fuente ejecutable: `backend/prisma/schema.prisma` y
`backend/prisma/migrations/202609190001_init/migration.sql`.
El SQL contiene constraints e índices parciales que no se representan en el schema.
Estado de aplicación y pruebas: [DATABASE_VALIDATION.md](DATABASE_VALIDATION.md).

## Motor y convenciones

- PostgreSQL 14 o posterior; Prisma 7.10 con adapter-pg. Sin SQLite.
- Todas las entidades tienen ID UUID nativo, generado por PostgreSQL con
  `gen_random_uuid()`. No se mezclan UUID y CUID.
- Todas tienen `createdAt` y `updatedAt`, TIMESTAMPTZ(3).
  Defaults de DB y `@updatedAt` de Prisma. SQL directo debe actualizar updatedAt
  explícitamente; no se agrega un trigger oculto.
- Borrador/inactivo por defecto; publicación explícita.
- Slugs únicos por entidad, minúsculas ASCII con guiones; máximo 180 caracteres
  en datos maestros, 220 en Product.
- SKU opcional, único cuando no es NULL, sin espacios exteriores y sensible a mayúsculas.
  Múltiples NULL son válidos.
- No hay soft-delete global, roles, pedidos, clientes ni entidades especulativas.

## Entidades y campos

Además de id/createdAt/updatedAt comunes:

| Entidad | Campos |
| --- | --- |
| AdminUser | name, email único normalizado a minúsculas, passwordHash, active |
| Category | name, slug, description?, imageUrl?, active, sortOrder, parentId? |
| Brand | name, slug, description?, logoUrl?, active |
| Product | name, slug, sku?, shortDescription, fullDescription?, categoryId, brandId?, price?, compareAtPrice?, showPrice, saleMode, availability, active, featured, onSale, newArrival, sortOrder, publishedAt?, seoTitle?, seoDescription? |
| ProductImage | productId, url, altText, isPrimary, sortOrder |
| AttributeDefinition | name, slug, dataType, unit?, filterable, active |
| AttributeOption | attributeId, dataType=OPTION, label, value, sortOrder |
| CategoryAttribute | categoryId, attributeId, required, sortOrder |
| ProductAttributeValue | productId, categoryId, attributeId, dataType, textValue?, numberValue?, booleanValue?, optionId? |
| Banner | title?, subtitle?, imageUrl, mobileImageUrl?, ctaText?, ctaHref?, placement, active, sortOrder, startsAt?, endsAt? |
| SiteSettings | singleton=true, siteName, whatsappNumber?, whatsappMessageTemplate?, instagramUrl?, heroTitle?, heroSubtitle?, defaultSeoTitle, defaultSeoDescription, defaultOgImageUrl? |

`?` indica nullable. No hay columnas específicas de tecnología o perfumería.
Los dos campos SEO opcionales de Product permiten overrides reales sobre settings,
sin inventar otro subsistema SEO.

## Enums y venta

- SaleMode: IN_STOCK, MADE_TO_ORDER.
- Availability: AVAILABLE, LOW_STOCK, OUT_OF_STOCK, CHECK_AVAILABILITY, MADE_TO_ORDER.
- AttributeDataType: TEXT, NUMBER, BOOLEAN, OPTION.
- BannerPlacement: HOME_HERO, HOME_SECONDARY, CATALOG_TOP.

SaleMode indica cómo se comercializa; availability, el estado actual.
IN_STOCK permite cualquier estado excepto MADE_TO_ORDER.
MADE_TO_ORDER permite MADE_TO_ORDER, CHECK_AVAILABILITY u OUT_OF_STOCK
(encargo disponible, a consultar o temporalmente no aceptado).
No admite AVAILABLE/LOW_STOCK porque comunicaría disponibilidad inmediata.
El CHECK de DB y la validación Zod protegen esta coherencia.

## Dinero

- price y compareAtPrice: NUMERIC(18,2), nunca Float.
- Servicios reciben cadenas decimales y convierten a Prisma.Decimal.
  Rechazan números JS, negativos, exponentes, NaN, más de 16 enteros o 2 decimales.
  Esto evita redondeos silenciosos de entradas con escala excesiva; SQL directo
  conserva el comportamiento propio de NUMERIC de PostgreSQL.
- price NULL es válido, incluso si showPrice=true; el consumidor deberá resolver
  “sin monto disponible”. showPrice=false permite monto interno.
- compareAtPrice no NULL requiere price no NULL y debe ser estrictamente mayor.
- onSale no exige porcentaje ni precio anterior. Merchandising no modifica precios.
- No se decide conversión multimoneda en esta etapa; los importes pertenecen al
  contexto monetario del catálogo que defina su configuración posterior.

## Jerarquía de categorías

parentId apunta a Category. No hay límite artificial de profundidad ni herencia
implícita de atributos. Cada producto tiene una categoría directa; subcategorías
usan la misma entidad. Los atributos se asignan explícitamente a cada categoría.
La actividad del padre no cambia automáticamente la del hijo.

DB evita autorreferencia inmediata y referencias inexistentes. El servicio de
movimiento recorre los padres y rechaza ciclos indirectos, padres inexistentes y
árboles ya cíclicos, dentro de una transacción SERIALIZABLE con hasta 3 intentos.
No usar updates directos de repository para cambiar jerarquía: SQL directo puede
violar la regla de ciclos indirectos.

## Atributos tipados e integridad referencial

ProductAttributeValue no guarda JSON. Un CHECK exige exactamente un valor no NULL
y que el campo corresponda a dataType. TEXT debe tener contenido; NUMBER usa
NUMERIC(24,6) finito y puede ser negativo; BOOLEAN admite false; OPTION exige optionId.

Los campos redundantes de integridad son deliberados y no editables por el cliente:

- ProductAttributeValue.(productId, categoryId) referencia Product.(id, categoryId).
- ProductAttributeValue.(categoryId, attributeId) referencia CategoryAttribute.
- ProductAttributeValue.(attributeId, dataType) referencia AttributeDefinition.
- ProductAttributeValue.(optionId, attributeId) referencia AttributeOption.
- AttributeOption.(attributeId, dataType) referencia AttributeDefinition y su CHECK
  exige OPTION. No pueden agregarse opciones a un atributo TEXT.

Así, PostgreSQL rechaza categorías ajenas, tipos ajenos, asociaciones inexistentes
y opciones de otra definición, incluso sin pasar por servicios.
Cambiar categoría de un producto con valores requiere retirar/reasignar esos valores
en la operación explícita transaccional de Etapa 03; la FK impide migrarlos silenciosamente.

Unique(categoryId, attributeId), unique(productId, attributeId) y
unique(attributeId, value) evitan duplicaciones. No existe selección múltiple
en OPTION; requeriría un cambio de alcance/modelo posterior.

## Publicación y reglas de servicio

createProductService valida antes de escribir:

- categoría existente; categoría activa para publicar;
- atributos pertenecientes a la categoría, activos y con tipo/opción correctos;
- atributos requeridos completos al activar o publicar; borradores pueden estar incompletos;
- precio, saleMode/availability, imágenes y valores duplicados.

publishedAt se asigna al publicar y se conserva en publicaciones repetidas.
DB exige que un producto activo tenga publishedAt.

Agregar un nuevo atributo obligatorio a una categoría con productos activos se
rechaza; primero deben desactivarse y completarse. Los futuros cambios de categoría,
actividad o atributos requeridos deben reutilizar estas validaciones y la transacción.
Las reglas entre registros (categoría activa, requeridos y ciclos indirectos) viven
en servicios, no en CHECK con consultas a otras tablas. La Etapa 02 habilita edición
protegida de maestros; ver AUTH_AND_ADMIN_API.md.

## Borrado y relaciones

| Relación | onDelete | Motivo |
| --- | --- | --- |
| Category padre → hijos | Restrict | No destruir una rama accidentalmente |
| Category → Product | Restrict | Desactivar o reasignar primero |
| Brand → Product | Restrict | La marca opcional no desaparece silenciosamente |
| Category/AttributeDefinition → CategoryAttribute | Restrict | Preservar asignaciones |
| AttributeDefinition → AttributeOption/Value | Restrict | Preservar especificaciones |
| AttributeOption → ProductAttributeValue | Restrict | No dejar valores sin opción |
| CategoryAttribute → ProductAttributeValue | Restrict | No desasignar atributos usados |
| Product → ProductImage/ProductAttributeValue | Cascade | Solo contenido propio del producto |

Todos los onUpdate de FK son Restrict. Los UUID se consideran inmutables.
Los filtros de activos no alteran las protecciones: una referencia inactiva también protege al maestro.

## Imágenes

Cero o más por producto, altText no vacío, orden no negativo.
Índice UNIQUE parcial sobre productId WHERE isPrimary=true: como máximo una principal.
La operación setPrimaryImage verifica pertenencia, limpia la anterior y marca la nueva
en una transacción serializable. Cero principales está permitido en borradores;
no se exige imagen al publicar porque la regla mínima documentada no la establece.

## Configuración, banners y administrador

SiteSettings mantiene UUID y una bandera singleton obligatoriamente true y única:
como máximo una fila, no se inventa una fila comercial inicial.
Canales sociales pueden ser NULL; WhatsApp requiere número y template juntos.
Número: formato internacional solo dígitos, 7–15, sin + ni espacios.
Template: placeholders productName, productUrl, sku, price; sin llaves desconocidas.
El renderizado del template y la protección del precio oculto son trabajo de una etapa posterior.
Instagram solo acepta HTTPS en instagram.com/www.instagram.com desde validación de aplicación.

Banner exige imagen, intervalo endsAt >= startsAt cuando ambos existen y CTA text/URL
ambos presentes o ambos ausentes. Zod permite HTTP(S) o ruta local segura para el CTA.
Fechas abiertas son válidas; no se implementa UI ni programador de publicación.

AdminUser representa el único rol ADMIN, sin RBAC. La tabla no impone un máximo de
usuarios; el alta operativa inicial será de uno. Solo recibe hash, nunca password.
Zod y CHECK rechazan texto plano obvio y admiten identificadores Argon2id/bcrypt/scrypt.
La Etapa 02 agrega Argon2id, login y sesiones server-side. El seed de desarrollo
puede crear un administrador con variables de entorno; no se inventan credenciales.

## Índices

Además de PK y unique requeridos:

- Category(parentId, active, sortOrder): hijos y navegación.
- Product(categoryId, active, sortOrder, id) y equivalente brandId: listados filtrados y FK.
- Product(active, sortOrder, id): listado principal con desempate estable.
- Product(active, availability) y (active, publishedAt, id): filtros/orden temporal.
- Tres índices parciales (sortOrder, id) WHERE active AND featured/onSale/newArrival.
  No se crean índices individuales para todos los booleanos.
- ProductImage(productId, sortOrder, id): galería y FK; índice parcial de principal única.
- CategoryAttribute(attributeId): consultas inversas y borrado protegido.
- ProductAttributeValue por asociación, número, opción y FK inversa de opción.
- Banner(placement, active, sortOrder): bloques publicados por ubicación.

Los índices compuestos únicos de id+tipo/categoría son necesarios para los targets
de FK, aunque id ya sea único. No se agrega búsqueda full-text ni índices TEXT
indiscriminadamente antes de conocer consultas y medir planes EXPLAIN.

## Seed y migraciones

Migración inicial versionada, generada sin DB desde el schema y completada con SQL
auditable. No se utilizó db push. Revisar manualmente futuras migraciones para
conservar CHECK e índices parciales.

Seed opcional de categorías raíz y marcas desde SEED_DATA_FILE, validado con Zod,
en transacción, upsert por slug y update vacío: idempotente y sin sobrescribir
datos existentes. Sin archivo no escribe nada. No crea productos, banners,
settings. La Etapa 02 permite crear el admin por variables ADMIN_EMAIL, ADMIN_PASSWORD
y ADMIN_NAME, sin modificar credenciales existentes. La carga de 20 productos es posterior.

## Ampliación Etapa 02

AdminSession persiste tokenHash SHA-256 (CHAR(64), único), adminId UUID, expiresAt,
id y timestamps. FK Cascade elimina sesiones al borrar su admin; índices por adminId
y expiresAt. La migración 202609190002_admin_sessions añade esa tabla y reemplaza
Banner_valid_interval para permitir fechas iguales conforme al alcance autorizado.
El resto del schema y las restricciones de integridad se conservan.

## Etapa 03

Sin cambios de schema ni migraciones nuevas. El dominio de producto utiliza las FKs,
CHECK e índices existentes. DELETE HTTP solo desactiva. El detalle de publicación,
atributos y galería está en [PRODUCT_DOMAIN.md](PRODUCT_DOMAIN.md).

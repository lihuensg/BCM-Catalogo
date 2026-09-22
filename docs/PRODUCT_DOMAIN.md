# Dominio de producto — Etapa 03

## Alcance y lifecycle

Backend administrativo completo de Product sobre el schema existente. Sin migración,
nuevas dependencias, storefront, formularios, storage, deploy ni seed de productos.
Un producto inactivo es un borrador o una publicación desactivada; active es la
única bandera de visibilidad, sin otro estado de archivado inventado.

POST guarda un borrador por defecto. PATCH con active=true publica o reactiva.
DELETE desactiva (active=false), conserva el registro, slug, SKU, imágenes, valores
y publishedAt. Es idempotente para un producto existente; un ID inexistente da 404.
No hay borrado físico por HTTP. Los fixtures propios se eliminan únicamente en tests.

publishedAt es de solo lectura: el servidor asigna la fecha UTC de primera activación
y la conserva tras ediciones, desactivaciones y reactivaciones. No hay programación
ni backdating. createdAt/updatedAt tampoco son editables por el cliente.

## Endpoints y contratos

Todos bajo /api/v1/admin/products, protegidos por requireAdmin, sesión y las medidas
de Etapa 02. Las mutaciones requieren X-BCM-Admin: 1 y Origin permitido si está presente.

| Método | Ruta | Respuesta |
| --- | --- | --- |
| GET | / | 200 listado reducido y meta de paginación |
| GET | /:id | 200 ProductAdminDetailDto |
| POST | / | 201 detalle creado |
| PATCH | /:id | 200 detalle resultante |
| DELETE | /:id | 204 tras desactivar, sin borrado físico |

Envelopes data/meta y error.code/message/details existentes. Params UUID y query/body
validados con Zod. Campos desconocidos, PATCH vacío y timestamps del cliente se rechazan.
Contratos compartidos: ProductCreateInput, ProductPatchInput, ProductImageInput,
ProductGalleryImageInput, ProductAttributeInput, ProductListQuery, ProductAdminDto
y ProductAdminDetailDto. No contienen Prisma ni tipos Decimal de runtime.

POST requiere name, slug, shortDescription y categoryId. Permite sku, fullDescription,
brandId, price, compareAtPrice, showPrice, saleMode, availability, active, featured,
onSale, newArrival, sortOrder, seoTitle, seoDescription, images y attributeValues.
Los valores opcionales/defaults son los del schema. Marca y precios pueden ser null.
PATCH acepta los mismos campos editables; los omitidos se conservan y null solo se
admite en campos nullable. Nunca se aplican defaults de creación a campos omitidos.

Ejemplo de borrador mínimo (reemplazar categoryId con una categoría real):

~~~json
{
  "name": "Producto",
  "slug": "producto",
  "shortDescription": "Descripción breve",
  "categoryId": "UUID-de-categoria"
}
~~~

Para activar: PATCH con {"active":true}. Para agregar una oferta explícita:
{"price":"100.00","compareAtPrice":"120.00","onSale":true}. Los ejemplos describen
inputs, no datos comerciales cargados ni productos iniciales.

## Publicación y borradores

Se mantienen las reglas ya documentadas; no se cambia el schema para relajarlas:
name/slug/shortDescription no vacíos y categoría válida son mínimos incluso en borrador.
Se permiten borradores sin precio, imágenes, marca ni atributos requeridos completos.
Un valor que sí se envía debe ser válido, aun en borrador.

Para active=true se exige categoría activa, relaciones existentes, atributos asignados
activos y todos los requeridos completos, además de precio/venta coherentes.
Toda edición de un producto activo vuelve a validar esas reglas. No se exige imagen
principal para publicar porque la regla anterior no la exigía. Tampoco se inventa
un precio cuando showPrice=true y price=null: sigue representando monto desconocido.

Un atributo desactivado puede dejar valores históricos en borradores. Para editar
ese borrador se deben corregir/retirar esos valores. DELETE siempre permite ocultar
un producto sin exigir que vuelva a cumplir las reglas de publicación.

## Precio, ofertas y disponibilidad

Entrada/salida monetaria como strings decimales; persistencia NUMERIC(18,2).
No JS floats, negativos, exponentes, NaN, infinito ni redondeo silencioso por exceso
de escala. Cero es válido. compareAtPrice requiere price y debe ser estrictamente mayor.
Si se elimina price, se debe eliminar compareAtPrice en la misma edición.

showPrice=false conserva un monto interno; price=null es desconocido. onSale no se
infiere de compareAtPrice ni modifica price. No se inventan descuentos porcentuales.
Los DTOs son exclusivamente administrativos y pueden incluir precios ocultos.
La futura API pública necesitará otro mapper que aplique showPrice.

saleMode permanece separado de availability. MADE_TO_ORDER admite MADE_TO_ORDER,
CHECK_AVAILABILITY u OUT_OF_STOCK; IN_STOCK no admite disponibilidad MADE_TO_ORDER.
featured, onSale, newArrival y sortOrder no cambian precio, disponibilidad ni actividad.

## Slug y SKU

Slug explícito, trim, minúsculas ASCII con guiones, hasta 220 caracteres. No se
autogenera ni se convierte silenciosamente a minúsculas. SKU opcional, trim, hasta
100 caracteres, sensible a mayúsculas; cadena vacía se rechaza y null elimina el SKU.
La base garantiza unicidad en concurrencia; conflictos de slug y SKU tienen códigos
separados. Se conservan reservados mientras el producto está desactivado.

## Atributos dinámicos

attributeValues es una colección completa de hasta 200 valores, discriminada por tipo:

- TEXT: attributeId, dataType, textValue no vacío.
- NUMBER: attributeId, dataType, numberValue como string decimal, NUMERIC(24,6).
- BOOLEAN: attributeId, dataType, booleanValue; false es un valor válido.
- OPTION: attributeId, dataType, optionId perteneciente a la misma definición.

No se aceptan slots de otro tipo, duplicados, definiciones inactivas, atributos ajenos
a la categoría ni opciones ajenas. Required se evalúa solo para productos activos.
Omitir attributeValues en PATCH conserva valores. Enviarlo reemplaza la colección;
[] retira todo, si las reglas de publicación lo permiten. Los IDs internos de valores
no son contrato público y pueden cambiar al reemplazar la colección.

Cambiar categoryId requiere attributeValues explícito incluso si está vacío. El admin
decide cuáles conservar/reasignar; nunca se descartan silenciosamente. Se valida todo
contra la categoría destino. Dentro de la transacción se retiran los valores anteriores,
se actualiza Product y se insertan los nuevos: esto respeta la FK compuesta restrictiva
(productId,categoryId). Cualquier fallo restaura el estado anterior completo.

## Galería por URL

Hasta 30 imágenes. url HTTP(S) sin credenciales; altText no vacío, hasta 300 caracteres;
sortOrder entero no negativo e isPrimary booleano. Las URLs no se descargan ni se
persisten archivos en el servidor. No se integra storage ni validación remota de assets.

POST images usa url/altText/isPrimary/sortOrder. PATCH images usa los mismos campos y
un id opcional: incluirlo conserva la identidad de una imagen existente del producto;
sin id se crea una nueva. IDs duplicados, inexistentes o de otro producto se rechazan.

PATCH images reemplaza la galería completa. Omitirlo conserva la galería; [] elimina
todas las imágenes propias. Reordenar implica enviar los IDs retenidos con nuevo
sortOrder. Cambiar principal implica marcar una sola isPrimary=true y las demás false.
Se ordena por sortOrder y UUID como desempate. La posición del array no define orden.

Al eliminar la principal no se promueve otra automáticamente; primaryImageId queda
null salvo que el mismo PATCH designe otra. Como máximo una principal, validada en
aplicación y con índice UNIQUE parcial en PostgreSQL.

Persistencia de galería en lote: se reemplazan filas propias dentro de la transacción,
conservando IDs y createdAt de imágenes retenidas; updatedAt refleja la edición.
Es seguro con el schema actual, sin FKs entrantes a ProductImage. Revisar esta estrategia
si una etapa posterior añade referencias externas a imágenes. Evita una escritura
remota por imagen y mantiene viable el límite de 30 dentro del timeout transaccional.

## Listados y detalle

page default 1, pageSize default 20 y máximo 100; infraestructura común de Etapa 02.
search consulta name/slug/SKU sin distinción de mayúsculas. Filtros AND: categoryId,
brandId, active, availability, saleMode, featured, onSale, newArrival, showPrice.
Booleanos en query: true/false literales, incluidos filtros false.

sort permitido: name, slug (compatibilidad Etapa 02), createdAt, updatedAt, publishedAt,
price y sortOrder; default sortOrder. order asc/desc y desempate estable por UUID.
NULL sigue el orden predeterminado PostgreSQL (ASC al final, DESC al principio).

Listado usa select explícito en Prisma: no consulta fullDescription, SEO largo,
atributos, galería ni relaciones completas. Es un cambio del contrato de Etapa 02:
fullDescription/seoTitle/seoDescription están ahora solo en detalle. El DTO de listado
incluye identificación, descripción breve, IDs de categoría/marca, precios, flags,
venta/disponibilidad y timestamps.

Detalle agrega fullDescription, SEO, categoría, marca, galería ordenada, primaryImageId,
y valores con definición resumida y opción (si aplica), sin estructuras de DB redundantes.
Reads no abren transacciones ni reutilizan el detalle pesado para el listado.
Para editar se carga un estado sin joins de definiciones/marca/categoría; desactivar
solo consulta lifecycle antes de escribir. El detalle de respuesta se obtiene al final.

## Transacciones y notificación posterior

Creación y edición comparten la validación canónica de producto y atributos.
La unidad de trabajo existente usa SERIALIZABLE y reintenta P2034 hasta tres intentos.
Product, ProductImage y ProductAttributeValue se modifican atómicamente; no se exponen
estados intermedios. Las restricciones de DB siguen protegiendo escrituras concurrentes.

createApp acepta productMutationHook y lo inyecta al dominio. Es un único callback
tipado, no un event bus. Se invoca después del commit, nunca dentro de callbacks
reintentables. Tipos: ProductPublished al activar, ProductUnpublished al desactivar,
ProductUpdated al crear borrador o editar sin transición de visibilidad.

Payload: productId, slug/previousSlug, categoryId/previousCategoryId y updatedAt.
No contiene precios ni datos privados. Permite invalidar también la URL anterior
si cambia el slug. El hook por defecto no hace nada. Un fallo se registra sin el
error crudo y no revierte DB ni convierte una mutación exitosa en error HTTP.
Una desactivación ya aplicada no escribe ni emite otro evento.

No hay cola/outbox/retry duradero todavía: un proceso caído después de commit puede
perder la notificación. El futuro consumidor debe usar I/O con timeout y obtener el
estado vigente; eventos concurrentes pueden recibirse fuera de orden. Esta limitación
es explícita hasta implementar revalidación en la etapa autorizada para caché.

## Errores

Se conserva el formato global. Sin SQL, stack, cookies, passwordHash ni credenciales.

| HTTP | Código | Motivo |
| --- | --- | --- |
| 404 | PRODUCT_NOT_FOUND | ID inexistente |
| 409 | PRODUCT_SLUG_EXISTS / PRODUCT_SKU_EXISTS | Conflicto único |
| 409 | PRODUCT_CONFLICT / CONCURRENT_MODIFICATION | Otro conflicto único / concurrencia agotada |
| 400 | PRODUCT_CATEGORY_INVALID | Categoría inválida/inexistente |
| 400 | PRODUCT_BRAND_INVALID / PRODUCT_RELATION_INVALID | Marca o relación inválida |
| 400 | PRODUCT_ATTRIBUTE_INVALID | Tipo, opción, asignación o cambio de categoría inválido |
| 400 | PRODUCT_ATTRIBUTE_REQUIRED | Falta requerido al publicar |
| 400 | PRODUCT_IMAGE_INVALID | URL, IDs, principal o galería inválidos |
| 400 | PRODUCT_PRICE_INVALID | Monto o comparación inválidos |
| 400 | PRODUCT_NOT_PUBLISHABLE | Categoría inactiva |
| 400 | VALIDATION_ERROR | Otros campos, params o query inválidos |
| 401/403/429 | AUTH_REQUIRED / CSRF_REJECTED / RATE_LIMITED | Protecciones existentes |

## Límites y próxima etapa

Se mantiene Neon exclusivamente como test y DATABASE_URL de desarrollo vacía.
No se crea una cuenta ni conexión productiva. Siguen las advertencias previas de
Prisma/pg. No hay bloqueo optimista por versión/ETag: el último PATCH de colección
confirmado reemplaza esa colección; el futuro formulario debe enviar el estado revisado.

Etapa 04 sugerida, únicamente con autorización: interfaz administrativa inicial de
login y gestión de productos sobre estos contratos, con atributos por categoría,
galería por URL, confirmación de desactivación y QA desktop/mobile. Mantener storefront,
storage, carga final de productos y deploy fuera de alcance salvo pedido explícito.

## Validación de cierre — 2026-09-21

- npm run lint y npm run typecheck: aprobados.
- npm test: 53/53 aprobados, sin omisiones.
- Integración real sobre Neon de test: 30/30 aprobados, sin omisiones.
- Total: 83 pruebas; 17 nuevas (8 locales y 9 de integración).
- npm run build: builds de shared, backend y frontend aprobados.
- npm run prisma:validate y npm run prisma:generate: aprobados.
- Inspección de PostgreSQL: 12 tablas, 33 índices y 57 restricciones esperadas;
  enums y montos NUMERIC verificados; ambas migraciones aplicadas.
- Limpieza de fixtures verificada: cero filas de dominio restantes en la base de test.
- Revisión de 158 archivos fuente/documentación/configuración: sin coincidencias
  con las credenciales de conexión locales y sin imports de Prisma en controllers.
  Los archivos .env están excluidos por .gitignore; no existe repositorio Git
  inicializado, por lo que no se pudo revisar un índice de archivos versionados.
- Auth/CSRF de mutaciones, DTOs explícitos, rollback y listado reducido cubiertos
  por pruebas. No hubo cambios visuales que requieran QA desktop/mobile.

No quedaron validaciones bloqueadas. Persisten advertencias previas de dependencias
y del driver pg (semántica futura de sslmode y consultas concurrentes sobre un
cliente); no fallaron las pruebas. No se actualizaron dependencias, schema ni
migraciones en esta etapa. La notificación no es durable y no tiene consumidor
de caché todavía, según el alcance acordado.

## Proyección administrativa de Etapa 04

El listado agrega categoryName, brandName y thumbnail (URL/alt de la principal, o
null). Selección limitada a una imagen; no trae galería completa ni atributos.
ProductAdminListDto es exclusivo del listado; los inputs y detalle no cambian.

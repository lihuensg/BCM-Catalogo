# Etapa 01 — validación del modelo

## Resultado y límite de la entrega

Schema inicial de once entidades implementado, cliente generado, migración SQL
versionada y servicios/repositories mínimos preparados. **Migración aplicada y
PostgreSQL real verificado en Neon el 19/09/2026**: diez pruebas de integración
aprobadas, sin omisiones. No se usó db push, reset ni otra base provisionada.

Por autorización explícita del usuario, la conexión suministrada se dedica ahora
exclusivamente a test: TEST_DATABASE_URL y TEST_DATABASE_ONLY=true en
backend/.env.test; DATABASE_URL vacía en backend/.env. Los archivos están ignorados
y no se reproducen credenciales en esta documentación. La aplicación no tiene
todavía una conexión de desarrollo. No se inició la siguiente etapa.

## Auditoría y decisiones

- Se preservaron las once entidades previstas y Product genérico.
- UUID nativos y timestamps en todas las tablas; precios Decimal(18,2), atributos
  numéricos Decimal(24,6).
- Se añadieron solo seoTitle/seoDescription opcionales, timestamps faltantes y
  campos auxiliares necesarios para FKs compuestas/singleton.
- categoryId/dataType redundantes en valores impiden inconsistencias entre tablas;
  la pertenencia de una opción se garantiza con FK (optionId, attributeId).
- Atributos directos por categoría, sin herencia implícita del padre.
- SaleMode y Availability separados con combinaciones coherentes verificadas.
- Cero/NULL precios permitidos; compareAtPrice requiere precio y comparación estricta.
- Required se valida al activar/publicar, no al guardar un borrador.
- Datos maestros protegidos con Restrict. Cascade solo en imágenes/valores propios.
- Índice parcial de imagen principal única y tres índices parciales de merchandising.
- Singleton de settings sin valores comerciales ficticios. Canales sociales opcionales.
- No hay hash generado, administrador insertado, login, CRUD HTTP, UI ni seed de productos.
- No se agregaron dependencias ni se cambiaron versiones del stack.

Detalles de entidades, relaciones, enums, índices y límites: [DATABASE.md](DATABASE.md).

## Migración

Archivo:
`backend/prisma/migrations/202609190001_init/migration.sql`.

Generación ejecutada desde backend, sin conexión:

```sh
node ../node_modules/prisma/build/index.js migrate diff --from-empty --to-schema prisma/schema.prisma --script --output prisma/migrations/202609190001_init/migration.sql
```

La salida generada se completó con CHECK e índices parciales PostgreSQL, con nombres
explícitos y comentarios. migration_lock.toml fija provider postgresql.
Se ejecutó migrate deploy y migrate status: migración aplicada y estado actualizado.
La inspección de pg_catalog verificó los objetos nombrados en el SQL: once tablas,
treinta índices y cincuenta y cuatro restricciones; también los cuatro enums y sus
valores, y ambas columnas monetarias NUMERIC(18,2). La suite comprobó las reglas
de integridad sobre PostgreSQL, incluida una transacción que escribe una categoría,
falla por FK al insertar el producto y revierte ambas escrituras.

## Validaciones ejecutadas

| Gate | Estado |
| --- | --- |
| Lint | OK, cero errores/warnings de código |
| Typecheck raíz (tres workspaces) | OK |
| Tests unitarios/API | OK, 38: 5 previos + 28 de modelo + 5 de guardia de DB |
| Build backend | OK |
| Build frontend | OK, sin cambios funcionales/frontend |
| Prisma validate | OK |
| Prisma generate | OK, cliente 7.10.0 |
| Seed CLI con JSON estructural | OK, dos ejecuciones, mismos IDs/updatedAt, sin duplicados ni productos nuevos |
| Tests PostgreSQL | OK, 10/10 contra Neon, sin omisiones |
| Aplicación de migración | OK, deploy y status; objetos verificados en pg_catalog |
| UI QA nueva | No aplica: no se modificaron pantallas ni estilos |

Typecheck, lint y los tests se repitieron después de corregir nullables compatibles
con exactOptionalPropertyTypes y validación de URL inválida sin excepciones sin tratar.
La revisión de tipos generados detectó que el nested-create de valores debe recibir
categoryId desde la relación del producto, no como argumento extra.

## Pruebas agregadas

`backend/tests/model.test.ts`: exactitud Decimal; rechazo de floats/exceso de escala;
precio desconocido e interno; compare-at; saleMode/availability; producto genérico;
categoría obligatoria/brand opcional; slugs/SKU; principal única en input; slots
tipados y false/cero; atributos requeridos/asignados/activos; opciones ajenas;
publicación; ciclos; banners; settings/placeholders; hashes frente a texto plano;
seed estructural y URLs sin filtración de credenciales.

`backend/tests/integration/catalog.test.ts`: diez pruebas ejecutadas para crear y
consultar producto con categoría, marca, dos imágenes y los cuatro tipos de atributos;
unicidad de slug/SKU; constraints de dinero; publicación y rollback; FKs compuestas;
borrado protegido; principal única bajo concurrencia; ciclos concurrentes;
singleton/banners/admin; seed idempotente. Se crean fixtures con prefijo UUID
y se borran únicamente registros propios; no hay truncate/reset.

Las assertions se ejecutaron contra Neon. El primer intento terminó por timeout
de conexión antes de las assertions; la repetición completa aprobó los diez casos.
No se aumentaron timeouts ni se ocultaron fallos. La comprobación CLI adicional del
seed creó una categoría/marca temporal y comprobó conteos, IDs y updatedAt tras
cada ejecución; eliminó exclusivamente esos fixtures al finalizar.

## Repetir la comprobación real

1. Mantener la base actual dedicada a test, con DATABASE_URL vacía y
   TEST_DATABASE_ONLY=true; o configurar conexiones separadas de desarrollo/test.
2. Configurar TEST_DATABASE_URL en backend/.env.test.
   Los ejemplos no contienen credenciales. No usar una base de producción.
3. Desde la raíz:

```sh
npm run prisma:test:migrate
npm run test:integration
```

El primer comando solo aplica migraciones de DB; no despliega la aplicación.
Las bases deben existir y el usuario debe contar con permisos DDL.
No se necesitan shadow DB ni reset para aplicar esta migración ya versionada.
Para nuevas migraciones en desarrollo, prisma:migrate usa migrate dev y requerirá
los permisos de shadow database correspondientes.

El seed es opcional: configurar SEED_DATA_FILE y ejecutar npm run prisma:seed
solo si se desean categorías raíz/marcas propias. El comando usa DATABASE_URL:
para comprobarlo en test se proporcionó TEST_DATABASE_URL únicamente al proceso
del seed, sin persistirla como conexión de desarrollo. Su idempotencia real quedó
verificada tanto en integración como mediante dos ejecuciones de la CLI.

## Deuda técnica y riesgos explícitos

- No se midieron planes de consulta con volumen productivo ni carga sostenida.
  Las pruebas funcionales reales no equivalen a certificación de producción.
- Se observaron advertencias del driver pg sobre semántica futura de sslmode=require
  y consultas solapadas en una conexión (deprecación para pg 9). No hubo fallos en
  la suite final; no se cambió TLS ni se actualizaron dependencias en este cierre.
- Antes de usar la base como producción, retirar su conexión de test y configurar
  otra base para integración. No se ejecutó ni se programó una limpieza general.
- Reglas entre filas (ciclos indirectos, categoría activa, atributos requeridos)
  dependen de servicios SERIALIZABLE. Futuras mutaciones deben pasar por ellos;
  escrituras SQL administrativas pueden violar estas reglas.
- Los resultados internos contienen campos privados/precios ocultos. Crear mappers
  y autorización antes de abrir endpoints.
- Formato de hash no reemplaza hashing seguro. Autenticación todavía no existe.
- Índices parciales/CHECK requieren revisión manual en futuras migraciones.
- Se mantienen las advertencias históricas de Prisma/ESLint de Etapa 00.
  No se ejecutó una nueva auditoría de dependencias ni se aplicaron overrides.
- No hay datos de negocio iniciales ni 20 productos cargados.

## Recomendación para Etapa 02

La comprobación funcional real de esta etapa está completa. Después, previa autorización:
autenticación administrativa (hashing seguro, cookies/sesiones, rate limit) y
API protegida mínima sobre estos servicios, con mappers públicos que respeten
showPrice y pruebas de permisos. Mantener UI y seed completo en su alcance autorizado.

Referencias técnicas consultadas:
[Prisma CLI](https://docs.prisma.io/docs/orm/reference/prisma-cli-reference) y
[constraints PostgreSQL](https://www.postgresql.org/docs/18/ddl-constraints.html).

# TESTING.md

## Objetivo
Proteger reglas de negocio, contratos y journeys críticos.

## Backend
### Unit
Services:
- precio visible/oculto;
- por encargo;
- flags;
- placeholders WhatsApp;
- validación publicación.

### Integration
Con DB de test:
- repositorios;
- filtros combinados;
- paginación;
- relaciones;
- constraints;
- transacciones.

### API
- auth;
- permisos;
- 400/401/404/409;
- CRUD admin;
- respuestas públicas.

## Frontend
- componentes críticos;
- PriceDisplay;
- AvailabilityBadge;
- ProductCard;
- filtros;
- formularios admin.

## E2E
Journeys:
1. cliente abre home -> catálogo -> filtra -> producto -> WhatsApp.
2. producto sin precio -> nunca expone monto.
3. admin login -> crea -> publica -> aparece públicamente.
4. admin edita -> revalidación.
5. admin desactiva -> deja de aparecer.
6. error backend -> storefront cacheado sigue utilizable.

## Gates
Antes de merge/entrega:
- lint;
- typecheck;
- tests;
- build.

## Configuración de integración — Etapa 01

`npm run prisma:test:migrate` aplica la migración versionada a TEST_DATABASE_URL;
`npm run test:integration` ejecuta las pruebas reales de persistencia y API admin
(30 casos al cierre de Etapa 03).
Ambos cargan backend/.env.test y verifican la separación respecto de DATABASE_URL.
Cambiar schema, credenciales u opciones TLS no convierte una base en otra;
los endpoints Neon pooled/directos se consideran la misma base.

El modo explícito TEST_DATABASE_ONLY=true permite dedicar la única conexión a
pruebas cuando DATABASE_URL está vacía. No permite ignorar una colisión si hay
conexión de desarrollo. Es la configuración local autorizada para este cierre.
Los fixtures usan un prefijo UUID y solo se eliminan sus registros propios.
No hay truncate, reset ni limpieza general. Nunca configurar una base productiva.

## Etapa 02

La suite local añade auth/HTTP, hashing, rate limit, CSRF y PATCH sin defaults
implícitos. backend/tests/integration/admin.test.ts verifica auth real, sesiones,
seed admin y CRUD sobre Neon. El runner usa --test-concurrency=1 para que archivos
que prueban el singleton no compitan entre sí. La concurrencia explícita dentro de
los tests del modelo se conserva.

No se sobrescriben settings existentes: el test exige que la base dedicada no tenga
una configuración comercial. Limpieza únicamente de fixtures propios y sesiones
del administrador temporal por FK Cascade. No se necesita una cuenta operativa.

## Etapa 03

53 pruebas locales y 30 de integración real: 83 en total, sin omisiones. Se añaden
8 casos en backend/tests/product-domain.test.ts y 9 en
backend/tests/integration/products.test.ts. Cubren contratos, autorización/CSRF,
precios, publicación, atributos tipados y requeridos, cambio de categoría, galería
con identidad estable, filtros, conflictos únicos reales, rollback, desactivación
e invocación posterior al commit. Un fallo del hook no revierte la escritura.

Ejecutar lint, typecheck, tests y builds secuencialmente: los prehooks de Prisma
escriben el mismo cliente generado. No ejecutar estos gates en paralelo.

## Panel — Etapa 04

npm run test:frontend prueba modelos de formulario, precios exactos, atributos,
settings, query params, cliente HTTP y política de seguridad/límite del proxy.
npm run test:e2e usa Playwright y API/Neon reales con fixtures propios: login,
protección, producto, maestros, settings y QA de 360/430/768/1366/1920 px.
No ejecutarlo junto con test:integration. Ver ADMIN_UI_IMPLEMENTATION.md para
puertos, limpieza limitada a fixtures, capturas y recuperación tras interrupción.

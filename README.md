# Catálogo BCM

Monorepo npm workspaces. Etapa 00: base de aplicaciones. Etapa 01: modelo de datos.
Etapa 02: autenticación y API administrativa con sesiones persistidas.
Etapa 03: dominio y CRUD administrativo de productos.
Etapa 04: panel administrador conectado a API real. Sin deploy ni ecommerce.

## Requisitos e instalación

Node.js 24.x, npm 11.x y PostgreSQL 14+ para operaciones reales de DB.
En PowerShell usar npm.cmd si la política bloquea npm.ps1.

Desde la raíz:

```sh
npm ci
npm run build:shared
npm run prisma:generate
```

Copiar configuraciones sin subir secretos:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
Copy-Item backend/.env.test.example backend/.env.test
```

Completar DATABASE_URL con la conexión propia en backend/.env.
Completar TEST_DATABASE_URL únicamente con una DB de test dedicada en backend/.env.test.
No se inventan credenciales ni se usa DATABASE_URL como fallback de integración.
Si la única base disponible se dedica exclusivamente a pruebas, dejar DATABASE_URL
vacía y configurar TEST_DATABASE_ONLY=true en backend/.env.test. Esa es la
configuración local actual, autorizada por el usuario. Si hay conexión de desarrollo,
la guardia sigue exigiendo otra base, incluso con ese flag. Reconoce como idénticas
las conexiones Neon pooled/directas y no acepta cambiar solo credenciales o schema.
Antes de reutilizar esa base para producción, retirar su conexión de test y configurar
otra base dedicada para las pruebas. No ejecutar pruebas sobre producción.

## Desarrollo local

Dos terminales desde la raíz:

```sh
npm run dev:backend
npm run dev:frontend
```

Frontend: http://localhost:3000. Panel admin: http://localhost:3000/admin (login en /admin/login).
Health: http://127.0.0.1:4100/api/v1/health.
Health y el shell público funcionan sin PostgreSQL; no son readiness de DB.
El panel requiere la API disponible y una sesión/DB operativa.
HOST y PORT son configurables. CORS_ORIGINS contiene orígenes permitidos separados
por coma, sin barra final. API_BASE_URL solo se usa en servidor frontend.
La API administrativa ya tiene autenticación y CRUD de maestros y productos. El frontend incluye
login, dashboard y gestión de productos, maestros, banners y configuración.
Ver docs/ADMIN_UI_IMPLEMENTATION.md y docs/AUTH_AND_ADMIN_API.md.

## Prisma y migración inicial

```sh
npm run prisma:validate
npm run prisma:generate
npm run prisma:deploy
npm run prisma:status
npm run prisma:studio
```

prisma:deploy aplica las migraciones ya versionadas a DATABASE_URL; no despliega
aplicaciones. Necesita conexión válida y permisos DDL. No ejecuta seed.
La migración inicial está en backend/prisma/migrations/202609190001_init/migration.sql.
No usar db push ni reset. Para cambios posteriores autorizados:

```sh
npm run prisma:migrate -- --name nombre_del_cambio
```

Las migraciones inicial y de sesiones fueron aplicadas a Neon PostgreSQL en la base
dedicada a test. Con la configuración local actual usar prisma:test:migrate para
esa base; prisma:deploy requiere configurar una conexión de desarrollo aparte.
El schema completo también se valida y genera cliente sin DB. Ver docs/DATABASE.md.

## Seed estructural opcional

```sh
npm run prisma:seed
```

Sin SEED_DATA_FILE ni variables ADMIN_*, informa que no hay datos y no escribe. Para poblar categorías
raíz y marcas propias, preparar un JSON con arrays categories y brands (ejemplo
de forma en backend/prisma/seed.example.json), configurar SEED_DATA_FILE en backend/.env
con su ruta relativa a backend, aplicar antes la migración y ejecutar el comando.
Cada elemento requiere name y slug y acepta los campos del schema de su módulo.
El upsert por slug agrega faltantes y preserva datos existentes. No hay 20 productos,
settings comerciales ni cuentas inventadas. Para crear el administrador de desarrollo,
configurar ADMIN_EMAIL, ADMIN_PASSWORD (mínimo 12 caracteres) y ADMIN_NAME en
backend/.env y ejecutar el mismo comando con DATABASE_URL propia. La contraseña
se hashea con Argon2id. El seed preserva usuarios existentes y se bloquea en producción.

## Validaciones y builds

```sh
npm run lint
npm run typecheck
npm test
npm run test:frontend
npm run build:backend
npm run build:frontend
npm run build
```

Los scripts backend regeneran el cliente antes de dev, typecheck, tests y build.
Typecheck frontend genera tipos de rutas Next. Los tests normales no necesitan DB.

Integración real, después de completar backend/.env.test:

```sh
npm run prisma:test:migrate
npm run test:integration
```

La suite falla explícitamente si falta TEST_DATABASE_URL. No se presenta como pasada
ni se omite silenciosamente. Crea fixtures con prefijo UUID, prueba servicios,
constraints y concurrencia, y limpia únicamente sus registros; no trunca tablas.
Utilizar una base dedicada sin tráfico concurrente ajeno.

Ejecutar los builds:

```sh
npm run start --workspace @bcm/backend
npm run start --workspace @bcm/frontend
```

## Estructura

```text
frontend/                 Shell público y panel admin real (Etapa 04)
backend/
  prisma/                 Schema, migración inicial y entrada seed
  scripts/                Entorno y migración de test dedicados
  src/
    config/               Entorno y validación segura de URL de DB
    infrastructure/       Cliente Prisma, unidad transaccional, seed y storage
    modules/
      health/             Liveness público
      categories/         CRUD admin y jerarquía protegida
      brands/             CRUD admin
      attributes/         CRUD de definiciones, opciones y asociaciones
      products/           CRUD admin, publicación, atributos y galería transaccionales
      auth/               Argon2id, login/me/logout, sesiones persistidas
      banners/ settings/  CRUD de banners y singleton de configuración
    shared/               Validadores backend y errores de dominio
  tests/                  Unitarios/API e integración PostgreSQL separada
packages/shared/          DTOs y contratos auth/admin, sin Prisma
```

Los mappers administrativos seleccionan campos explícitos y serializan Decimal como
string. Solo un admin autenticado puede consultar precios internos; los futuros
mappers públicos deberán ocultarlos con showPrice=false. Nunca retornar passwordHash.
El público sigue siendo estático y no depende del arranque de Render.
El logo original permanece intacto. Esta carpeta aún no tiene Git inicializado.

## Estado y siguiente etapa

Leer AGENTS.md antes de trabajar. Consultar:

- [Panel administrador de Etapa 04](docs/ADMIN_UI_IMPLEMENTATION.md).
- [Dominio de productos de Etapa 03](docs/PRODUCT_DOMAIN.md).
- [Auth y API administrativa de Etapa 02](docs/AUTH_AND_ADMIN_API.md).
- [Modelo y decisiones](docs/DATABASE.md).
- [Validaciones y pendientes de Etapa 01](docs/DATABASE_VALIDATION.md).
- [Informe histórico de Etapa 00](docs/INITIALIZATION_VALIDATION.md).

Hay advertencias previas de dependencias Prisma/ESLint documentadas; no se cambiaron
versiones en Etapa 01 ni se declara el proyecto listo para desplegar.

Etapa 02: sesiones persistidas, requireAdmin, CSRF, rate limit y CRUD de categorías,
marcas, atributos/opciones/asociaciones, banners y settings. Etapa 03 añade POST,
PATCH y DELETE de productos (desactivación), manteniendo GET de listado y detalle.
La base configurada sigue siendo test; DATABASE_URL de desarrollo está vacía.
Los clientes HTTP deben enviar X-BCM-Admin: 1 en mutaciones y conservar la cookie.

La Etapa 04 implementa el panel visual. La siguiente etapa requiere autorización;
no se inicia el storefront, storage ni deploy de forma automática.

Validación Etapa 03: 83 tests aprobados (53 locales + 30 integración Neon), lint,
typecheck, builds de ambos proyectos y Prisma validate/generate OK. Ejecutar gates
secuencialmente en este checkout para evitar generaciones simultáneas de Prisma.

## Pruebas de navegador del panel

~~~sh
npm exec --workspace @bcm/frontend -- playwright install chromium
npm run test:e2e
~~~

E2E usa exclusivamente TEST_DATABASE_URL y levanta frontend/API locales en puertos
3100/4200. Crea un administrador temporal, fixtures propios y los limpia al finalizar.
No correr en paralelo con integración (ambos prueban settings). Capturas y datos
temporales se guardan únicamente en artifacts/ ignorado. No hay credenciales de
acceso operativas predefinidas: usar el seed documentado con una DB de desarrollo.

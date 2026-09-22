# BACKEND.md

## Objetivo
Backend tradicional, portable y mantenible.

## API
Base:
`/api/v1`

Formato de éxito:
```json
{
  "data": {},
  "meta": {}
}
```

Formato de error:
```json
{
  "error": {
    "code": "PRODUCT_NOT_FOUND",
    "message": "Producto no encontrado",
    "details": {}
  }
}
```

No devolver stack traces al cliente.

## Capas
### Controller
Responsable de:
- parámetros HTTP;
- auth contextual;
- invocar service;
- mapear respuesta HTTP.

Prohibido:
- Prisma;
- queries;
- reglas de negocio importantes.

### Service
Responsable de:
- reglas;
- autorización de negocio;
- transacciones;
- coordinación entre repositorios;
- eventos/revalidación posterior a mutaciones.

### Repository
Responsable solo de persistencia.

### Schema
Zod:
- params;
- query;
- body;
- contratos.

## Endpoints iniciales
### Público
- `GET /api/v1/products`
- `GET /api/v1/products/:slug`
- `GET /api/v1/categories`
- `GET /api/v1/categories/:slug`
- `GET /api/v1/brands`
- `GET /api/v1/brands/:slug`
- `GET /api/v1/settings/public`
- `GET /api/v1/banners/active`

### Admin
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- CRUD `/api/v1/admin/products`
- CRUD `/api/v1/admin/categories`
- CRUD `/api/v1/admin/brands`
- CRUD `/api/v1/admin/attributes`
- CRUD `/api/v1/admin/banners`
- GET/PUT `/api/v1/admin/settings`
- dashboard `/api/v1/admin/dashboard`

## Listados
Soportar:
- paginación;
- búsqueda;
- filtros;
- ordenamiento;
- whitelist de campos de sort;
- límites máximos razonables.

Evitar endpoints tipo `?limit=10000`.

## Seguridad
- auth admin en cookie HttpOnly/Secure/SameSite apropiado preferentemente;
- rate limit en login y mutaciones sensibles;
- hashing de password seguro;
- CORS por allowlist;
- Helmet;
- validación estricta;
- logs sin secretos.

## Mutaciones
Después de mutación que afecte catálogo público:
1. commit DB;
2. disparar invalidación/revalidación;
3. si revalidación falla, NO revertir el producto ya guardado;
4. registrar fallo para retry/diagnóstico.

El catálogo público conserva la última versión válida hasta poder regenerarse.


## Implementación disponible — Etapa 02

Health continúa público. Auth y CRUD administrativos están implementados según
[AUTH_AND_ADMIN_API.md](AUTH_AND_ADMIN_API.md). En Etapa 02, productos tenía únicamente listado/detalle
administrativo; los endpoints públicos y dashboard de arriba siguen pendientes.

Controllers usan services y mappers, nunca Prisma. Listados comparten paginación
con límites y whitelist. Middleware central requireAdmin cubre /admin/*; errores
Zod y de dominio usan el envelope común. La unidad transaccional preserva reglas
de publicación y jerarquía. Los precios internos solo se devuelven al administrador.

La revalidación descrita arriba sigue siendo un requisito para la futura integración
del catálogo público: todavía no hay un consumidor/cache conectado.

## Etapa 03 — dominio de producto

La API de productos incluye GET listado/detalle, POST, PATCH y DELETE como
desactivación reversible. Edición de galería y atributos por conjuntos explícitos,
publicación validada y notificación después del commit. Sin nuevas pantallas ni
storage. Reglas, contratos, límites y errores: [PRODUCT_DOMAIN.md](PRODUCT_DOMAIN.md).

## Lecturas de soporte — Etapa 04

Dashboard agregado autenticado, definiciones activas para formularios y proyección
reducida de miniatura/nombres en listado de productos. Sin cambios de schema ni
mutaciones. Ver [ADMIN_UI_IMPLEMENTATION.md](ADMIN_UI_IMPLEMENTATION.md).

# ARCHITECTURE.md — Arquitectura canónica

## Stack
### Frontend
- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Untitled UI como referencia/componente base
- shadcn/ui solo cuando aporte un componente o patrón no cubierto adecuadamente
- Zod para contratos/validaciones compartidas cuando aplique

### Backend
- Node.js
- Express
- TypeScript
- Zod
- Prisma ORM
- API REST versionada: `/api/v1`

### Datos
- PostgreSQL
- Neon en entorno desplegado

### Assets
- Abstracción de storage.
- Durante desarrollo puede existir implementación local controlada.
- Producción debe usar object storage/CDN compatible.
- Nunca depender del filesystem efímero de Render.

## Monorepo
Estructura objetivo:

```text
BCM/
├── logo.jpg
├── AGENTS.md
├── README.md
├── docs/
├── prompts/
├── apps/
│   ├── public/
│   └── admin/
├── backend/
└── packages/
    └── shared/
```

No introducir Turborepo/Nx salvo necesidad real. Mantener setup simple.

## Frontends independientes
```text
apps/public/   Next.js público, SEO, catálogo y revalidación
apps/admin/    Next.js privado, BFF de sesión y panel de gestión
```

Las aplicaciones compilan y se despliegan por separado. `apps/public` no contiene
rutas, componentes ni servicios administrativos. `apps/admin` expone sus pantallas
desde `/`, `/login`, `/productos`, `/categorias`, `/marcas`, `/atributos`, `/banners`
y `/configuracion`; el prefijo `/admin` continúa existiendo únicamente en la API.

Ambas consumen contratos de `packages/shared`. No existe un paquete UI compartido:
la presentación es propia de cada bundle y no justifica otra capa de acoplamiento.

## Backend
```text
backend/src/
├── app.ts
├── server.ts
├── config/
├── modules/
│   ├── auth/
│   ├── products/
│   ├── categories/
│   ├── brands/
│   ├── attributes/
│   ├── banners/
│   └── settings/
├── middleware/
├── shared/
└── infrastructure/
    ├── prisma/
    └── storage/
```

Cada módulo backend:
```text
module/
├── controller.ts
├── service.ts
├── repository.ts
├── schema.ts
├── mapper.ts
├── routes.ts
└── types.ts
```

## Dependencias entre capas
```text
HTTP
 ↓
Route
 ↓
Controller
 ↓
Service
 ↓
Repository
 ↓
Prisma
 ↓
PostgreSQL
```

Reglas:
- controller no conoce Prisma;
- repository no contiene decisiones de negocio;
- service no conoce detalles HTTP;
- frontend no conoce Prisma;
- frontend consume contratos HTTP;
- tipos compartidos no importan dependencias de runtime innecesarias.

## Estrategia pública
El catálogo es **cache-first**.

La navegación pública debe servir la última versión válida desde cache/CDN/ISR siempre que sea posible.

El backend de Render participa en:
- administración;
- mutaciones;
- autenticación;
- consultas dinámicas no cubiertas por cache;
- invalidación/revalidación.

No debe ser requisito que Render esté despierto para que un visitante pueda ver el catálogo ya publicado.

## Portabilidad
No acoplar dominio a Neon, Render o Vercel.
- PostgreSQL debe poder migrarse a otro proveedor.
- Storage debe exponerse mediante interfaz.
- Revalidación debe encapsularse.
- Variables de entorno deben contener URLs y secretos.

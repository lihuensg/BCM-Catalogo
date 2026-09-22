# CACHE_AND_DEPLOYMENT.md

## Objetivo
El visitante no debe esperar el cold start de Render para ver el catálogo ya publicado.

## Infraestructura objetivo
- Frontend: Vercel o Netlify.
- Backend: Render.
- DB: Neon PostgreSQL.
- Assets: object storage/CDN.

## Restricción conocida
Render Free puede suspender el web service por inactividad. Por eso el storefront no se diseña como SPA que solicita todo el catálogo a Render en cada visita.

## Estrategia
### Lectura pública
Preferir:
- SSG/ISR;
- cache del framework/CDN;
- páginas pre-renderizadas;
- revalidación por tags/rutas o mecanismo equivalente.

### Mutación admin
```text
Admin guarda
  -> Render API
  -> PostgreSQL commit
  -> evento/invocación de revalidación
  -> frontend invalida rutas/tags afectadas
  -> siguiente regeneración actualiza cache
```

## Regla crítica
Si Render está dormido:
- Home debe abrir.
- Catálogo debe abrir.
- Producto cacheado debe abrir.
- Categorías cacheadas deben abrir.
- La última versión publicada sigue visible.

Lo que sí puede esperar cold start:
- login admin;
- guardar producto;
- editar settings;
- operaciones no cacheadas.

## Fallback
Nunca reemplazar catálogo cacheado válido por una pantalla vacía porque una revalidación falló.

Mantener stale validado hasta obtener nueva versión.

## Invalidación mínima
Al modificar producto:
- producto por slug;
- catálogo;
- categoría;
- marca;
- home si featured/onSale/new;
- listados especiales correspondientes.

Al modificar categoría/marca:
- páginas relacionadas;
- navegación si aplica.

Al modificar settings/banner:
- home/layout correspondiente.

## Desarrollo local
No depender del cache para ocultar bugs.
Debe existir modo de desarrollo donde la fuente sea backend real.

## Deploy
No implementar hasta que:
- frontend local estable;
- backend local estable;
- migrations;
- seed;
- tests;
- documentación actualizada.

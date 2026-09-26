# FRONTEND.md

## Aplicaciones

- `apps/public`: storefront en `http://localhost:3000` y futuro `https://catalogo.bcm.com.ar`.
- `apps/admin`: gestión en `http://localhost:3001` y futuro `https://gestion.bcm.com.ar`.

El público no contiene código administrativo. El admin usa un route handler BFF en
`/api/admin-proxy/*` para conservar la sesión HttpOnly como cookie host-only del
dominio de gestión. Los endpoints reales del backend conservan `/api/v1/admin/*`.

## Objetivos
- excelente UX pública;
- excelente ergonomía admin;
- carga rápida;
- SEO indexable;
- responsive real;
- accesibilidad;
- consistencia.

## Reglas de implementación
- App Router.
- Server Components por defecto cuando aporten valor.
- `use client` solo cuando exista interacción/estado que lo requiera.
- No hacer fetch de dominio directamente dentro de componentes puramente visuales.
- Encapsular acceso HTTP en `services/`.
- Queries/mutaciones reutilizables en capa feature/hook cuando corresponda.
- No duplicar formateadores de moneda, precio, disponibilidad o URLs.
- No hardcodear configuración comercial.
- No exponer secretos mediante variables `NEXT_PUBLIC_*`.

## Estados obligatorios
Todo módulo asíncrono debe definir:
- loading;
- success;
- empty;
- error;
- retry cuando tenga sentido.

## Formularios admin
- validación cliente + servidor;
- errores junto al campo;
- no borrar datos del usuario ante error;
- disabled durante submit;
- feedback de éxito;
- confirmación para acciones destructivas;
- avisar sobre cambios no guardados en formularios complejos.

## Imágenes
- usar componente optimizado;
- `alt` correcto;
- aspect ratio estable;
- fallback controlado;
- evitar layout shift;
- nunca subir imágenes de producto al filesystem local de Render.

## Responsive
Diseñar explícitamente:
- mobile;
- tablet;
- desktop.

No “arreglar” mobile al final.

## SEO
Público:
- metadata por producto/categoría;
- canonical;
- Open Graph;
- sitemap;
- robots;
- slug estable;
- JSON-LD de Product cuando sea apropiado y veraz.

Admin:
- `noindex`.

## Accesibilidad
- navegación teclado;
- focus visible;
- labels;
- controles semánticos;
- contraste suficiente;
- reduced motion;
- aria solo cuando la semántica HTML no alcance.

## Dependencias visuales
Untitled UI es referencia principal.
shadcn/ui puede complementar.
No mezclar estilos arbitrariamente: todo debe terminar adaptado a tokens BCM.

## Panel y cliente HTTP — Etapa 04

Implementación, rutas, componentes, decisiones y procedimiento de validación en
[ADMIN_UI_IMPLEMENTATION.md](ADMIN_UI_IMPLEMENTATION.md).

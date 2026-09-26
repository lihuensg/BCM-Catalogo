# DESIGN_SYSTEM.md

## Fuente de verdad
1. `BCM/logo.jpg`
2. Paleta BCM confirmada
3. Tokens de este documento
4. Componentes Untitled UI adaptados

No copiar estilos externos sin adaptarlos a BCM.

## Paleta provisional
- Navy `#0D1641`
- Plum `#5D195A`
- Orange `#FA972F`
- White `#FFFFFF`

Derivar escalas accesibles para:
- background;
- surface;
- text;
- border;
- primary;
- accent;
- success;
- warning;
- danger.

No usar naranja para texto largo sobre blanco si no cumple contraste.

## Personalidad
Cliente:
- premium;
- tecnológico;
- editorial;
- innovador;
- limpio;
- comercial;
- alto impacto visual.

Admin:
- profesional;
- sobrio;
- eficiente;
- bajo ruido visual;
- alta densidad controlada.

## Componentes
Crear/normalizar:
- Button
- IconButton
- Input
- SearchInput
- Select
- Checkbox
- Radio
- Switch
- Badge
- Card
- ProductCard
- PriceDisplay
- AvailabilityBadge
- Dialog
- Drawer
- Dropdown
- Tabs
- Table/DataTable
- Pagination
- EmptyState
- Skeleton
- Toast
- Breadcrumb
- SectionHeader

## Tokens
No usar valores arbitrarios repetidos.
Centralizar:
- radii;
- shadows;
- spacing;
- typography;
- transitions;
- z-index.

## Animación
Permitida cuando:
- mejora jerarquía;
- comunica transición;
- aporta identidad.

Evitar:
- animaciones que bloquean;
- parallax agresivo;
- movimiento continuo innecesario;
- efectos que empeoran mobile.

Respetar `prefers-reduced-motion`.

## Storefront
Puede usar:
- gradientes;
- composiciones asimétricas;
- fotografía/product renders;
- microinteracciones;
- hero editorial;
- fondos con profundidad.

Pero:
- catálogo y filtros siguen siendo legibles;
- producto y precio son protagonistas;
- CTA WhatsApp debe ser evidente sin dominar toda la interfaz.

## Admin
No usar la estética “marketing” del storefront.
Priorizar:
- tablas limpias;
- filtros claros;
- formularios por secciones;
- acciones visibles;
- feedback consistente.

## Logo
Cuando `logo.jpg` esté disponible:
- inspeccionar proporción;
- extraer uso claro/oscuro;
- no deformar;
- no recortar sin criterio;
- crear wrapper reusable;
- documentar safe area si es necesario.


## Identidad revisada en etapa 00

Se inspeccionó `logo.jpg` (1024 × 1536, proporción 2:3). Su campo oscuro,
violeta profundo y degradado fucsia/rojo/naranja sustituyen la interpretación navy/plum provisional.
Tokens aproximados para UI, sin recolorear el asset: brand `#190660`, plum `#92066B`,
fucsia `#EC0755`, accent `#FA972F`, fondo `#FAF9FC`, texto `#201A35`.
La fuente sigue siendo el logo, no una supuesta extracción exacta de colores de marca.

El wrapper `BrandLogo` conserva el lienzo completo, sin recorte ni deformación,
y acompaña el asset con nombre legible debido a su bajo contraste nativo en el fondo oscuro.
Separación mínima exterior de 12 px; no colocar textos encima del logo.
La copia en `apps/public/public/logo.jpg` conserva exactamente los bytes del original.
No hay versión clara vectorial autorizada: obtenerla antes de optimizar el lockup definitivo.
Cada aplicación conserva sus tokens semánticos mínimos en su propio
`styles/globals.css`. El archivo público contiene únicamente estilos del catálogo
y el administrativo únicamente patrones de gestión. Naranja se reserva para
acentos, no texto sobre blanco.

## Componentes administrativos — Etapa 04

Implementación, rutas, componentes, decisiones y procedimiento de validación en
[ADMIN_UI_IMPLEMENTATION.md](ADMIN_UI_IMPLEMENTATION.md).

## Identidad vigente (2026)

Esta secciÃ³n reemplaza la descripciÃ³n histÃ³rica del asset de etapa 00. El
`logo.jpg` vigente es un lienzo cuadrado de 640 por 640 px, con fondo blanco
texturado y lockup horizontal completo: isotipo, “BCM” y “PRODUCTS”. Conserva
el violeta profundo y el degradado fucsia, rojo y naranja como rasgos centrales.

`BrandLogo` no agrega texto junto al archivo porque la denominaciÃ³n ya forma
parte del lockup. En superficies compactas puede ocultar solamente el espacio
exterior del lienzo para darle escala legible, sin cortar, recolorear ni deformar
el isotipo o el nombre. Mantener al menos 12 px de separaciÃ³n exterior y no
superponer contenido. `apps/public/public/logo.jpg` y `apps/public/app/icon.jpg`
conservan los mismos bytes que el original vigente.

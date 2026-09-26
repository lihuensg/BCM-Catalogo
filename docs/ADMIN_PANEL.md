# ADMIN_PANEL.md

## Acceso
Un único rol: ADMIN.

Aplicación independiente en `apps/admin`. Sus rutas web parten de `/` y `/login`;
el prefijo `/admin` se conserva exclusivamente en los endpoints del backend.
No indexables.

## Login
- email;
- password;
- recordar sesión mediante cookie segura si arquitectura lo permite;
- mensajes de error no revelan si email existe;
- rate limit.

## Layout
- sidebar;
- topbar;
- breadcrumbs;
- área de contenido;
- acciones primarias consistentes;
- responsive.

## Dashboard
KPIs:
- productos totales;
- activos;
- sin stock;
- por encargo;
- ofertas;
- destacados;
- categorías;
- marcas.

Bloques:
- últimos productos;
- productos sin imagen;
- productos sin precio visible;
- alertas de calidad de catálogo.

No inventar analytics de visitas hasta instrumentarlos.

## Productos
Tabla con:
- imagen;
- nombre;
- SKU;
- categoría;
- marca;
- precio/oculto;
- disponibilidad;
- flags;
- estado;
- actualizado;
- acciones.

Filtros:
- búsqueda;
- categoría;
- marca;
- activo;
- disponibilidad;
- oferta;
- destacado;
- nuevo;
- por encargo.

## Form producto
Secciones:
1. Información básica.
2. Categorización.
3. Precio y venta.
4. Disponibilidad.
5. Galería.
6. Atributos/especificaciones.
7. Merchandising.
8. SEO/slug.
9. Publicación.

Atributos deben cambiar según categoría.

## Categorías
- CRUD;
- imagen;
- orden;
- activo;
- atributos asociados;
- parent opcional.

## Marcas
- CRUD;
- logo;
- descripción;
- activo.

## Atributos
- definición;
- tipo;
- unidad;
- opciones;
- filtrable;
- categorías asociadas.

## Banners
- imagen desktop;
- imagen mobile opcional;
- copy;
- CTA;
- placement;
- período;
- activo;
- orden.

## Configuración
- nombre sitio;
- WhatsApp;
- template WhatsApp;
- Instagram;
- textos hero;
- SEO por defecto;
- imagen OG.

## UX admin
- autosave NO por defecto;
- formularios explícitos;
- confirmación al salir con cambios;
- toasts claros;
- nunca mostrar errores técnicos al usuario;
- skeletons y empty states;
- acciones destructivas con confirmación.

## Estado Etapa 02

La API administrativa de categorías, marcas, atributos/opciones/asociaciones,
banners y settings está implementada. Productos dispone de GET listado/detalle.
Auth tiene login, me y logout con sesión segura. El shell visual de Etapa 00
sigue sin formularios ni login visual; no se implementó dashboard.
Contratos, endpoints y limitaciones: [AUTH_AND_ADMIN_API.md](AUTH_AND_ADMIN_API.md).

## Etapa 03 — dominio de producto

La API de productos incluye GET listado/detalle, POST, PATCH y DELETE como
desactivación reversible. Edición de galería y atributos por conjuntos explícitos,
publicación validada y notificación después del commit. Sin nuevas pantallas ni
storage. Reglas, contratos, límites y errores: [PRODUCT_DOMAIN.md](PRODUCT_DOMAIN.md).

## Panel implementado — Etapa 04

Implementación, rutas, componentes, decisiones y procedimiento de validación en
[ADMIN_UI_IMPLEMENTATION.md](ADMIN_UI_IMPLEMENTATION.md).

## Separación de aplicación

Rutas vigentes del frontend admin: `/`, `/login`, `/productos`,
`/productos/nuevo`, `/productos/[id]/editar`, `/categorias`, `/marcas`,
`/atributos`, `/banners` y `/configuracion`. Todo el sitio declara `noindex`.

# UI_QA.md

## Regla
Una tarea UI no está terminada hasta revisarse visualmente.

## Viewports mínimos
- mobile pequeño;
- mobile grande;
- tablet;
- desktop 1366;
- desktop ancho.

## Revisar en público
- header;
- hero;
- cards;
- grillas;
- filtros;
- menú mobile;
- búsqueda;
- detalle;
- galería;
- precio oculto;
- oferta;
- por encargo;
- sin stock;
- textos largos;
- imagen faltante;
- 0 resultados;
- carga/error;
- footer.

## Revisar en admin
- sidebar;
- tablas;
- formularios;
- selects;
- modales;
- toasts;
- validaciones;
- estados disabled;
- uploads;
- overflow horizontal;
- responsive.

## Criterios
- jerarquía visual;
- alineación;
- spacing;
- contraste;
- consistencia;
- no layout shift;
- no texto cortado;
- no botones fuera de pantalla;
- no mensajes técnicos;
- foco visible;
- navegación teclado.

## Calidad visual
No aceptar:
- cards sin contraste;
- paddings arbitrarios;
- tipografías inconsistentes;
- iconos de estilos distintos;
- bordes/radios inconsistentes;
- tablas ilegibles;
- componentes improvisados si existe patrón canónico.

## Automatización visual
La suite Playwright usa una DB de test dedicada y fixtures aislados. Captura:
- panel admin en 360, 430, 768, 1366 y 1920 px;
- home, catálogo y detalle público en los mismos cinco anchos;
- screenshots dentro de `artifacts/`, que no se versiona.

También valida:
- ausencia de overflow horizontal global;
- ausencia de errores React no esperados;
- precio público oculto;
- filtros y empty states;
- ficha técnica y WhatsApp configurado.

Ejecutar:
```sh
npm run test:e2e
```

Requiere `TEST_DATABASE_URL` dedicada y Chromium de Playwright instalado. Nunca usar producción.

## QA de Etapa 04
Implementación, rutas, componentes, decisiones y procedimiento de validación admin en
[ADMIN_UI_IMPLEMENTATION.md](ADMIN_UI_IMPLEMENTATION.md).

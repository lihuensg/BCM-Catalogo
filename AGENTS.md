# AGENTS.md — Catálogo BCM

## Propósito
Este archivo define cómo debe trabajar cualquier agente de código (especialmente CODEX) dentro de este repositorio.

## Regla 0 — Leer antes de modificar
Antes de tocar código:
1. Leer este archivo completo.
2. Leer `docs/PROJECT_CONTEXT.md`.
3. Leer `docs/ARCHITECTURE.md`.
4. Leer la documentación específica del área a modificar.
5. Inspeccionar la implementación existente antes de crear archivos, componentes, endpoints, servicios o modelos nuevos.
6. Revisar cambios relacionados para evitar regresiones.
7. No considerar una tarea terminada solo porque compila.

## Orden de lectura por tipo de tarea
### Frontend público
- `docs/PROJECT_CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/FRONTEND.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/PUBLIC_CATALOG.md`
- `docs/BUSINESS_RULES.md`
- `docs/UI_QA.md`

### Panel admin
- `docs/PROJECT_CONTEXT.md`
- `docs/ARCHITECTURE.md`
- `docs/FRONTEND.md`
- `docs/DESIGN_SYSTEM.md`
- `docs/ADMIN_PANEL.md`
- `docs/BUSINESS_RULES.md`
- `docs/UI_QA.md`

### Backend / API
- `docs/ARCHITECTURE.md`
- `docs/BACKEND.md`
- `docs/BUSINESS_RULES.md`
- `docs/SECURITY.md`
- `docs/TESTING.md`

### Base de datos
- `docs/DATABASE.md`
- `docs/BUSINESS_RULES.md`
- `docs/SECURITY.md`

### Caché / despliegue
- `docs/CACHE_AND_DEPLOYMENT.md`
- `docs/ARCHITECTURE.md`

## Reglas no negociables
- No duplicar lógica de negocio.
- No duplicar componentes visuales equivalentes.
- No importar Prisma desde controllers ni componentes frontend.
- No acceder a PostgreSQL desde el frontend.
- No hardcodear WhatsApp, Instagram, banners, textos comerciales configurables ni flags de producto.
- No crear mocks para el catálogo principal: los productos iniciales deben existir en PostgreSQL mediante seed.
- No introducir una librería nueva si ya existe una solución adecuada en el stack.
- No cambiar contratos API sin actualizar documentación, tipos compartidos y tests.
- No cambiar schema sin migración.
- No guardar secretos en el repositorio.
- No usar filesystem local de Render para persistencia.
- No hacer que el catálogo público dependa de que Render esté despierto para mostrar la última versión válida conocida.
- No exponer campos internos o sensibles en respuestas públicas.
- No omitir estados loading, empty, error, disabled y responsive.
- No sacrificar accesibilidad por animación o estética.
- No convertir el proyecto en ecommerce: no carrito, checkout, pago ni órdenes salvo cambio explícito de alcance.

## Calidad de código
- TypeScript estricto.
- Funciones pequeñas con responsabilidad clara.
- Nombres explícitos.
- Evitar `any`.
- Evitar archivos gigantes.
- Separar presentación, reglas de negocio y persistencia.
- Centralizar enums, formatos, validaciones y contratos.
- Preferir composición antes que componentes monolíticos.

## Antes de cerrar una tarea
1. Ejecutar lint.
2. Ejecutar typecheck.
3. Ejecutar tests relacionados.
4. Verificar build del área afectada.
5. Revisar UI en desktop y mobile si hubo cambios visuales.
6. Revisar loading/error/empty.
7. Revisar permisos si hubo cambios admin.
8. Revisar que no haya secretos, logs sensibles ni URLs hardcodeadas.
9. Resumir archivos cambiados, decisiones y riesgos.
10. Si queda deuda técnica, declararla; no ocultarla.

## Fuente visual
`logo.jpg` en la raíz del repositorio es el asset de identidad principal. El frontend usa su copia en `frontend/public/logo.jpg` para servirlo de forma estable.
Paleta provisional:
- `#0D1641`
- `#5D195A`
- `#FA972F`
- `#FFFFFF`

Si el logo contradice esta interpretación de paleta, preservar el logo como fuente de verdad y actualizar `docs/DESIGN_SYSTEM.md`.

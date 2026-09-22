# Prompt 00 — Inicializar Catálogo BCM

Actuá como lead full-stack engineer y product designer senior.

## Antes de hacer cualquier cambio
Leé, en este orden:
1. `AGENTS.md`
2. `docs/PROJECT_CONTEXT.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DATABASE.md`
5. `docs/BACKEND.md`
6. `docs/FRONTEND.md`
7. `docs/DESIGN_SYSTEM.md`
8. `docs/BUSINESS_RULES.md`
9. `docs/PUBLIC_CATALOG.md`
10. `docs/ADMIN_PANEL.md`
11. `docs/CACHE_AND_DEPLOYMENT.md`
12. `docs/SECURITY.md`
13. `docs/TESTING.md`
14. `docs/UI_QA.md`

Inspeccioná `logo.jpg` si existe en la raíz BCM. No lo modifiques.

## Objetivo de esta etapa
Inicializar una base profesional del proyecto SIN intentar implementar todas las funcionalidades de una sola vez.

Crear:
- `frontend/` Next.js + TypeScript + Tailwind;
- `backend/` Node + Express + TypeScript;
- `packages/shared/` para contratos/tipos realmente compartidos;
- Prisma/PostgreSQL;
- configuración lint/typecheck;
- env examples;
- scripts raíz útiles;
- estructura modular definida en docs;
- health endpoint backend;
- página base frontend;
- base de design tokens BCM;
- README operativo.

## Restricciones
- no mocks masivos;
- no crear 20 productos todavía si DB/schema todavía no está estable;
- no deploy;
- no inventar credenciales;
- no implementar ecommerce;
- no reemplazar arquitectura documentada por otra sin justificar primero.

## Validación
Al terminar:
- instalar dependencias;
- lint;
- typecheck;
- build;
- levantar frontend/backend cuando sea viable;
- reportar estructura creada;
- reportar decisiones;
- reportar TODOs de próxima etapa.

No avanzar a la siguiente etapa automáticamente.

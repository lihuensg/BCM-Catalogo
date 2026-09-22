# Etapa 00 — base técnica

## Decisiones

- npm workspaces sin Nx/Turborepo. Node 24, TypeScript estricto y ESM en backend/shared.
- Next App Router, React y Tailwind. Server Components por defecto.
- Shared expone únicamente envelopes HTTP y HealthStatus; no exporta Prisma ni modelos internos.
- Express separa construcción de app y proceso HTTP para permitir tests sin iniciar un servidor persistente.
- Health no depende de PostgreSQL. No hay endpoints de negocio o admin habilitados.
- Prisma PostgreSQL configurado, schema intencionalmente sin modelos. No hay cambios de tablas
  que requieran migración en esta etapa; la primera migración se entrega junto con el dominio.
- Storage tiene una interfaz independiente del proveedor; no hay persistencia en disco implementada.
- Las pantallas iniciales son estáticas y conservan disponibilidad sin backend.
  Esto no sustituye la futura implementación y pruebas del catálogo cache-first.
- Header público mínimo y shell admin sobrio. Sin formularios, KPIs o productos ficticios.
- Los textos de indisponibilidad son estados de sistema, no configuración comercial.
- Las rutas futuras se agregan con sus features. No se generan todas las pantallas por adelantado.

## Contrato implementado

`GET /api/v1/health` → 200, `Cache-Control: no-store`:

```json
{"data":{"status":"ok"},"meta":{}}
```

No expresa readiness de DB, versión de dependencias ni configuración.
Rutas inexistentes: 404 / NOT_FOUND.
JSON inválido: 400 / INVALID_JSON.
Payload JSON mayor que 100 KiB: 413 / PAYLOAD_TOO_LARGE.
Otros errores: 500 / INTERNAL_ERROR, siempre sanitizados.
Todos usan el envelope de error de BACKEND.md y packages/shared.

## Pendientes deliberados

Schema, migraciones, cliente conectado, seed, autenticación, CRUD, catálogo,
configuración comercial, assets remotos, ISR/revalidación y sus pruebas.
No son funcionalidades parcialmente implementadas: están fuera de la etapa 00.


Se desactiva `agentRules` en Next para que `next dev` no genere archivos de instrucciones
adicionales: el repositorio mantiene su `AGENTS.md` canónico en la raíz.
Referencias de configuración contrastadas: [Next installation](https://nextjs.org/docs/app/getting-started/installation)
y [Prisma 7](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7).
Resultados y limitaciones en `docs/INITIALIZATION_VALIDATION.md`.

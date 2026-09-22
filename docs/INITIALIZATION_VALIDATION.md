# Validación de etapa 00

Fecha: 2026-09-19. Entorno: Windows, Node 24.19.0, npm 11.17.0.

## Gates ejecutados

| Validación | Resultado |
| --- | --- |
| Instalación npm y lockfile | OK |
| `npm run lint` | OK, cero errores y warnings del código |
| `npm run typecheck` | OK, los tres workspaces |
| `npm test` | OK, 5 tests backend; no existían tests previos |
| `npm run build:frontend` | OK, rutas estáticas /, /admin y not-found |
| `npm run build:backend` | OK |
| `npm run prisma:validate` | OK, provider PostgreSQL |
| `npm run prisma:generate` | OK, cliente 7.10.0 generado sin modelos |
| Arranque backend compilado + HTTP real | OK, GET http://127.0.0.1:4100/api/v1/health |
| Arranque frontend compilado y desarrollo | OK |
| Logo original vs copia pública | SHA-256 idénticos |
| Secretos, URLs comerciales y accesos entre capas | Sin hallazgos en código escrito |

Se corrigieron una advertencia del export PostCSS, una excepción de validación CORS,
el reporte prematuro de arranque HTTP, el espaciado móvil del admin y las dimensiones
declaradas del logo. Se repitieron las validaciones afectadas.

## UI

Se generaron capturas de público y admin a 320×740, 430×932, 768×1024,
1366×900 y 1920×1080. Se verificó el ancho real del viewport: scrollWidth igual
al ancho en los diez casos. Se comprobó el primer foco por teclado en el enlace
“Saltar al contenido”, outline visible y robots noindex.

Capturas y mediciones locales en `artifacts/ui/`, excluidas de Git.
El navegador integrado no inicializó (“Cannot redefine property: process”).
Se utilizó Chrome headless local con viewport explícito; sus primeras capturas
de ventanas pequeñas recortaban un viewport mayor y fueron reemplazadas.

Estados vacíos revisados visualmente. Loading, error/retry y disabled revisados
en sus componentes; las rutas estáticas no tienen una operación asíncrona de
dominio con la que dispararlos de extremo a extremo. No hay formularios o
mutaciones admin para verificar todavía; los endpoints futuros responden 404.

## Dependencias principales resueltas

- Next 16.3.5, React / React DOM 19.3.0, Tailwind 4.3.3.
- Express 5.2.1, Zod 4.6.5, Prisma/client/adapter-pg 7.10.0.
- TypeScript 5.9.3, ESLint 9.39.5, typescript-eslint 8.70.0.
- Helmet 8.3.0, CORS 2.8.6, dotenv 17.4.2.
- TSX y Supertest para tests con el runner nativo de Node.

Las versiones efectivas están en `package-lock.json`; instalar con `npm ci`.

## Advertencias pendientes

1. `npm audit` informa **4 entradas de severidad alta**, originadas en
   `deepmerge-ts` y `mysql2`, propagadas a `@prisma/config` y `prisma`.
   También aparecen con `--omit=dev`: no se afirma que una instalación de
   producción quede libre de ellas. npm propone un cambio mayor a Prisma 6.19.3;
   no se aplicó `audit fix --force` ni overrides mayores sin pruebas de compatibilidad.
   Revisar una actualización corregida del árbol Prisma antes de desplegar.
   Referencias: [deepmerge-ts](https://github.com/advisories/GHSA-ggr8-5vv4-36mx),
   [mysql2 auth](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr),
   [mysql2 decompression](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3).
2. npm marca ESLint 9.39.5 como fuera de soporte. Se verificó ESLint 10, pero
   `eslint-plugin-react` del stack Next admite hasta 9 y npm rechazó la resolución.
   Se preservó el conjunto compatible sin `--force` / `--legacy-peer-deps`.
3. npm 11 avisó sobre política explícita pendiente para scripts de instalación de
   Prisma engines, Prisma, esbuild y unrs-resolver. Las herramientas funcionaron;
   revisar la allowlist al establecer CI.
4. No se probó conectividad, migraciones o integración con PostgreSQL: no se
   proporcionó DATABASE_URL y esta etapa no define tablas.
5. Puerto 4000 rechazado por Windows con EACCES; 4100 comprobado y documentado.
6. El logo original tiene bajo contraste dentro de su lienzo oscuro. Se conserva
   sin alterar y se acompaña por texto legible. Obtener variante vectorial autorizada
   en una etapa visual posterior.

## Alcance cerrado

No hubo deploy, seed, autenticación, CRUD, catálogo completo ni ecommerce.
La próxima etapa requiere autorización y debe estabilizar schema + migración
antes de cargar productos.

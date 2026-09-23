# SECURITY.md

## Principios
- mínimo privilegio;
- deny by default;
- secretos fuera de git;
- validación server-side;
- no confiar en frontend.

## Admin
- password hasheada con algoritmo seguro;
- cookie HttpOnly + Secure en producción;
- SameSite apropiado;
- expiración de sesión;
- logout real;
- rate limit login;
- no revelar existencia de usuario.

## API
- CORS allowlist;
- Helmet;
- límites de payload;
- validación Zod;
- rate limit sensible;
- errores sanitizados.

## DB
- usuario/conexión con privilegios necesarios;
- DATABASE_URL solo backend;
- migraciones controladas;
- no logs con credenciales.

## Uploads
Validar:
- MIME;
- extensión;
- tamaño;
- cantidad.

No confiar en filename original.
No ejecutar contenido.
Producción en object storage.

## Frontend
Nunca exponer:
- DATABASE_URL;
- JWT secrets;
- storage secrets;
- admin credentials;
- API keys privadas.

## XSS
- no usar HTML arbitrario de admin sin sanitizar;
- descripciones deben tratarse como texto o contenido estructurado seguro.

## Dependencias
- lockfile;
- auditoría periódica;
- no instalar paquetes abandonados sin justificación.

## Implementación Etapa 02

Auth usa Argon2id y sesiones revocables persistidas, con solo SHA-256 del token en DB.
Cookie HttpOnly, Secure y prefijo __Host- en producción, SameSite=Lax, expiración
absoluta configurable. Todas las mutaciones exigen X-BCM-Admin: 1 y Origin permitido
cuando está presente. requireAdmin protege todo /api/v1/admin/* y rechaza usuarios
inactivos. DTOs explícitos nunca incluyen passwordHash. No hay registro público.

Ver [AUTH_AND_ADMIN_API.md](AUTH_AND_ADMIN_API.md) para límites de rate limit,
configuración de same-site/proxy, seed operativo y pendientes de despliegue.


## Seguridad continua del repositorio
- CodeQL analiza JavaScript/TypeScript en pull requests a `main`, pushes a `main` y semanalmente.
- Dependabot revisa mensualmente dependencias npm y GitHub Actions.
- Los hallazgos automáticos no deben resolverse con overrides forzados si rompen compatibilidad del toolchain; primero se evalúa impacto y versión soportada.
- Ninguna alerta automática habilita a modificar schema, auth o dependencias críticas sin ejecutar nuevamente todos los gates de calidad.

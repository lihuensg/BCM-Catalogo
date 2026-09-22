# Migraciones PostgreSQL

202609190001_init/migration.sql es la migración inicial de Etapa 01.
Se generó con Prisma migrate diff --from-empty --to-schema prisma/schema.prisma
--script --output prisma/migrations/202609190001_init/migration.sql y se añadieron
CHECK e índices parciales PostgreSQL revisables en su sección final.

La generación no necesitó conexión. Fue aplicada y verificada en Neon test; consultar
docs/DATABASE_VALIDATION.md. Ejecutar npm run prisma:deploy desde la raíz cuando
backend/.env contenga DATABASE_URL de la base destino autorizada.
Para una DB dedicada de test, npm run prisma:test:migrate.

No regenerar encima de una migración ya aplicada, no usar db push y no ejecutar
migrate reset automáticamente. Nuevos cambios deben crear nuevas migraciones.

202609190002_admin_sessions/migration.sql agrega las sesiones persistidas y permite
startsAt=endsAt en Banner conforme a Etapa 02. También fue aplicada en Neon test.
El detalle funcional está en docs/AUTH_AND_ADMIN_API.md.

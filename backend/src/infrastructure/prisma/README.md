# Infraestructura Prisma

- client.ts valida URL sin exponer credenciales, crea adapter-pg y cliente generado.
- getPrismaClient es lazy y reutiliza un pool por proceso; respeta el parámetro schema.
- disconnectPrisma se invoca durante shutdown del servidor y del seed.
- unit-of-work.ts construye repositories de cada módulo en una transacción
  SERIALIZABLE y reintenta solo P2034 (máximo tres intentos).
- Los callbacks transaccionales solo contienen lecturas/escrituras de DB y reglas
  locales. No incorporar HTTP, uploads o efectos externos que se duplicarían al reintentar.
- Los servicios coordinan reglas; los repositories ejecutan persistencia.
- Los resultados son internos, con posibles precios ocultos. No son contratos públicos.
- Health permanece como liveness, no abre conexiones.
- seed.ts realiza upserts estructurales por slug sin modificar filas existentes.

Prisma no se importa desde controllers ni frontend. Los endpoints administrativos
usan mappers explícitos; los precios internos solo son accesibles con sesión admin.
Auth usa un repositorio separado para usuarios/sesiones; nunca expone passwordHash.

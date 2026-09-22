# Prompt — Fix Bug

Corregí el bug indicado sin introducir regresiones.

1. Leer `AGENTS.md` y docs del módulo.
2. Reproducir o demostrar la causa antes de cambiar código.
3. Identificar causa raíz, no solo síntoma.
4. Buscar otros lugares afectados por la misma causa.
5. Aplicar solución mínima y canónica.
6. Agregar test de regresión cuando sea posible.
7. Ejecutar lint/typecheck/tests/build relevantes.
8. Si es UI, revisar visualmente los estados afectados.

No ocultar errores con fallbacks silenciosos que vuelvan incorrectos los datos.
No hacer refactor grande si no es necesario para la corrección.

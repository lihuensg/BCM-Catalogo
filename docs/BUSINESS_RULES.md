# BUSINESS_RULES.md

## Producto público
Un producto aparece públicamente solo si:
- `active = true`;
- tiene categoría válida;
- cumple mínimos de publicación.

## Precio
### `showPrice = true`
- si existe `price`, mostrar precio;
- si `onSale=true` y existe `compareAtPrice`, mostrar precio anterior tachado y precio actual;
- jamás inventar precio.

### `showPrice = false`
- no renderizar monto aunque exista internamente;
- mostrar CTA configurable: “Consultar precio” o equivalente;
- structured data no debe exponer un precio oculto.

## Por encargo
`saleMode = MADE_TO_ORDER`
- puede ocultar precio;
- badge “Por encargo”;
- CTA orientado a consulta;
- no presentarlo como disponibilidad inmediata.

## Disponibilidad
Estados:
- Disponible
- Pocas unidades
- Sin stock
- Consultar disponibilidad
- Por encargo

La UI pública debe usar copy amigable, no mostrar nombres enum.

## Ofertas
`onSale = true` no implica necesariamente descuento porcentual.
Calcular porcentaje solo si `price` y `compareAtPrice` válidos.

## Destacados
`featured=true` controla merchandising; no altera precio ni disponibilidad.

## Nuevos ingresos
`newArrival=true`.
No inferir automáticamente por fecha salvo que se defina luego una regla explícita.

## WhatsApp
Número y template son configurables por admin.

El template debe soportar placeholders permitidos:
- `{{productName}}`
- `{{productUrl}}`
- `{{sku}}`
- `{{price}}` solo si showPrice=true

Si un placeholder no tiene valor, resolverlo limpiamente sin dejar llaves visibles.

## Instagram
URL configurable.
No hardcodear handle.

## Filtros
Públicos iniciales:
- búsqueda;
- categoría;
- marca;
- rango de precio;
- disponibilidad;
- oferta;
- destacado;
- nuevo ingreso;
- tipo de venta.

Los filtros deben poder combinarse.

## Atributos dinámicos
No agregar columnas a Product para cada especificación de categoría.
Usar AttributeDefinition + relaciones.

Ejemplos:
- celular: RAM, almacenamiento, pantalla, cámara;
- perfume: contenido, familia olfativa, género;
- auricular: conectividad, autonomía, color.

## Eliminación
Preferir bloquear/desactivar cuando una eliminación rompería referencias.
Acciones destructivas admin requieren confirmación.


## Precisiones del modelo — Etapa 01

- compareAtPrice requiere precio actual y debe ser mayor; showPrice no elimina el monto interno.
- MADE_TO_ORDER permite disponibilidad MADE_TO_ORDER, CHECK_AVAILABILITY u OUT_OF_STOCK;
  nunca AVAILABLE/LOW_STOCK. IN_STOCK no usa disponibilidad MADE_TO_ORDER.
- Los atributos se asignan a la categoría directa; no se heredan automáticamente del padre.
- Requeridos se validan al activar/publicar; borradores pueden estar incompletos.
- Un nuevo atributo obligatorio se bloquea si la categoría ya tiene productos activos.
- Jerarquía, publicación y cambios de imagen principal pasan por servicios transaccionales.
- Las futuras mutaciones de maestros deben preservar estas invariantes (ver DATABASE.md).

## Etapa 03 — dominio de producto

La API de productos incluye GET listado/detalle, POST, PATCH y DELETE como
desactivación reversible. Edición de galería y atributos por conjuntos explícitos,
publicación validada y notificación después del commit. Sin nuevas pantallas ni
storage. Reglas, contratos, límites y errores: [PRODUCT_DOMAIN.md](PRODUCT_DOMAIN.md).

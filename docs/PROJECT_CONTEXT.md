# PROJECT_CONTEXT.md — Catálogo BCM

## Visión
BCM necesita un catálogo online profesional, innovador y orientado a conversión por contacto, no un ecommerce.

El cliente debe poder descubrir productos, filtrarlos, buscarlos, ver detalle y consultar por WhatsApp. El administrador debe controlar completamente el catálogo sin tocar código.

## Negocio
BCM comercializa productos variados:
- celulares;
- accesorios;
- audio;
- wearables;
- perfumes;
- gadgets;
- productos varios.

El modelo debe ser genérico y no asumir que todo producto es tecnológico.

## Objetivos
### Cliente
- navegación rápida;
- descubrimiento visual;
- búsqueda y filtros;
- ficha completa;
- precio cuando corresponda;
- disponibilidad;
- WhatsApp;
- Instagram;
- experiencia premium y diferenciada.

### Administrador
Un único administrador inicialmente.
Debe poder gestionar:
- productos;
- categorías;
- marcas;
- atributos;
- imágenes;
- banners;
- ofertas;
- destacados;
- nuevos ingresos;
- disponibilidad;
- visibilidad;
- WhatsApp;
- mensaje de WhatsApp;
- Instagram;
- textos/configuración general;
- SEO básico.

## No objetivos actuales
- carrito;
- checkout;
- pagos;
- pedidos;
- logística;
- cuentas de clientes;
- múltiples roles admin;
- facturación;
- marketplace.

## Catálogo inicial
Debe existir seed de 20 productos persistidos en PostgreSQL. No mocks de frontend.

Distribución sugerida:
- 6 celulares;
- 5 accesorios;
- 3 perfumes;
- 2 auriculares;
- 2 smartwatches;
- 2 gadgets.

Usar marcas reales conocidas como datos de demostración, sin inventar afirmaciones técnicas no verificadas. Las imágenes demostrativas pueden ser generadas o placeholders controlados durante desarrollo.

## Identidad
Nombre de trabajo: **Catálogo BCM**.

Asset principal:
`BCM/logo.jpg`

Paleta provisional:
- Navy: `#0D1641`
- Plum: `#5D195A`
- Orange: `#FA972F`
- White: `#FFFFFF`

## Principio UX
El sitio público debe sentirse comercial, editorial, moderno, premium e innovador.
El admin debe sentirse sobrio, profesional, eficiente y consistente.

No copiar una tienda genérica ni hacer que el storefront parezca un dashboard SaaS.

## Despliegue previsto
Se desarrolla primero en local.

Arquitectura objetivo:
- frontend: Vercel o Netlify;
- backend: Render;
- base de datos: Neon PostgreSQL.

El catálogo público debe continuar funcionando con la última versión válida cacheada aunque Render esté dormido.

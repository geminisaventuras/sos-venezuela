# MEMORIA DE INICIO — SOS Venezuela V3.0.0

## Propósito
Este documento permite a una IA Arquitecto continuar el desarrollo del sistema SOS Venezuela sin perder el contexto en caso de reinicio de conversación.

## Stack
- Backend: Node.js + Express
- BD: PostgreSQL (Supabase)
- Auth: Supabase Auth (JWT)
- Validación: Zod
- Frontend: Vanilla JS, HTML5, CSS3
- Mapas: Leaflet + OSM

## Estructura del proyecto
- `src/modules/[modulo]/`: routes, controllers, services, repositories, schemas, tests
- `src/middleware/`: auth.middleware.js
- `src/config/`: supabase.js
- `src/utils/`: geo.js, catalogo-helper.js
- `public/`: dashboard-*.html, login.html, app.js, styles.css, componentes/ (buscador-insumos.js, carrito.js, mensaje.js, modal.js, header.js, bottom-nav.js)

## Estado actual
- 16/16 correcciones de auditoría completadas.
- Catálogo unificado en 3 tablas (catalogo_categorias, catalogo_items, catalogo_presentaciones).
- RPCs atómicas: crear_despacho_atomico, crear_entrega_atomica, crear_item_catalogo.
- Autenticación: supabaseAdmin.auth.getUser().
- CORS restrictivo (localhost:3000, producción).
- CSP con Helmet configurada.
- Componentes frontend reutilizables integrados en todos los dashboards.
- Pruebas unitarias (MEU) para módulo de catálogo.
- Documentación OpenAPI en docs/openapi.yaml.

## Configuración (.env)
SUPABASE_URL=https://kxqwxiolouhrwddaqynp.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ANON_KEY=...
SUPABASE_JWT_SECRET=...
PORT=3000
API_BASE=http://localhost:3000


## Dependencias clave (package.json)
- express, cors, helmet, express-rate-limit, uuid, jsonwebtoken
- @supabase/supabase-js, zod
- jest, supertest (dev)

## Puntos críticos
- No modificar reglas de negocio sin aprobación del Operador (Determinismo Categórico).
- Usar freno táctico antes de generar código.
- Las RPCs existentes en BD no deben eliminarse sin verificar dependencias.
- El frontend requiere que los CDN de Supabase y Leaflet se carguen antes del script inline.

## Documentos relacionados
- CONTEXTO.md
- DESIGN.md
- BACKLOG_V2.md
- BITACORA_EXPERIENCIAL.md
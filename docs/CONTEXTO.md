# CONTEXTO.md — SOS Venezuela V3.0.0

## Problema
Sistema de gestión de ayuda humanitaria para respuesta a terremotos en Venezuela. Coordina donantes, refugios, centros de salud, centros de acopio y voluntarios de transporte para distribuir insumos médicos, alimentos, agua y otros recursos.

## MVP (Corte Quirúrgico)
- Autenticación de usuarios con roles (donante, refugio, centro_salud, centro_acopio, voluntario, super_admin).
- Catálogo unificado de insumos con categorías y presentaciones.
- Donaciones con carrito de ítems y trazabilidad.
- Necesidades (solicitudes) desde refugios y hospitales.
- Inventario de centros de acopio (ingreso/egreso).
- Despachos desde acopios a necesidades.
- Entregas asignadas a voluntarios (recolección y distribución).
- Mapas interactivos para ubicación de donaciones y necesidades.
- Componentes frontend reutilizables (buscador, carrito, mensajes, modales, navegación).

## Stack Tecnológico
- **Backend:** Node.js + Express
- **Base de datos:** PostgreSQL (Supabase)
- **Autenticación:** Supabase Auth (JWT ES256/HS256)
- **Validación:** Zod (esquemas isomórficos)
- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (Inter font, Font Awesome)
- **Mapas:** Leaflet + OpenStreetMap
- **Seguridad:** Helmet (CSP, referrerPolicy), CORS restrictivo, rate limiting, JWT verify

## Paradigma
Funcional con clases para servicios y repositorios. Inyección de dependencias manual.

## Lenguaje Ubicuo
- **Donante:** Persona que ofrece insumos.
- **Refugio/Centro de Salud:** Punto que solicita necesidades.
- **Centro de Acopio:** Almacén que recibe donaciones y gestiona inventario.
- **Voluntario:** Transportista que recoge donaciones o distribuye despachos.
- **Super Admin:** Administrador global del sistema.
- **Catálogo:** Lista maestra de insumos con presentaciones predefinidas.
- **Ítem:** Producto genérico en el catálogo (ej. Paracetamol).
- **Presentación:** Variante concreta de un ítem (ej. Tableta 500mg).

## Decisiones Clave
- Delegar autenticación a `supabaseAdmin.auth.getUser()` en lugar de `jwt.verify`.
- Usar RPCs atómicas en PostgreSQL para garantizar ACID en operaciones críticas.
- Unificar el catálogo en modelo jerárquico (categorías > ítems > presentaciones).
- Extraer componentes UI reutilizables para eliminar duplicación en frontend.
- Restringir CORS a orígenes explícitos.
- Configurar CSP para permitir CDNs de Supabase, Leaflet y OpenStreetMap.


# CONTEXTO.md – SOS Venezuela

## Estado actual del proyecto (2026-06-30)

### Problema
Sistema de logística humanitaria para respuesta a terremotos en Venezuela. Conecta donantes, centros de acopio, transportistas voluntarios y puntos de ayuda (refugios/hospitales).

### MVP
Completado. El flujo donante → acopio → voluntario → refugio/hospital funciona de extremo a extremo.

### Stack
- **Backend:** Node.js + Express 5 sobre Supabase (PostgreSQL + PostGIS)
- **Frontend:** HTML5, CSS3, JavaScript vanilla (sin frameworks), Leaflet para mapas
- **Autenticación:** Supabase Auth (JWT con ES256/HS256)
- **Validación:** Zod (isomórfica frontend/backend)

### Paradigma
Funcional con Inyección de Dependencias manual (rutas → controlador → servicio → repositorio).

### Lenguaje Ubicuo
- **Donante:** Persona que ofrece productos.
- **Centro de Acopio:** Punto de recolección y distribución.
- **Voluntario:** Transportista (moto, carro, camioneta, bicicleta, a pie).
- **Refugio / Centro de Salud:** Destino final de la ayuda.
- **Necesidad:** Solicitud de insumos.
- **Donación:** Oferta de insumos.
- **Entrega:** Asignación de un voluntario a una recolección o distribución.
- **Despacho:** Envío desde un centro de acopio a un punto de ayuda.

### Estado actual por módulo
| Módulo | Frontend | Backend |
|--------|----------|---------|
| Donante | 4 páginas refactorizadas | ✅ |
| Voluntario | SPA (voluntario.html) funcional | ✅ |
| Centro de Acopio | Dashboard original (pendiente refactorizar) | ✅ |
| Refugio / Hospital | Dashboards originales (pendiente refactorizar) | ✅ |
| Super Admin | Dashboard original | ✅ |
| Login / Registro | Refactorizado con MapaUbicacion | ✅ |

### Base de datos
- 20 tablas activas
- 25 categorías de productos
- 156 ítems en catálogo
- 7 funciones RPC atómicas
- Políticas RLS depuradas

### Decisiones técnicas
- **SPA para el voluntario:** Experiencia fluida tipo delivery con router hash.
- **Páginas separadas para el donante:** Mejor rendimiento y simplicidad.
- **CSS unificado:** `styles.css` con variables CSS, mobile-first.
- **Componentes compartidos:** Mensaje, Modal, BottomNav, CarritoInsumos, BuscadorInsumos, MapaUbicacion.
- **Cancelación con motivo:** El voluntario debe indicar causa al cancelar un viaje.


# CONTEXTO.md – SOS Venezuela

## Estado actual del proyecto (2026-07-01)

### Problema
Sistema de logística humanitaria para respuesta a terremotos en Venezuela. Conecta donantes, centros de acopio, transportistas voluntarios y puntos de ayuda (refugios/hospitales).

### MVP
Completado. El flujo donante → acopio → voluntario → refugio/hospital funciona de extremo a extremo.

### Stack
- **Backend:** Node.js + Express 5 sobre Supabase (PostgreSQL + PostGIS)
- **Frontend:** HTML5, CSS3, JavaScript vanilla (sin frameworks), Leaflet para mapas
- **Autenticación:** Supabase Auth (JWT con ES256/HS256)
- **Validación:** Zod (isomórfica frontend/backend)

### Paradigma
Funcional con Inyección de Dependencias manual (rutas → controlador → servicio → repositorio).

### Lenguaje Ubicuo
- **Donante:** Persona que ofrece productos.
- **Centro de Acopio:** Punto de recolección y distribución.
- **Voluntario:** Transportista (moto, carro, camioneta, bicicleta, a pie).
- **Refugio / Centro de Salud:** Destino final de la ayuda.
- **Necesidad:** Solicitud de insumos.
- **Donación:** Oferta de insumos.
- **Entrega:** Asignación de un voluntario a una recolección o distribución.
- **Despacho:** Envío desde un centro de acopio a un punto de ayuda.

### Estado actual por módulo
| Módulo | Frontend | Backend |
|--------|----------|---------|
| Donante | 4 páginas refactorizadas | ✅ |
| Voluntario | SPA (voluntario.html V7) con rastreo GPS, ruta real (OSRM), panel desplegable, persistencia y bloqueo de navegación | ✅ |
| Centro de Acopio | Dashboard original (pendiente refactorizar) | ✅ |
| Refugio / Hospital | Dashboards originales (pendiente refactorizar) | ✅ |
| Super Admin | Dashboard original | ✅ |
| Login / Registro | Refactorizado con MapaUbicacion | ✅ |

### Base de datos
- 20 tablas activas
- 25 categorías de productos
- 156 ítems en catálogo
- 7 funciones RPC atómicas
- Políticas RLS depuradas

### Decisiones técnicas
- **SPA para el voluntario:** Router hash, estado global `VoluntarioState`, persistencia en `localStorage`.
- **Páginas separadas para el donante:** Mejor rendimiento y simplicidad.
- **CSS unificado:** `styles.css` con variables CSS, mobile-first.
- **Componentes compartidos:** Mensaje, Modal, BottomNav, CarritoInsumos, BuscadorInsumos, MapaUbicacion.
- **Cancelación con motivo:** El voluntario debe indicar causa al cancelar un viaje.
- **Ruta real con OSRM:** Intenta obtener la ruta sobre calles; si falla, usa polilínea recta como respaldo.

### Certificados SSL
- Generados con `mkcert` para desarrollo local HTTPS.
- Archivos: `localhost+2.pem` y `localhost+2-key.pem` en la raíz del proyecto.
- Servidor iniciado con `src/server.js` usando `https.createServer`.



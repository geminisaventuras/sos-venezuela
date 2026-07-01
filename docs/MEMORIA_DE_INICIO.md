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


MEMORIA DE ARRANQUE – SOS VENEZUELA (2026-06-30)

Proyecto: Sistema de logística humanitaria para respuesta a terremotos en Venezuela.
Stack: Node.js + Express 5 | Supabase (PostgreSQL + PostGIS) | HTML5/CSS3/JS Vanilla | Leaflet | Zod.
Paradigma: Funcional con Inyección de Dependencias manual. Modo: Misión Crítica.

ESTADO ACTUAL:
- Base de datos: 20 tablas, 25 categorías de productos, 156 ítems en catálogo, 7 funciones RPC atómicas.
- Backend: 8 módulos completos (catalogo, donaciones, entregas, despachos, inventario, necesidades, perfil, voluntarios).
- Frontend Donante: Refactorizado en 4 páginas HTML independientes (dashboard-donante.html, donante-nueva.html, donante-historial.html, donante-perfil.html). Funcional con CSS unificado y componentes compartidos.
- Frontend Voluntario: SPA (voluntario.html) con 4 vistas (explorar, mis-viajes, perfil). Funcional con cancelación por motivo obligatorio.
- Login/Registro: Refactorizado con CSS unificado y componente MapaUbicacion.
- Centro de Acopio, Refugio/Hospital, Super Admin: Pendientes de refactorizar (aún dashboards monolíticos originales).

COMPONENTES COMPARTIDOS:
- public/styles.css (CSS unificado con variables, mobile-first)
- public/app.js (utilidades globales: apiFetch, verificarSesion, setAuth, logout)
- public/componentes/mensaje.js (toast de notificaciones)
- public/componentes/modal.js (ventana modal reutilizable)
- public/componentes/bottom-nav.js (barra de navegación inferior, centraliza menús por rol)
- public/componentes/carrito.js (gestión de ítems con persistencia localStorage)
- public/componentes/buscador-insumos.js (búsqueda con formulario inteligente por categoría)
- public/componentes/mapa-ubicacion.js (mapa Leaflet con autocompletado de direcciones venezolanas y GPS)

ARCHIVOS CLAVE:
- database/schema.sql (estructura completa de la BD)
- src/app.js (servidor Express con CORS, Helmet, rate-limit, TraceID)
- src/config/supabase.js (cliente admin de Supabase)
- src/middleware/auth.middleware.js (autenticación y roles)
- src/utils/geo.js (cálculo de distancia Haversine)
- src/utils/catalogo-helper.js (upsert de ítems en catálogo)
- BACKLOG_V2.md (deudas técnicas)
- BITACORA_EXPERIENCIAL.md (decisiones arquitectónicas)
- CONTEXTO.md (estado actual del proyecto)

PRÓXIMOS PASOS:
1. Refactorizar Centro de Acopio (4 páginas: inicio, inventario, solicitudes, donaciones).
2. Refactorizar Refugio / Hospital.
3. Refactorizar Super Admin.

DEUDAS TÉCNICAS:
- Estados "muertos" en restricciones CHECK de la BD.
- entregas.voluntario_telefono como FK no formal.
- Pruebas unitarias de componentes frontend pendientes.
- SECURITY DEFINER sin search_path explícito en RPCs.

CARGAR AL INICIO:
- Manual Integral del Arquitecto Full-Stack V2.1
- Super Marco de Trabajo V6.3


GUÍA DE CONTINUACIÓN PARA LA IA:
1. El Operador es técnico, trabaja en Termux/entornos hostiles y no tolera suposiciones. No asumas reglas de negocio ni modifiques código sin autorización explícita.
2. Flujo de trabajo obligatorio: razonamiento (CoT) → freno táctico → autorización → generación. Nunca generes código en el mismo turno que el análisis.
3. Si detectas un bug o necesitas modificar un archivo, pide ver el código actual ANTES de cambiarlo. Las regresiones por cambios ciegos han sido el principal problema.
4. Estilo de código: redondeo a 2 decimales, detalle amigable con unidades, usar componentes Modal/Mensaje en lugar de alert/confirm nativos.
5. Próximo objetivo: refactorizar Centro de Acopio aplicando el mismo patrón que el Donante (páginas separadas, CSS unificado, componentes compartidos).
6. Carga al iniciar el Manual Integral del Arquitecto V2.1 y el Super Marco de Trabajo V6.3 que están en los documentos del proyecto.



# MEMORIA DE ARRANQUE DEFINITIVA – SOS Venezuela (2026-07-01)

## 1. Proyecto
Sistema de logística humanitaria para respuesta a terremotos en Venezuela. Conecta donantes, centros de acopio, transportistas voluntarios (moto/carro/bici/pie) y puntos de ayuda (refugios/hospitales).

**Stack:** Node.js + Express 5 | Supabase (PostgreSQL + PostGIS) | HTML5/CSS3/JS Vanilla | Leaflet | Zod | mkcert (HTTPS local).
**Paradigma:** Funcional con Inyección de Dependencias manual. **Modo: Misión Crítica.**

## 2. Reglas del Operador (NO NEGOCIABLES)
1.  **Cero suposiciones:** No asumas reglas de negocio. Si hay ambigüedad, Freno Táctico.
2.  **Sin cambios ciegos:** Pide ver el código actual ANTES de modificarlo.
3.  **Protocolo estricto:** Razonamiento (CoT) → Freno Táctico (Hard Stop) → Autorización → Código. **Nunca generes código en el mismo turno que el análisis.**
4.  **Estilo de código:** Redondeo a 2 decimales, detalle amigable con unidades, usar componentes Modal/Mensaje en lugar de alert/confirm nativos.
5.  **Hostilidad:** El Operador trabaja en Termux/entornos hostiles. Las entregas de código deben ser completas y poder copiarse directamente.
6.  **No modificar lo que funciona:** Si un cambio rompe una funcionalidad existente, retrocede y repiensa la solución.
7.  **Documentación:** Actualiza `CONTEXTO.md`, `BACKLOG_V2.md` y `BITACORA_EXPERIENCIAL.md` periódicamente.

## 3. Estado Actual del Proyecto

### Completado (Frontend)
- **Donante:** 4 páginas HTML refactorizadas (inicio, nueva, historial, perfil). CSS unificado. Componentes compartidos. Flujo completo funcional.
- **Login/Registro:** Refactorizado con `styles.css` y `MapaUbicacion`. Funcional.
- **Voluntario:** SPA (`voluntario.html`) con:
  - Router hash (4 vistas: explorar, viaje-activo, mis-viajes, perfil).
  - Mapa de servicios con botón "Aceptar Viaje".
  - Vista de viaje activo con mapa a pantalla completa, ruta real (OSRM, ver deuda), GPS en tiempo real, panel desplegable, ETA.
  - Persistencia del viaje en `localStorage` (sobrevive a recargas).
  - Bloqueo de navegación durante viaje activo.
  - Botón "Retomar viaje" en Mis Viajes.
  - Cancelación con motivo obligatorio (modal propio).
  - Barra inferior reorganizada (Lista toggle, Explorar, Mis Viajes; Perfil en avatar superior).

### Completado (Backend)
- 8 módulos: catalogo, donaciones, entregas, despachos, inventario, necesidades, perfil, voluntarios.
- Autenticación con Supabase Auth (middleware `auth.middleware.js`).
- Validación isomórfica con Zod en endpoints críticos.
- Transaccionalidad delegada a RPC atómicas.

### Completado (Base de Datos)
- 20 tablas activas, 25 categorías, 156 ítems en catálogo, 7 RPCs atómicas.
- Purga completa de tablas/columnas/políticas RLS inseguras (realizada el 2026-06-29).

### Pendiente (Deudas del BACKLOG_V2.md)
- **[CRÍTICO]** Bloqueo de viajes simultáneos desde múltiples dispositivos (backend).
- **[ALTO]** Panel de detalles no visible (z-index).
- **[ALTO]** Botón Google Maps descuadrado (CSS).
- **[ALTO]** Ruta OSRM sin efecto visual (CORS/parseo).
- **[ALTO]** No se muestra nombre del destino en el panel (ya se guarda en el objeto `viajeEnCurso`, pero no se pinta bien o falta en algún lado).
- **[ALTO]** Botones de contacto (Llamar/WhatsApp) sin acción en PC (solo funcionan en dispositivo móvil con `tel:` y `wa.me:`).
- **[MEDIO]** Refactorizar Centro de Acopio (4 páginas).
- **[MEDIO]** Refactorizar Refugio / Hospital.
- **[MEDIO]** Duración total del viaje.

## 4. Archivos Clave (y dónde encontrar cada cosa)
- `public/styles.css` – CSS unificado.
- `public/app.js` – Utilidades globales del frontend (apiFetch, verificarSesion, etc.).
- `public/componentes/` – Componentes JS reutilizables:
  - `mensaje.js` (toasts)
  - `modal.js` (ventana modal genérica)
  - `bottom-nav.js` (barra inferior, centraliza menús por rol)
  - `carrito.js` (gestión de ítems con persistencia localStorage)
  - `buscador-insumos.js` (búsqueda y formulario inteligente)
  - `mapa-ubicacion.js` (mapa Leaflet + GPS + autocompletado)
- `public/voluntario.html` – **LA SPA PRINCIPAL DEL CONDUCTOR (versión actual: VOL-SPA-V7)**.
- `src/app.js` – Servidor Express (CORS, Helmet CSP, Rate Limit, etc.).
- `src/server.js` – Arranque HTTPS con certificados mkcert.
- `src/config/supabase.js` – Cliente admin de Supabase.
- `src/middleware/auth.middleware.js` – Autenticación y roles.
- `.env` – Variables de entorno (API_BASE, claves Supabase).
- `database/schema.sql` – Estructura completa de la BD.

## 5. Flujo de Trabajo Obligatorio (MEU-A)
1.  **Analiza el problema** y emite un `<razonamiento_arquitectonico>`.
2.  **Detente** y emite un `<solicitud_aprobacion>` (FRENO TÁCTICO).
3.  **Espera** la autorización explícita del Operador.
4.  **Genera el código** en formato XML con: `<declaracion_jurada>`, `<matriz_seguridad>`, `<codigo_fuente>`, `<script_caja_negra>`.

## 6. Punto de Partida para la Nueva Instancia
El Operador te pedirá que cargues el **Manual del Arquitecto V2.1** y el **Super Marco de Trabajo V6.3**. Debes conocerlos y aplicarlos.

**Lo último que sucedió en el chat anterior:**
Se implementó la versión **VOL-SPA-V7** de la SPA del voluntario. Se hicieron pruebas y se detectaron 4 fallos. El Operador pidió que se actualizaran los documentos de memoria (`CONTEXTO.md`, `BACKLOG_V2.md`, `BITACORA_EXPERIENCIAL.md`) antes de continuar con las correcciones.

**Los 4 fallos detectados son:**
1.  **Viajes simultáneos:** Se pueden aceptar múltiples viajes desde diferentes dispositivos. (Se propuso una solución backend: validar si el voluntario ya tiene una entrega activa en el controlador `EntregaController.crear`).
2.  **Botón Google Maps descuadrado:** El ícono del avión de papel no está centrado en el círculo blanco. (Se propuso solución CSS: añadir `display:flex` al `<i>`).
3.  **Panel de detalles no visible:** La barra de acciones (`z-index: 1000`) tapa el asa del panel (`z-index: 999`). (Se propuso invertir los `z-index`).
4.  **Ruta OSRM sin efecto:** La API de OSRM no está dibujando la ruta. (Se propuso depurar con `console.log` y considerar un error de CORS).

**Tu misión al iniciar:** Preguntar al Operador si desea proceder con la implementación de estas 4 correcciones, y hacerlo siguiendo **estrictamente** el MEU-A (Razonamiento → Freno Táctico → Autorización → Código).
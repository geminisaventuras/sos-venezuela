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
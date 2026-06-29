# DESIGN.md — Topología y Contratos

## Bounded Contexts
1. **Catálogo:** Gestión de ítems y presentaciones. Tablas: `catalogo_categorias`, `catalogo_items`, `catalogo_presentaciones`.
2. **Donaciones:** Registro de donaciones con ítems. Tablas: `donaciones`, `detalle_donacion`.
3. **Necesidades:** Solicitudes de refugios/hospitales. Tabla: `necesidades`.
4. **Inventario:** Stock de centros de acopio. Tabla: `inventario_acopio`.
5. **Despachos:** Envíos desde acopios a necesidades. Tablas: `despachos`, `incidencias`.
6. **Entregas:** Asignación de voluntarios a recolecciones/distribuciones. Tabla: `entregas`.
7. **Perfil:** Datos de usuarios. Tabla: `perfiles`.
8. **Voluntarios:** Datos de transporte de voluntarios. Tabla: `voluntarios`.

## Mapas de Contexto
- Donaciones se vinculan a Perfil (donante, acopio destino) y Catálogo (detalle_donacion.insumo_id).
- Necesidades se vinculan a Perfil (solicitante) y Catálogo (vía JSONB items, o tabla `detalle_necesidad`).
- Despachos vinculan Inventario (items_despachados), Necesidades (necesidad_id) y Perfil (acopio_id, voluntario_id).
- Entregas vinculan Donaciones o Necesidades, y Voluntarios (por teléfono).

## Matriz Isomórfica
| Campo | UI (HTML5) | Backend (Zod) | Sanitización |
|-------|------------|---------------|--------------|
| email | type="email" | z.string().email() | trim, lowercase |
| password | type="password" minlength="8" | z.string().min(8) | No sanitizar (afecta hash) |
| telefono | type="tel" pattern="[0-9]{7,15}" | z.string().regex(/^[0-9]{7,15}$/) | trim |
| nombre | type="text" maxlength="100" | z.string().min(3).max(100) | trim, escape HTML |
| cantidad | type="number" min="1" | z.number().positive() | — |
| fecha_vencimiento | type="date" | z.string().optional() | — |

## API Design (RFC 7807)
- Éxito: `{ "success": true, "data": {...} }`
- Error: `{ "success": false, "error": { "code": "STRING_ENUM", "message": "Texto legible", "traceId": "uuid" } }`
- Códigos: `AUTH_REQUIRED`, `AUTH_INVALID`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `INTERNAL_ERROR`.

## Estructura de Directorios
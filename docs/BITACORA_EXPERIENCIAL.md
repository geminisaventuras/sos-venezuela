# BITACORA_EXPERIENCIAL.md

#### Arquitecto – 2026-06-29 – Fase 2/3 (Auditoría y Correcciones)

**Decisión/Lección Clave:**
> Centralizar la lógica duplicada en el backend (`_calcularDistancia`, `_upsertCatalogo`) y en el frontend (componentes UI) redujo drásticamente el riesgo de bugs y facilitó el mantenimiento.

**Contexto:**
> El sistema tenía código repetido en 4 repositorios y 6 dashboards. Cualquier cambio obligaba a editar múltiples archivos. Se aplicó el principio SSOT extrayendo utilidades y componentes reutilizables.

**Alternativas Consideradas:**
> - Opción A: Dejar el código duplicado y solo corregir bugs críticos. → Se descartó porque viola el Manual V2.1 y acumula deuda técnica.
> - Opción B (elegida): Refactorizar extrayendo `src/utils/geo.js`, `src/utils/catalogo-helper.js` y componentes frontend. → Se eligió porque alinea el sistema con el principio SSOT sin cambiar reglas de negocio.

**Impacto y Deuda:**
> Se eliminaron ~150 líneas duplicadas. La deuda restante es menor (unificación de mapas del voluntario, inserción masiva de ítems).

**Para el Futuro:**
> Si vuelvo a enfrentar este problema, empezaré por el frontend: identificar patrones repetidos y extraer componentes antes de que la duplicación se propague a más dashboards.

---

#### Arquitecto – 2026-06-29 – Fase 2 (Migración del Catálogo)

**Decisión/Lección Clave:**
> El modelo jerárquico (categorías > ítems > presentaciones) demostró ser muy superior al modelo plano anterior. Permitió representar la realidad médica y alimentaria venezolana sin duplicar ítems.

**Contexto:**
> El catálogo anterior tenía 54 ítems planos con dosis y volúmenes incrustados en el nombre. Los JSON proporcionados por el Operador contenían +200 ítems con una estructura jerárquica natural. Se migró a 3 tablas: `catalogo_categorias`, `catalogo_items`, `catalogo_presentaciones`.

**Alternativas Consideradas:**
> - Opción A: Mantener el modelo plano y agregar más filas. → Se descartó porque no soporta presentaciones dinámicas ni búsqueda eficiente.
> - Opción B (elegida): Migrar a modelo jerárquico. → Se eligió porque permite crecimiento sin dolor, búsqueda semántica y presentaciones predefinidas que evitan errores del donante.

**Impacto y Deuda:**
> El catálogo unificado ahora tiene 75 ítems activos con categorías y presentaciones. La deuda es que algunas categorías (trauma, vía aérea) no se poblaron completamente desde los JSON.

**Para el Futuro:**
> Antes de migrar una estructura de datos, siempre validar con el Operador los flujos de negocio que dependen de ella (búsqueda, creación de ítems, donaciones). La migración del catálogo rompió temporalmente el historial de donaciones porque las referencias cambiaron de tabla.

---

#### Arquitecto – 2026-06-29 – Fase 2 (Middleware de Autenticación)

**Decisión/Lección Clave:**
> Delegar la verificación JWT a `supabaseAdmin.auth.getUser()` en lugar de usar `jwt.verify` manual resolvió problemas de algoritmos (ES256) y eliminó la puerta trasera de `jwt.decode`.

**Contexto:**
> El middleware original tenía un fallback inseguro que aceptaba tokens sin verificar firma. Además, no soportaba tokens ES256 emitidos por Supabase. Se reemplazó toda la lógica por la validación nativa de Supabase.

**Alternativas Consideradas:**
> - Opción A: Seguir usando `jwt.verify` y agregar soporte para múltiples algoritmos. → Se descartó porque requería gestionar claves públicas y mantenimiento manual.
> - Opción B (elegida): Usar `supabaseAdmin.auth.getUser(token)`. → Se eligió porque valida cualquier algoritmo automáticamente y es la opción oficial de Supabase.

**Impacto y Deuda:**
> Se eliminó una vulnerabilidad crítica de suplantación de identidad. Sin deuda asociada.

**Para el Futuro:**
> Siempre preferir las bibliotecas oficiales del proveedor de autenticación sobre implementaciones manuales de JWT. La fragilidad de manejar secretos y algoritmos no justifica el ahorro de una dependencia.
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


# BITACORA_EXPERIENCIAL.md – SOS Venezuela

## [Arquitecto] – 2026-06-29 – Fase de purga de base de datos
**Decisión/Lección Clave:**
> Una auditoría forense de la base de datos eliminó 2 tablas huérfanas, 4 columnas redundantes y políticas RLS inseguras sin afectar la operación.
**Contexto:**
> La base de datos acumulaba artefactos de iteraciones anteriores (detalle_necesidad, detalle_despacho). Se cruzó con el código fuente para confirmar que no estaban referenciadas.
**Alternativas Consideradas:**
> - Opción A: Dejar las tablas "por si acaso" → Descartada: generan confusión y ocupan espacio.
> - Opción B: Eliminarlas → Elegida: simplifica el esquema y mejora la mantenibilidad.
**Impacto y Deuda:**
> Base de datos más limpia y segura. Sin deuda generada.
**Para el Futuro:**
> Ejecutar auditorías similares después de cada fase mayor de desarrollo.

## [Arquitecto] – 2026-06-29 – Normalización del catálogo
**Decisión/Lección Clave:**
> Consolidar duplicados (Acetaminofén → Paracetamol) y limpiar presentaciones autorreferenciales mejoró drásticamente la usabilidad del buscador.
**Contexto:**
> El catálogo tenía ítems con nombres compuestos (ej. "Ibuprofeno 400mg") que impedían búsquedas genéricas. Se normalizaron a nombres base + presentaciones.
**Alternativas Consideradas:**
> - Opción A: Mantener los nombres compuestos → Descartada: el usuario no encontraba "Ibuprofeno" al buscar.
> - Opción B: Separar nombre genérico y presentaciones → Elegida: permite búsquedas limpias y formulario inteligente.
**Impacto y Deuda:**
> Catálogo funcional con 156 ítems en 25 categorías. Cero ítems sin categoría.
**Para el Futuro:**
> Todo nuevo ítem debe crearse con nombre genérico + presentaciones, nunca con el detalle en el nombre.

## [Arquitecto] – 2026-06-30 – Refactorización del flujo del donante
**Decisión/Lección Clave:**
> Separar el dashboard monolítico del donante en 4 páginas independientes con CSS unificado y componentes compartidos eliminó la duplicación de código y armonizó la experiencia visual.
**Contexto:**
> El dashboard original tenía pestañas, CSS duplicado y lógica de negocio mezclada. Se extrajo el CSS a styles.css y cada sección se convirtió en una página HTML dedicada.
**Alternativas Consideradas:**
> - Opción A: Mantener el dashboard con tabs → Descartada: difícil de mantener, viola el principio SSOT.
> - Opción B: Páginas separadas + componentes → Elegida: cada página solo carga los componentes que necesita, cumple con Aislamiento Hermético.
**Impacto y Deuda:**
> Flujo del donante 100% funcional, armonizado y preparado para escalar.
**Para el Futuro:**
> Aplicar el mismo patrón a los demás roles.

## [Arquitecto] – 2026-06-30 – Refactorización del voluntario como SPA
**Decisión/Lección Clave:**
> Implementar una SPA con router hash para el voluntario fue esencial para una experiencia fluida tipo delivery, con mapa persistente entre vistas.
**Contexto:**
> El voluntario necesita cambiar rápidamente entre el radar de viajes, sus viajes activos y su perfil. Una SPA evita recargas del mapa Leaflet, que es costoso de reinicializar.
**Alternativas Consideradas:**
> - Opción A: Páginas separadas como el donante → Descartada: el mapa se recargaría al navegar.
> - Opción B: SPA con hash routing → Elegida: experiencia fluida, mapa vivo entre vistas, estado global en VoluntarioState.
**Impacto y Deuda:**
> Voluntario funcional con exploración, mis viajes, perfil y cancelación con motivo. Las vistas de viaje en curso y perfil son funcionales pero se pueden enriquecer.
**Para el Futuro:**
> Considerar Service Worker para caché offline del mapa (tiles de OpenStreetMap).

## [Arquitecto] – 2026-06-30 – Cancelación de viaje con motivo obligatorio
**Decisión/Lección Clave:**
> Forzar al conductor a indicar un motivo de cancelación (accidentado, no comunicación, ubicación incorrecta, otro) mediante un modal personalizado mejoró la trazabilidad y evitó cancelaciones arbitrarias.
**Contexto:**
> El botón de cancelar solo pedía un confirm() nativo. Se implementó un modal con select de motivos y campo de texto condicional para "Otro", registrando la incidencia en la base de datos.
**Alternativas Consideradas:**
> - Opción A: Mantener el confirm simple → Descartada: no hay trazabilidad de por qué se canceló.
> - Opción B: Modal con motivo + registro en tabla incidencias → Elegida: mejora la auditoría y responsabilidad del conductor.
**Impacto y Deuda:**
> El endpoint PATCH /api/entregas/:id ahora acepta motivo y descripcion opcionales. La tabla incidencias almacena el registro.
**Para el Futuro:**
> Podría añadirse una vista de incidencias en el dashboard de super admin para monitorear cancelaciones.


## [Arquitecto] – 2026-07-01 – SPA del voluntario: vista de viaje activo con ruta, GPS y panel
**Decisión/Lección Clave:**
> Implementar una vista dedicada para el viaje activo con mapa a pantalla completa, ruta real (OSRM), GPS en tiempo real y un panel desplegable mejoró drásticamente la experiencia del conductor.
**Contexto:**
> El voluntario necesitaba una interfaz similar a apps de delivery (Rappi, Uber) que le permitiera ver la ruta, tener acceso rápido a Google Maps y comunicarse con el emisor/receptor.
**Alternativas Consideradas:**
> - Opción A: Mantener las acciones en la vista "Mis Viajes" → Descartada: requería cambiar de pantalla para ver el mapa.
> - Opción B: SPA con vista dedicada `#viaje-activo` → Elegida: mapa persistente, botones de acción grandes, panel desplegable con detalles.
**Impacto y Deuda:**
> La experiencia del conductor es mucho más fluida. Se registraron 4 deudas: botón maps descuadrado, panel no visible, OSRM sin efecto y bloqueo de viajes simultáneos.
**Para el Futuro:**
> Considerar migrar OSRM a un proxy propio para evitar problemas de CORS. Implementar notificaciones push para alertar al conductor cuando está cerca del destino.

## [Arquitecto] – 2026-07-01 – Persistencia y bloqueo de navegación durante viaje activo
**Decisión/Lección Clave:**
> Guardar `viajeEnCurso` en `localStorage` y restaurarlo al cargar la SPA garantiza que el conductor no pierda su viaje si cierra la app o recarga la página.
**Contexto:**
> En entornos hostiles (mala conexión, batería baja), el conductor puede perder la sesión. La persistencia local asegura que pueda retomar el viaje desde "Mis Viajes".
**Alternativas Consideradas:**
> - Opción A: Guardar en el backend → Descartada: requería un endpoint adicional y conexión a internet.
> - Opción B: localStorage + botón "Retomar viaje" → Elegida: funciona offline y no requiere backend.
**Impacto y Deuda:**
> El viaje sobrevive a recargas. Se agregó un botón "Retomar viaje" en la vista "Mis Viajes". Sin deuda.
**Para el Futuro:**
> Sincronizar el estado del viaje con el backend cuando se recupere la conexión para evitar inconsistencias.
# BACKLOG_V2.md — Deuda Técnica y Mejoras

## [MENOR] Extraer componente de mapa reutilizable
- **Origen:** Auditoría R9. Los mapas tienen inicialización similar pero lógica distinta. Se decidió no forzar un componente único.
- **Métricas DORA:** Change Failure Rate bajo, MTTR no aplica.
- **Acción futura:** Si se agregan más dashboards con mapas, reevaluar.

## [MENOR] Unificar los dos mapas del voluntario
- **Origen:** Dashboard de voluntario tiene dos mapas separados (recolección y distribución). Podrían fusionarse con pestañas.
- **Métricas DORA:** Sin impacto actual.
- **Acción futura:** Refactorizar cuando se rediseñe la UI del voluntario.

## [MENOR] Completar inserción masiva de ítems desde JSON
- **Origen:** Los JSON proporcionados contienen +200 ítems. Se insertó una muestra representativa. Quedan categorías por poblar (trauma, vía aérea, quemaduras).
- **Métricas DORA:** Sin impacto funcional inmediato.
- **Acción futura:** Completar con script SQL adicional cuando se requieran esos ítems en producción.

## [MENOR] Implementar CI/CD con SAST/SCA/DAST
- **Origen:** Marco V6.3 Fase 2.5 y 4. Actualmente solo hay pruebas unitarias locales.
- **Métricas DORA:** Change Failure Rate no medido, MTTR manual.
- **Acción futura:** Configurar GitHub Actions con ESLint, npm audit y OWASP ZAP.

## [MENOR] Migrar frontend a framework reactivo ligero
- **Origen:** La duplicación de UI se redujo con componentes manuales, pero un framework como Alpine.js minimizaría el boilerplate.
- **Métricas DORA:** Sin impacto actual, pero reduciría bugs por inconsistencia de estado.
- **Acción futura:** Evaluar en próxima iteración mayor.


# BACKLOG_V2.md – SOS Venezuela

## [DEUDA] Refactorizar Centro de Acopio
- **Origen:** Dashboard original con 4 pestañas monolíticas.
- **Estado:** Pendiente. Aplicar el mismo patrón del donante (páginas independientes por sección).
- **Métricas DORA:** Sin medir aún.

## [DEUDA] Refactorizar Refugio / Hospital
- **Origen:** Dashboards originales con tabs.
- **Estado:** Pendiente.

## [DEUDA] Refactorizar Super Admin
- **Origen:** Dashboard original con tabs.
- **Estado:** Pendiente.

## [DEUDA] Estados "muertos" en restricciones CHECK
- **Origen:** `donaciones_estado_check` incluye `reservada` y `totalmente_rechazada` que no se usan en el código.
- **Estado:** Baja prioridad. No afectan funcionalidad.

## [DEUDA] `entregas.voluntario_telefono` como FK no formal
- **Origen:** La tabla `entregas` referencia al voluntario por teléfono en lugar de `user_id`.
- **Estado:** Podría migrarse a UUID para robustez.

## [DEUDA] Pruebas unitarias de componentes frontend
- **Origen:** Los componentes JS no tienen tests automatizados.
- **Estado:** Pendiente. El MEU-A exige al menos flujo feliz, falla de validación y conflicto.

## [DEUDA] `SECURITY DEFINER` sin `search_path` explícito
- **Origen:** Las RPC `crear_despacho_atomico`, `crear_entrega_atomica` y `crear_item_catalogo` no establecen `search_path`.
- **Estado:** Recomendado agregar `SET search_path = 'public'` por seguridad.

# BACKLOG_V2.md – SOS Venezuela

## [DEUDA] Refactorizar Centro de Acopio
- **Origen:** Dashboard original con 4 pestañas monolíticas.
- **Estado:** Pendiente. Aplicar el mismo patrón del donante (páginas independientes por sección).

## [DEUDA] Refactorizar Refugio / Hospital
- **Origen:** Dashboards originales con tabs.
- **Estado:** Pendiente.

## [DEUDA] Refactorizar Super Admin
- **Origen:** Dashboard original con tabs.
- **Estado:** Pendiente.

## [DEUDA] Estados "muertos" en restricciones CHECK
- **Origen:** `donaciones_estado_check` incluye `reservada` y `totalmente_rechazada` que no se usan en el código.
- **Estado:** Baja prioridad. No afectan funcionalidad.

## [DEUDA] `entregas.voluntario_telefono` como FK no formal
- **Origen:** La tabla `entregas` referencia al voluntario por teléfono en lugar de `user_id`.
- **Estado:** Podría migrarse a UUID para robustez.

## [DEUDA] Pruebas unitarias de componentes frontend
- **Origen:** Los componentes JS no tienen tests automatizados.
- **Estado:** Pendiente. El MEU-A exige al menos flujo feliz, falla de validación y conflicto.

## [DEUDA] `SECURITY DEFINER` sin `search_path` explícito
- **Origen:** Las RPC `crear_despacho_atomico`, `crear_entrega_atomica` y `crear_item_catalogo` no establecen `search_path`.
- **Estado:** Recomendado agregar `SET search_path = 'public'` por seguridad.

## [DEUDA] Bloqueo de viajes simultáneos desde múltiples dispositivos
- **Origen:** Pruebas del 2026-07-01 mostraron que el mismo conductor puede aceptar múltiples viajes desde diferentes navegadores.
- **Estado:** Requiere modificar el backend para validar que el voluntario no tenga una entrega activa antes de crear una nueva. Pendiente de implementar.

## [DEUDA] Botón Google Maps descuadrado
- **Origen:** El ícono del avión de papel no está perfectamente centrado dentro del círculo blanco.
- **Estado:** Pendiente de ajuste CSS en `voluntario.html`.

## [DEUDA] Panel de detalles no visible en viaje activo
- **Origen:** La barra de acciones tapa el asa del panel debido a conflictos de `z-index`.
- **Estado:** Pendiente de corrección en `voluntario.html`.

## [DEUDA] Ruta OSRM sin efecto visual
- **Origen:** La llamada a OSRM no está trazando la ruta real sobre el mapa.
- **Estado:** Pendiente de depuración (posible error CORS o de parseo).

## [DEUDA] Duración total del viaje
- **Origen:** No se muestra el tiempo transcurrido desde que se aceptó el viaje.
- **Estado:** Pendiente. Requiere capturar el timestamp de inicio y calcular la diferencia al finalizar.

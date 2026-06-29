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
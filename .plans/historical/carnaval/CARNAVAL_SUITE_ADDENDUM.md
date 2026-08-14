> ✅ **Implementado.** Fase 10 (Biblioteca Cultural) confirmada:
> `src/app/dashboard/workspaces/[id]/recursos/page.tsx` existe y
> `features/workspaces/carnaval.md` (§6, `status: stable`) la documenta como
> vigente. Verificado y movido a `docs/historical/carnaval/` el 2026-08-13.

# Plan Técnico de Implementación: Adenda (Fase 10 y 11)
## ArtSanctuary Carnaval Workspace

Esta adenda detalla la finalización de la implementación del módulo de acreditación para el Carnaval, específicamente las fases 10 y 11.

---

## Fase 10 — Biblioteca Cultural y Recursos Oficiales

### Objetivo
Integrar la documentación oficial dentro del ecosistema de modo que el artesano tenga acceso directo a todo el material necesario sin abandonar ArtSanctuary.

### Implementación
Se ha creado una nueva sección `RecursosCulturalesScreen` accesible desde el panel de control del proyecto, que contiene:
- **Comunicados de Corpocarnaval:** Fechas importantes y cronogramas.
- **Guías de acreditación:** Instrucciones paso a paso.
- **Reglamentos históricos y vigentes:** Documentación técnica oficial.
- **Plantillas oficiales:** Formatos y reglas para los planos requeridos.

Todo integrado bajo la misma interfaz fluida del Workspace, utilizando iconos y diseño congruente.

---

## Fase 11 — Optimización de Rendimiento (Nuevo)

### Objetivo
Resolver los cuellos de botella de red y base de datos detectados durante la navegación de los proyectos de Carnaval. Se evidenció que Endpoints como `/api/carnaval-projects/[id]/versions` tardaban hasta 8 segundos en resolver la petición.

### Análisis del Problema
La latencia masiva era causada por dos factores:
1. **Sobrecarga de Datos en Consultas:** Al listar las versiones de un proyecto, Mongoose extraía el árbol completo de `objects` (elementos JSON del lienzo de dibujo). Para proyectos con cientos de formas, esto significaba mover megabytes de datos a la memoria de Node.js solo para contabilizar cuántos objetos había.
2. **Serialización Redundante:** El uso de `JSON.parse(JSON.stringify(projects))` bloqueaba el Event Loop sincrónicamente procesando los árboles de objetos.

### Solución Implementada
1. **Modificación del Modelo:** Se agregó el campo `objectCount` pre-calculado en `IVersionPlano` (en `CarnivalProjectVersion.ts`) para evitar tener que inspeccionar los objetos.
2. **Exclusión en Mongoose:** Se aplicó `.select("-planos.objects -planos.background")` en las consultas de listado para filtrar campos pesados desde la base de datos MongoDB.
3. **Optimización HTTP:** Se eliminó la doble serialización redundante, confiando en la serialización nativa y asíncrona de Next.js `NextResponse.json()` que ya soporta `ObjectIds` de Mongoose de forma eficiente.

### Beneficio
Se redujo el impacto de I/O en la DB y de RAM en el servidor. Los endpoints que tardaban segundos ahora se resuelven en milisegundos, mejorando de manera drástica el **Time to Interactive (TTI)** y la experiencia final del usuario.

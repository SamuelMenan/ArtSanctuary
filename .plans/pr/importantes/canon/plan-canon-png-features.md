# Plan — Wishlist de Canon reevaluado bajo arquitectura PNG

**Fecha:** 2026-06-06
**Relacionado:** `docs/pr/importantes/canon/plan-canon-png-refactor.md` (refactor a nivel de código/funciones).
Este documento toma la **propuesta original de 11 mejoras** (que asumía un maniquí
**procedural** generado por código) y la reevalúa contra la **arquitectura final**:
una **lámina PNG limpia por canon y por vista** + interfaz dibujada por código
(`ProportionChart`) posicionada por `frac` medido.
**Estado** completado

## Cambio de premisa (lo que invalida media propuesta)

La propuesta original ponía como **prioridad máxima** rediseñar el maniquí procedural
(estilo Loomis/Hampton) generado por código. Esa premisa **ya no aplica**: el usuario
aportó **láminas profesionales en PNG**, que son justamente la calidad "Loomis/Hampton"
que el maniquí procedural nunca alcanzaría por código.

Consecuencia: todo lo que dependía de **generar o modular geometría corporal por código**
(articulaciones procedurales, masas, anchuras paramétricas, tipos corporales,
estilización interpolada, export SVG vectorial, canon personalizado) **queda obsoleto o
muta** a "más assets PNG" u "overlay por `frac`". Lo que dependía de **datos + overlay**
(medidas, divisiones, comparador, presets, vistas, capas como marcadores) **se mantiene**.

---

## Tabla maestra (11 propuestas)

| # | Propuesta original | Estado bajo PNG | Qué queda |
|---|---|---|---|
| 1 | **Rediseño del maniquí (procedural)** | **OBSOLETO / RESUELTO** | El "maniquí" es la lámina PNG. La meta de calidad se logra con raster, no con código. Sub-ítems (articulaciones, masas, anchuras naturales) ya **vienen en el dibujo**; lo único portable es un overlay opcional de articulaciones por `frac` (→ #11). |
| 2 | **Múltiples cánones** | **SE MANTIENE / CAMBIA** | `headCount` por canon sigue rigiendo divisiones/título. Pero cada canon = **sus 3 PNG + `frac`/dims medidos**, no un slider sobre una figura. "Canon personalizado" → **OBSOLETO** (no se genera raster a medida; a lo sumo grilla de divisiones sin cuerpo). |
| 3 | **Medidas anatómicas detalladas** | **SE MANTIENE / CAMBIA** | `measurements.ts` ya da anchos+largos. Hoy son **ratios teóricos** (Loomis); para fidelidad con el dibujo conviene **medirlos por canon** o rotularlos "referencia académica". |
| 4 | **Exportación a escala real** | **SE MANTIENE / CAMBIA** | Sigue pendiente (#4 del refactor). **SVG vectorial → OBSOLETO** (la figura es raster). Export = **PNG alta-res / PDF (A4 multipágina, póster)** del chart. "Escala real" sale de `heightCm` ↔ px conocidos. |
| 5 | **Tipos corporales (neutral/masc/fem)** | **CAMBIA (assets) / OBSOLETO (paramétrico)** | No se modulan anchos del raster por código. Se vuelve **otra familia de láminas** (masc/fem = sets PNG aparte, como un eje más de canon). Sin imágenes nuevas, no hay feature. |
| 6 | **Control de estilización (slider realista↔heroico)** | **OBSOLETO** | Los rasters no se interpolan. Se sustituye por **conmutar entre cánones** (#2) con **cross-fade** (motion). |
| 7 | **Medidas superpuestas sobre la figura** | **HECHO** | Es exactamente `ProportionChart` (labels + cm + líneas de división/landmark sobre la lámina). Implementado. |
| 8 | **Comparador de 2 figuras** | **SE MANTIENE** | Dos `ProportionChart` lado a lado (distinto canon/altura/vista). Directo, sin geometría nueva. |
| 9 | **Presets** | **SE MANTIENE (simplificado)** | Guardar `{canon, altura, vista, unidades}`. Más simple que antes (sin tipo corporal/estilización paramétricos). Decisión: localStorage vs Mongo. |
| 10 | **Vista lateral** | **HECHO+** | Ya hay **3 vistas** por canon (frontal/lateral/posterior), supera las 2 propuestas. |
| 11 | **Capas anatómicas (esqueleto/músculos/articulaciones/landmarks)** | **CAMBIA** | Landmarks ya existen (líneas por `frac`). Articulaciones = overlay ligero por `frac` (viable). Esqueleto/músculos = **PNG overlay por canon-vista** (assets pesados) **o** SVG genérico aproximado. Reevaluar prioridad/coste. |

---

## Detalle por feature

### #1 Maniquí — RESUELTO por raster
- Borrado el procedural (`anatomy.ts`/`FigureSvg.tsx`).
- La calidad visual ahora la define el PNG aportado por el usuario.
- **Portable:** marcadores de articulaciones (hombros/codos/muñecas/caderas/rodillas/
  tobillos) como puntos por `frac` sobre la lámina → encaja en #11 como capa opcional.
- **No portable:** "formas orgánicas / cilindros / masas" generadas por código (las trae el dibujo).

### #2 Múltiples cánones — pipeline de assets
- Mantener `CANONS` (`headCount` → divisiones/título/`headCm`).
- Selector en `CanonScreen` **filtrado a cánones con láminas** (no ofrecer carpetas vacías).
- Añadir canon = 3 PNG + dims (`FIGURES`) + `frac` (`CANON_LANDMARKS`). Ver pipeline en el refactor.
- "Canon personalizado": sin cuerpo raster propio → como mucho, grilla de N divisiones sobre una lámina base. Baja prioridad.

### #3 Medidas detalladas
- `buildMeasurements`: anchos (del canon) + largos (`LENGTH_HEADS`, ratios Loomis).
- **Riesgo:** no calzan necesariamente con el dibujo. Opciones:
  - (a) Rotular panel como "referencia académica" (rápido).
  - (b) Medir largos/anchos por canon sobre el PNG y guardarlos junto a `frac` (fidelidad total).

### #4 Export a escala real
- Capturar `ProportionChart` (html2canvas → PNG; jsPDF → PDF). Sin libs nuevas.
- PDF A4 multipágina / póster: tiling raster con escala `cm→px` desde `heightCm`.
- Descartar SVG vectorial de la figura (es raster); el chart-overlay sí podría exportarse aparte como SVG si se quisiera.

### #5 Tipos corporales
- Solo viable como **sets PNG** masc/fem (más assets, con sus `frac`).
- Modelarlo como dimensión extra de la lámina: `public/canon/<id>/<bodyType>/<view>.png` (si se decide). Reevaluar si vale el costo de assets.

### #6 Estilización
- Eliminar como slider continuo. Reemplazo: transición animada entre láminas de cánones (discreto).

### #7 Medidas sobre figura — listo
- `ProportionChart` ya lo hace. Posible mejora: toggle para ocultar/mostrar labels o líneas.

### #8 Comparador
- Dos `ProportionChart` en paralelo; reusar el componente tal cual con props distintas.

### #9 Presets
- `{canonId, heightCm, view, unidades}`. localStorage (rápido, local) vs Mongo (sincroniza). Decisión.

### #10 Vistas — listo (3)
- Ya implementado. Falta opcional: selector visual (tabs) en vez de `<select>`.

### #11 Capas anatómicas
- **Ligero (viable ya):** articulaciones + puntos Loomis como overlay por `frac`.
- **Pesado:** esqueleto/caja torácica/músculos como PNG por canon-vista (muchos assets) o SVG genérico que no calza fino con cada dibujo. Reevaluar.

---

## Prioridades revisadas

### Fase 1 — cerrar la base (alto impacto, bajo costo)
1. **Export PNG/PDF** del chart (#4 sin SVG). 
2. **Selector multi-canon filtrado** (#2) — listo para cuando lleguen más láminas.
3. **Medidas:** decidir teórico vs medido y rotular (#3).
4. Toggle de capas básicas: labels / divisiones / articulaciones por `frac` (#7/#11 ligero).

### Fase 2 — multi-asset + persistencia
5. Sacar y calibrar láminas de los otros cánones (#2).
6. **Presets** `{canon,altura,vista,unidades}` (#9).
7. **Comparador** de 2 figuras (#8).
8. Unidades cm/in/cabezas (#3).

### Fase 3 — avanzado / costoso
9. **Tipos corporales** como sets PNG (#5) — si se justifican los assets.
10. **Capas anatómicas pesadas** (esqueleto/músculos) (#11).
11. Transición animada entre cánones (ex-#6, ya no slider).

---

## Lo que muere de la propuesta original
- Rediseño procedural del maniquí (#1) → resuelto por PNG.
- Slider de estilización interpolado (#6) → discreto.
- Export SVG **de la figura** (#4) → raster.
- Canon personalizado generado (#2) y tipos corporales paramétricos (#5) → solo como assets.
- Unificar la figura del Canon con la silueta `humanFigure` de Carnaval → ya no hay vector que unificar.

## Lo que ya está hecho
- Medidas sobre la figura (#7), vistas múltiples (#10, incluso 3), base multi-canon de datos (#2).

---

Relacionado: `docs/pr/importantes/canon/plan-canon-png-refactor.md`, `docs/pr/importantes/carnaval/CARNAVAL_SUITE_IMPLEMENTATION_PLAN.md`.
Memoria: `canon-improvement-plan`.

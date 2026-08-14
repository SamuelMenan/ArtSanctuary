---
title: "Canon (atlas de proporción anatómica)"
audience: frontend, architecture
status: stable
updated: 2026-08-14
owner: TBD
---

# Canon

> **Ubicación:** `src/frontend/features/tools/canon/` (UI) +
> `src/shared/lib/canon/` (motor de datos, sin React).
> **Ruta:** `/dashboard/tools/canon`. **100% cliente** — sin endpoints API,
> sin DB. Presets en `localStorage`.

Atlas anatómico: dibuja una figura humana proporcional a cualquier altura y
canon (sistema de proporción en "cabezas") y superpone referencias de
medida, esqueleto, músculos, y landmarks. La pieza más grande y compleja del
repo — sin este doc, la única forma de entenderla era leer los 13 planes de
`.plans/pr/importantes/canon/`.

## Por qué no hay un solo doc "canónico" más detallado

Canon tuvo ~6 generaciones de iteración documentadas en
`pr/importantes/canon/plan-canon-*.md` y 3 ADRs propios (0010, 0012, 0013).
Este doc da el mapa de navegación; el detalle de *por qué* cada pieza es como
es vive en esos planes — especialmente
[`arquitectura.md`](../../../.plans/pr/importantes/canon/arquitectura.md) (la espina)
si vas a tocar algo no trivial.

## Arquitectura (3 capas, ver ADR-0012)

1. **Datos — `src/shared/lib/canon/`** (puro, sin React, testeado — 7 de 10
   archivos tienen `.test.ts`):
   - `canons.ts` — los cánones en sí (proporción en `heads` por segmento del cuerpo). Fuente única; añadir un canon = una entrada aquí.
   - `figure.ts` — `buildFigure({ canonId, heightCm })`: motor que calcula todas las medidas reales a partir del canon + altura.
   - `units.ts` — conversión cm/in/heads + formato.
   - `measurements.ts` — medidas por vista (frontal/posterior = anchos+escápulas; lateral = profundidades) con Δ vs. `anatomyFacts.ts`.
   - `landmarks.ts` — posición de articulaciones/puntos anatómicos, por canon-vista.
   - `anatomyFacts.ts` — hechos+reglas+fuente (Vitruvio/Richer/Loomis/Bridgman/antropometría). Regla dura: sin fuente, no entra un dato.
   - `anatomyParts.ts` — atlas de partes del cuerpo (canon-agnóstico), con sub-partes (mano→dedos, etc.).
   - `partHits.ts` — regiones clicables **por canon-vista** (path SVG que sigue el contorno real, nunca cajas — decisión P9 / ADR-0013). Mientras un canon-vista no esté trazado, esa vista simplemente no es interactiva.
   - `muscleColors.ts` — paleta del mapa de músculos.

2. **Presentación — `components/`** (19 archivos), por responsabilidad:

   | Grupo | Componentes | Qué hace |
   |---|---|---|
   | Lámina base | `ReferenceFigure`, `ZoomPanViewport` | Pinta el PNG del canon con fallback y gestiona zoom/pan. |
   | Interfaz medida | `ProportionChart`, `ChartAxis`, `LandmarkLabel`, `ChartCrossfade` | Dibuja por código lo que la lámina no trae: landmarks, líneas y cotas, posicionados por `frac` **medido**, nunca a ojo. |
   | Overlays anatómicos | `FigureOverlays`, `GhostFigure`, `LoomisOverlay`, `MuscleMapLayer`, `PartHitLayer` | Capas conmutables sobre la lámina (comparación fantasma, cajas de Loomis, mapa muscular, zonas clicables). |
   | Paneles | `CanonMeasuresPanel`, `CanonPartPanel`, `CanonComparePanel` | Árbol de medidas, ficha de la parte seleccionada, vista A/B. |
   | Controles | `CanonControls`, `CanonLayersRail`, `CanonExportRail`, `RailButton`, `SourceBadge` | Selectores, raíles de capas y export, y la insignia de procedencia del dato. |

3. **Interacción — `hooks/` + `lib/` + `screens/CanonScreen.tsx`**:
   `useCanonTool.ts` centraliza **todo** el estado (canon, altura, vista,
   unidad, capas, comparación A/B, parte seleccionada, presets) y expone
   handlers; `useTraceMeasure.ts` gestiona la medición manual sobre la lámina.
   `CanonScreen.tsx` es composición pura, sin lógica propia.

   `lib/` (8 archivos) es el pegamento **específico de la UI**, distinto del
   motor puro de `shared/lib/canon/`: `figureMeta` (rutas y dims intrínsecas de
   cada lámina + fallback a heroico), `chartLayers` (qué capas existen y sus
   defaults), `figureGeom`, `joints`, `overlays` (assets por capa),
   `presets` (localStorage), `exportChart` (redibuja en `<canvas>` con la misma
   matemática para PNG/PDF) y `boardHandoff` (enviar la lámina a Boards).

## Assets

Láminas PNG limpias en `public/canon/<canonId>/{frontal,lateral,posterior}.png`
— un canon sin sus 3 láminas cae automáticamente a `heroic` (fallback, ver
`figureMeta.ts:FIGURES`). El mapa de músculos frontal se traza sobre
`musculos.png` (dibujo del usuario, re-exportado alineado a `frontal.png` —
ver ADR-0010 para por qué no se generó por código).

## Funcionalidad activa

6 cánones · capas (canon/anatomía/anchos/Loomis/esqueleto/músculos/
articulaciones) · unidades (cm/in/heads) · presets (`lib/presets.ts`,
`localStorage`) · calco/regla (medición manual sobre la lámina) · comparar
(dos figuras lado a lado) · superponer (ghost de otro canon) · **enviar a
Boards** (`lib/boardHandoff.ts` — deja la lámina pendiente vía estado
compartido, el primer editor de Boards que monte la inserta) · export
PNG/PDF/PDF-a-escala (`lib/exportChart.ts`) · zoom/pan · medidas con Δ vs.
referencia antropométrica · **hover/clic interactivo** en partes del cuerpo
(`PartHitLayer` + `CanonPartPanel` — ficha de la parte seleccionada, con
imagen dedicada o fallback de zoom CSS a la región).

## Estado y trabajo pendiente conocido

Ver `pr/importantes/canon/` (bundle activo, no cerrado — no fragmentar sin
releer `arquitectura.md` primero):
- Vista lateral del hover interactivo (N5) — diferida.
- Sub-partes de torso/pierna en el atlas — diferidas.
- Bloque D (láminas dedicadas por parte del cuerpo, cientos potenciales) —
  el sistema degrada limpio a zoom de la lámina principal mientras falten.
- 3 ajustes finos de bordes en el mapa muscular frontal (§6 de
  `plan-canon-afinar-bordes-frontal.md`).

## Tests

`src/shared/lib/canon/*.test.ts` (7 archivos: `anatomyParts`, `figure`,
`landmarks`, `measurements`, `partHits`, `regions`, `units`). Cero tests de
componentes — ver [`../../contributing/testing.md`](../../contributing/testing.md).

## Referencias

- [ADR-0010](../../adr/0010-canon-muscle-mapping-strategy.md) — estrategia de mapeo muscular (clasificación por píxel).
- [ADR-0012](../../adr/0012-canon-purity-and-scaling.md) — pureza de datos y escalado relativo.
- [ADR-0013](../../adr/0013-canon-vector-vs-raster.md) — raster para arte, vector (path) para hit-tests.
- [`architecture/canon-muscle-mapping.md`](../../architecture/canon-muscle-mapping.md) — arquitectura final del mapeo muscular en detalle.
- [`pr/importantes/canon/arquitectura.md`](../../../.plans/pr/importantes/canon/arquitectura.md) — espina completa (capas, invariantes, puntos de extensión).

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Verificado: `CanonScreen.tsx`, `useCanonTool.ts`, `canons.ts`, `figureMeta.ts`, `partHits.ts` leídos directamente. Confirmado sin llamadas a `fetch`/`/api/` en todo `tools/canon/` (`grep` sin resultados) — 100% cliente.
- Los 19 componentes y 8 libs verificados con `ls` (la versión anterior decía
  "14 archivos" en `components/`). El conteo de 14 regiones del mapa muscular
  frontal contrastado contra `partHits.ts` — coincide.

# Plan — Refactor Canon a láminas PNG por canon

**Fecha:** 2026-06-06
**Estado:** F1 + F2 (todo lo que no necesita imágenes) COMPLETOS. Falta solo lo que depende de generar las láminas de los otros cánones + F3 pesado.

## Resumen de estado

### ✅ HECHO
- **Arquitectura PNG por canon** — `public/canon/<id>/{frontal,lateral,posterior}.png`; `ReferenceFigure` (dims + fallback), `figureSrc`/`resolveCanonId`/`AVAILABLE_CANON_IDS`.
- **Chart por código** — `ProportionChart` (título, landmarks izq/der, líneas, medidas) posicionado por `frac`.
- **Calibración heroico** — figura real = 8 cabezas (medido), no 7.5.
- **Sistema DUAL** — capas independientes `{canon, anatomy}`: Canon = divisiones geométricas i/N; Anatomía = landmarks reales medidos (no forzados). Toggles separados.
- **Validación anatómica** — `ANATOMY_REFERENCE` (rangos en cabezas) + desviación Δ por ancho/largo; panel con color dentro/fuera. Canon inmutable.
- **Landmarks por lado** — `side` alternado (anti-solape).
- **Export PNG/PDF** — `exportChart` redibuja en canvas (sin html2canvas; jsPDF). Respeta capas + unidad.
- **Unidades** cm/in/cabezas — `units.ts` + selector.
- **Selector de canon** filtrado a los que tienen láminas (oculto si ≤1).
- **Presets** (localStorage) + **persistencia** de última config.
- **Comparador** de 2 figuras (`CanonComparePanel`).
- **Transición motion** (`ChartCrossfade`) al cambiar vista/canon.
- **Recorte de modelo** — `FigureModel.segments`/`segmentBoundaries` eliminados (sin uso).
- Lógica de pantalla en `hooks/useCanonTool.ts`. tsc/eslint/i18n limpios, 18 tests verdes.

### ⏳ FALTA — depende de generar las LÁMINAS (child/average/academic/comic)
- Sacar las 3 vistas (frontal/lateral/posterior) de cada canon. Prompts en `docs/helps/canon-image-prompts.md`.
- Medir `frac` + dims de cada lámina (regla de píxeles) y cargarlas (`FIGURES` + `CANON_LANDMARKS`).
- Comparar Δ anatómico entre cánones (el objetivo del usuario).
- (El selector, comparador y crossfade entre cánones se activan solos al haber ≥2.)

### ⏳ FALTA — F3 (más pesado / opcional)
- Capas anatómicas (esqueleto/músculos) → requiere assets extra por canon-vista.
- Enviar lámina a Board/Carnaval (handoff).
- Articulaciones como overlay (necesita posición x por dibujo).

> Detalle por checkbox abajo. Lo OBSOLETO (maniquí procedural, slider estilización, export SVG, unificar `humanFigure`) ver `docs/pr/importantes/canon/plan-canon-png-features.md`.

## Contexto y cambio de enfoque

La herramienta **Canon** (`src/frontend/features/tools/canon/`) nació como calculadora de
proporciones con una figura **vectorial/procedural** generada por código (cápsulas,
paths SVG paramétricos). El usuario rechazó esa figura por calidad y aportó **láminas
profesionales en PNG**.

Decisión actual: **una lámina raster (PNG) por canon y por vista**
(`public/canon/<canonId>/{frontal,lateral,posterior}.png`). La "interfaz" del canon
(título, landmarks, líneas de división, medidas, altura total) se **dibuja por código
por encima/al lado** de la imagen limpia, posicionada por fracción de altura medida
sobre cada dibujo.

Consecuencia clave: la geometría del cuerpo deja de ser **derivada** (segmentos
en unidades-cabeza → coordenadas) y pasa a ser **medida** sobre el dibujo real. Esto
cambia qué parte del modelo paramétrico sigue siendo útil.

### Hallazgo de calibración
La lámina actual NO es 7.5 cabezas (académico) como decía su rótulo: medida con regla
de píxeles es **8 cabezas (heroico)**. Las divisiones de 8 caen exactas en
mentón(12.5%)/pezones(25%)/ombligo(37.5%)/entrepierna(50%)/rodillas(62.5%)/
pantorrillas(75%)/planta(100%). Por eso el tool quedó lockeado a `heroic`.

---

## Qué se mantiene / cambia / queda obsoleto

### `src/shared/lib/canon/`

| Símbolo | Estado | Nota |
|---|---|---|
| `canons.ts` → `CANONS`, `headCount` | **SE MANTIENE** | `headCount` sigue siendo la fuente de las divisiones (`divisionMarks`), el título ("N cabezas") y `headCm`. |
| `canons.ts` → `segments[]` (head/thorax/…/feet en cabezas) | **OBSOLETO (UI)** | Eran para la figura procedural. Ningún componente los consume ya (la posición vertical ahora es `frac` medido). Solo los usa `figure.test.ts`. Se pueden conservar como dato histórico/validación o adelgazar (ver Decisiones). |
| `canons.ts` → `widths` (shoulders/waist/pelvis/limb) | **SE MANTIENE (parcial)** | `shoulders`/`pelvis` alimentan `MeasurementsPanel`. `waist`/`limb` sin consumidor. Son **teóricos**, no medidos sobre el dibujo (ver Cambia). |
| `canons.ts` → `getCanon`, `CANON_LIST`, `DEFAULT_CANON_ID` | **SE MANTIENE / CAMBIA** | `DEFAULT_CANON_ID` global queda en `academic` (lo usa Carnaval). El tool usa su propio default `heroic`. `CANON_LIST` debe **filtrarse a cánones con láminas** para el selector. |
| `figure.ts` → `buildFigure` | **SE MANTIENE** | Sigue dando `headCm`, `heightCm`, `headCount`, `widthsCm`. |
| `figure.ts` → `FigureModel.segments`, `segmentBoundaries()` | **OBSOLETO (UI)** | Sin consumidor fuera de tests. Candidato a recorte. |
| `measurements.ts` → `buildMeasurements`, `LENGTH_HEADS` | **SE MANTIENE / CAMBIA** | Largos por ratios Loomis (teóricos). Útiles como referencia, pero **no garantizan calzar** con el dibujo. Opción: medir largos por canon (ver Cambia). |
| `landmarks.ts` → `CANON_LANDMARKS`, `getLandmarks`, `divisionMarks` | **NUEVO / NÚCLEO** | Eje del nuevo enfoque. `frac` (0..1) medido por canon. |

### `src/frontend/features/tools/canon/`

| Archivo | Estado | Nota |
|---|---|---|
| `components/ReferenceFigure.tsx` | **CAMBIA** | Ruta `/canon/<canonId>/<view>.png`; `FIGURES[canonId]` con dims intrínsecas; fallback a heroico. Render por altura (w auto). |
| `components/ProportionChart.tsx` | **NUEVO** | Interfaz por código: landmarks (izq, cm), líneas división + landmark (centro), nº división + ALTURA TOTAL (der). Posición por `mapFrac`. |
| `components/MeasurementsPanel.tsx` | **SE MANTIENE** | Panel complementario (anchos + largos). Revisar si sus valores teóricos conviven bien con la lámina medida. |
| `components/FigureMeasureOverlay.tsx` | **BORRADO** | Overlay del layout viejo (lámina anotada 1024×1536). Reemplazado por `ProportionChart`. |
| `screens/CanonScreen.tsx` | **CAMBIA** | Lockeado a `heroic`; input altura + selector vista. Botón export **sigue muerto** (cablear). |

### Acoplamientos externos

| Símbolo | Estado | Nota |
|---|---|---|
| `workspaces/carnaval/lib/humanFigure.ts` | **SE MANTIENE / DESACOPLA** | Genera la silueta SVG de Carnaval (académico 7.5, hombros 15cm). Es **independiente** del raster del tool. La tarea histórica "unificar la figura del Canon con `humanFigure`" queda **OBSOLETA**: el Canon ya no produce vector que unificar. |
| Procedural mannequin (`anatomy.ts`, `FigureSvg.tsx`) | **YA BORRADO** | Enfoque abandonado. |

---

## Pipeline para agregar un canon (escalable, 3 pasos)

Cada canon = 3 PNG limpios + 2 entradas de datos:

1. **Imágenes:** `public/canon/<id>/{frontal,lateral,posterior}.png` (figura limpia,
   recorte ceñido coronilla→planta, sin anotaciones).
2. **Dims:** entrada en `FIGURES` de `ReferenceFigure.tsx` con el tamaño intrínseco
   real (px) de cada vista (para el aspecto de `next/image`).
3. **Landmarks:** entrada en `CANON_LANDMARKS` de `landmarks.ts` con los `frac` (0..1)
   medidos sobre el dibujo (mentón, cuello, hombros, pecho, ombligo, entrepierna,
   rodillas, pantorrillas, pies).

Medición de `frac` y dims: regla de píxeles (System.Drawing) — ver método en la
sección Calibración. Las 3 vistas de un canon comparten alturas verticales (frontal ≈
lateral ≈ posterior en Y), así que un set de `frac` sirve para las 3.

`ids` de canon: `child(6) · average(7) · academic(7.5) · heroic(8) · comic(8.5)`.
Hoy solo `heroic` tiene láminas; el resto son carpetas vacías (`.gitkeep`).

---

## Método de calibración (regla de píxeles)

1. Volcar regla `0–100%` sobre cada PNG (líneas cada 1–5%, etiquetadas) escalando ×2.5–3.
2. Leer cada landmark contra la regla (zoom por mitades para precisión).
3. Verificar superponiendo divisiones (`i/headCount`) + landmarks medidos en rojo;
   ajustar hasta que las divisiones del `headCount` correcto calcen con la anatomía.
4. Confirmar el `headCount`: la cabeza (coronilla→mentón) = `1/headCount` de la altura.

Salidas de debug en `C:\tmp\` (rulers/verify). Reproducible para cada canon nuevo.

---

## Roadmap revisado

### F1 — Base PNG (EN CURSO, casi cerrada)
- [x] `ReferenceFigure` por canon (path + dims + fallback).
- [x] `ProportionChart` (interfaz por código, posición por `frac`).
- [x] `landmarks.ts` por canon (`CANON_LANDMARKS` + `getLandmarks` + `divisionMarks`).
- [x] Calibración heroico (8 cabezas) verificada.
- [x] Estructura de carpetas por canon.
- [x] **#4 Export PNG/PDF** — `lib/exportChart.ts` redibuja el chart en `<canvas>` con la misma matemática `frac` (sin html2canvas; PNG nativo + jsPDF). Botones cableados en `CanonScreen` con estado `exporting`. i18n `canon.exportPdf`.
- [x] **Toggle de capas** — `ChartLayers {labels,divisions,guides}` + `DEFAULT_LAYERS` en `ProportionChart`; toggles en `CanonToolbar` (extraído de `CanonScreen`); respetado por `ProportionChart` y `exportChart`. i18n `canon.divisions`/`canon.layers`.
- [x] **Landmarks por lado** — `Landmark.side 'left'|'right'` alternado (anti-solape de cabeza/cuello/hombros); columnas izq/der en chart y export.
- [x] **Limpieza modelo:** `FigureModel.segments` + `segmentBoundaries()` eliminados (sin consumidor UI). `canons.ts` conserva `segments` (valida headCount). Tests ajustados (16 verdes).

### F2 — Multi-canon real
- [x] Láminas de **academic (7.5)** y **comic (8.5)** generadas y cableadas. child/average DESCARTADOS (kid imposible por T&C IA; average redundante con academic) — quitados de `CANONS` + i18n.
- [x] **Eje femenino modelado** — `academic-female`/`heroic-female`/`comic-female` en `CANONS` (misma altura por nº cabezas; anchos femeninos: hombros estrechos, cintura marcada, pelvis ancha) + i18n. Carpetas `public/canon/<id>-female/` vacías; prompts en `docs/helps/canon-image-prompts-female.md`. No aparecen en selector hasta tener lámina (filtrado por `FIGURES`).
- [x] Selector de canon en `CanonScreen`, **filtrado a cánones con láminas** (`AVAILABLE_CANON_IDS` de `ReferenceFigure`; se oculta si solo hay 1). Canon es estado, `buildFigure({canonId})`. Ahora 3 cánones visibles.
- [x] **Dims** de academic/comic en `FIGURES` (medidas con regla de píxeles; comic recortado a bbox alpha para convención coronilla→planta). **`frac`** de academic/comic en `CANON_LANDMARKS` (proyectados en unidades-cabeza desde el set heroico medido; pendiente afinar por medición directa de cada lámina).
- [x] Transición animada (motion) — `ChartCrossfade` (AnimatePresence mode=wait, `transition.base`) al cambiar vista/canon; en chart único y comparador. Visible ya al cambiar de vista; cubrirá canon cuando haya más láminas.
- [x] **Persistir última config** — `presets.ts` `loadLastConfig`/`saveLastConfig` (localStorage `canon:last`); `useCanonTool` restaura al montar (si el canon sigue disponible) y autosave en cada cambio.
- [x] **Unidades cm / in / cabezas** — `shared/lib/canon/units.ts` (`convert`/`formatValue`, +tests). Selector en toolbar; aplicado en ProportionChart, MeasurementsPanel y export.
- [x] **Presets** — `lib/presets.ts` (localStorage; `list/save/delete`); barra `CanonPresets`; guarda `{canon,altura,vista,unidad,capas}`.
- [x] **Comparador 2 figuras** — `CanonComparePanel` (lado A solo-lectura, lado B con mini-controles canon/altura/vista; comparten unidad+capas). Toggle en toolbar. Lógica en hook `useCanonTool`.
- Nota refactor: lógica de `CanonScreen` movida a `hooks/useCanonTool.ts` (componente < 120 líneas).
- [x] **Sistema DUAL canon/anatomía** — capas independientes `ChartLayers {canon, anatomy}`: canon = divisiones geométricas i/N; anatomía = landmarks REALES medidos (no forzados al canon). Toggles separados.
- [x] **Validación anatómica (desviación)** — `measurements.ts`: `ANATOMY_REFERENCE` (rangos en cabezas, independientes del canon) + `withinRef` + `deviation` (canon − centro del rango) por ancho/largo. Canon INMUTABLE; la anatomía solo compara/valida. Panel muestra rango + Δ con color (verde dentro / ámbar fuera). +tests.

### F3 — Extras (reevaluados bajo PNG)
- [x] **Enviar a Board:** botón "Enviar a tablero" en la barra → `boardHandoff.ts` deja la ruta de la lámina en sessionStorage y navega a `/dashboard/tools/boards`; el primer `BoardEditor` que monta la consume (`takePendingFigure` → `addImage`) y limpia la llave. Desacoplado, sin elegir board de antemano.
- [x] **Capas anatómicas (esqueleto/músculos) — scaffolding listo:** `lib/overlays.ts` (`OVERLAY_ASSETS` registry VACÍO + `overlaySrc`/`hasOverlay`/`canonHasOverlay`); `ChartLayers` ahora incluye `skeleton`/`muscles` (default OFF); `ProportionChart` pinta el PNG overlay (`next/image fill object-contain`, alineado coronilla→planta); toggle en barra SOLO si hay asset (`extraLayers`). Carpetas `public/canon/<id>/overlays/` creadas. **Falta solo:** generar los PNG y listarlos en `OVERLAY_ASSETS`.
- [x] **Articulaciones como overlay — scaffolding listo:** `lib/joints.ts` (`CANON_JOINTS` VACÍO + `getJoints`/`hasJoints`; `Joint{key,x,frac}` con x horizontal porque hombros/codos/etc. no van en el eje); `ChartLayers.joints` (default OFF); `ProportionChart` pinta puntos en `x*100% / mapFrac(frac)`; toggle solo si hay data. **Falta solo:** medir la `x` (y `frac`) de cada articulación por canon-vista y poblar `CANON_JOINTS` + claves `canon.jointNames.*`.
- [x] **Comparador 2 figuras:** hecho en F2 (`CanonComparePanel`).
- [ ] ~~Slider de estilización que interpola cánones~~ **OBSOLETO**: no se interpolan rasters; se sustituye por conmutar entre láminas.
- [ ] ~~Unificar figura del Canon con `humanFigure` (Carnaval)~~ **OBSOLETO**.

---

## Decisiones abiertas

1. **`segments`/`segmentBoundaries`:** ¿recortar de `FigureModel` (y sus tests) por no
   tener consumidor, o conservar como dato/validación? Recomendado: conservar `segments`
   en `canons.ts` (barato, valida `headCount`) y **quitar** `FigureModel.segments` +
   `segmentBoundaries()` de `figure.ts` si no vuelven a usarse, ajustando `figure.test.ts`.
2. **Largos/anchos teóricos vs medidos:** `LENGTH_HEADS` y `widths` son ratios genéricos.
   ¿Medirlos por canon sobre el dibujo (coherencia total con la lámina) o dejarlos como
   referencia académica en el panel? Recomendado: dejarlos como referencia y rotular el
   panel como "referencia académica", separado de las medidas verticales (que sí son del dibujo).
3. **Default del tool:** queda `heroic` mientras sea el único con láminas. Al añadir más,
   ¿default = `academic`? Requiere láminas académicas primero.

## Riesgos

- **Aspecto de imagen:** `next/image` necesita `w/h` correctos por lámina; un aspecto
  errado deforma la figura. Mitigado midiendo dims reales en `FIGURES`.
- **Consistencia entre vistas:** si un canon nuevo trae vistas con distinta altura de
  recorte, los `frac` no calzarán entre vistas. Recortar coronilla→planta uniforme.
- **Peso de assets:** 3 PNG × 5 cánones (× capas futuras) crece. Considerar optimización
  (`next/image` ya sirve AVIF/WebP) y no versionar PNGs gigantes.

---

Relacionado: `docs/pr/importantes/carnaval/CARNAVAL_SUITE_IMPLEMENTATION_PLAN.md`. Memoria: `canon-improvement-plan`.

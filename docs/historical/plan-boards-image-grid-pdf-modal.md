# Plan — Modal "Cuadrícula + PDF a escala" para imagen del board

> Estado: ✅ EJECUTADO (2026-06-18) · Alcance: acotado (boards) · i18n: es/en
>
> Hecho: `sheetSizes.ts` (12 tamaños, pliego 70×100 / medio 70×50 / cuarto 50×35 /
> foto 10×15 / A0-A4 / carta·oficio·tabloide) · `imageGridPdf.ts` parametrizado
> `{sheet,landscape,marginCm,gridCm}` · `ImageGridModal.tsx` (preview grid +
> celda/opacidad/color/números + selector hoja + toggle vertical/horizontal +
> salidas PDF/Imagen + "Aplicar al lienzo") · RightRail: fuera `grid_on`+
> `picture_as_pdf`, dentro `download`→modal · TopBar: fuera `download` del navbar ·
> i18n es/en (quitadas `downloadTip`/`downloadPdfTip`/`gridImageTip`). tsc + 136
> tests verdes. NOTA: `useBoardExport.downloadBoard` (PNG board completo) queda
> definido pero sin consumir (reversible si se quiere reañadir).

## 1. Problema

En el editor de board, al seleccionar una **imagen** salen en el `RightRail` dos
botones:

- `grid_on` — "Cuadricular imagen (celda 2 cm)" → toggle de `obj.gridCm`
  (`onToggleImageGrid` en `BoardEditor.tsx:427`).
- `picture_as_pdf` — "Descargar PDF a escala" → `exportImageGridPdf`
  (`onExportPdf` en `BoardEditor.tsx:428`).

Funcionan bien **pero no dejan ajustar nada**: la celda queda fija en
`background.squareCm`, el PDF sale **siempre en tamaño carta** (hardcode
`LETTER_*` en `imageGridPdf.ts:10-11`) y no hay forma de cambiar tamaño de hoja,
opacidad, color ni numeración antes de exportar.

## 2. Objetivo

1. **Eliminar** los botones `grid_on` y `picture_as_pdf` del `RightRail`.
2. **Mover** el botón `download` del `TopBar` (navbar) → a la sección contextual
   del `RightRail` que aparece al seleccionar imagen. Quitarlo del navbar.
   - OJO: hoy ese `download` del navbar exporta **el board entero a PNG**
     (`downloadBoard`). Ver §6 — decisión de qué hace cada salida.
3. Al pulsar ese botón sobre una imagen → abrir un **modal** que replica la
   herramienta Cuadrícula (`src/frontend/features/tools/grid`) trabajando sobre
   la imagen seleccionada, **+ exportar a PDF con selector de tamaño de hoja**.
4. El selector trae **varios tamaños** (yo elijo los convenientes). Obligatorios:
   - **Pliego** — 70 cm ancho × 100 cm alto.
   - **Medio pliego** — 70 cm ancho × 50 cm alto.

## 3. Archivos involucrados

| Archivo | Cambio |
|---|---|
| `boards/toolbars/RightRail.tsx` | quitar `grid_on` + `picture_as_pdf`; añadir `download` en la sección contextual de imagen |
| `boards/toolbars/TopBar.tsx` | quitar `download` del navbar (y props `onDownload`) |
| `boards/BoardEditor.tsx` | estado `gridModalOpen`; quitar `onToggleImageGrid`/`onExportPdf`; montar el modal; re-cablear `downloadBoard` (§6) |
| `boards/lib/imageGridPdf.ts` | parametrizar tamaño de hoja + orientación (hoy solo carta) |
| **NUEVO** `boards/lib/sheetSizes.ts` | catálogo de tamaños de hoja (pliego, medio pliego, etc.) |
| **NUEVO** `boards/components/ImageGridModal.tsx` | el modal (preview + controles grid + selector hoja + exportar) |
| `shared/i18n/messages/{es,en}.ts` | claves nuevas; quitar `gridImageTip`/`downloadPdfTip` si quedan huérfanas |

Reutilizables que ya existen (no reescribir):
`grid/lib/gridGeometry.ts` (`computeGridGeometry`, `snapToSquare`),
`grid/lib/renderGridBlob.ts`, `grid/lib/colLabel.ts`,
`grid/components/GridControls.tsx`, `shared/lib/measure` (`cmOf`, `Scaler`).

## 4. Catálogo de tamaños — `boards/lib/sheetSizes.ts`

```ts
export interface SheetSize {
  id: string
  label: string      // i18n key o nombre directo
  wCm: number        // ancho
  hCm: number        // alto
}

// Orden: formatos de impresora primero, pliegos al final (formato grande de taller).
export const SHEET_SIZES: SheetSize[] = [
  { id: 'letter',      label: 'Carta',          wCm: 21.59, hCm: 27.94 },
  { id: 'legal',       label: 'Oficio',         wCm: 21.59, hCm: 35.56 },
  { id: 'tabloid',     label: 'Tabloide',       wCm: 27.94, hCm: 43.18 },
  { id: 'a4',          label: 'A4',             wCm: 21.0,  hCm: 29.7  },
  { id: 'a3',          label: 'A3',             wCm: 29.7,  hCm: 42.0  },
  { id: 'a2',          label: 'A2',             wCm: 42.0,  hCm: 59.4  },
  { id: 'a1',          label: 'A1',             wCm: 59.4,  hCm: 84.1  },
  { id: 'a0',          label: 'A0',             wCm: 84.1,  hCm: 118.9 },
  { id: 'foto',        label: 'Foto 10×15',     wCm: 10,    hCm: 15  }, // confirmado
  { id: 'cuarto-pliego', label: 'Cuarto pliego', wCm: 50,  hCm: 35  }, // confirmado
  { id: 'medio-pliego', label: 'Medio pliego',  wCm: 70,    hCm: 50  }, // obligatorio
  { id: 'pliego',       label: 'Pliego',        wCm: 70,    hCm: 100 }, // obligatorio
]

export const DEFAULT_SHEET = SHEET_SIZES.find((s) => s.id === 'letter')!
```

Notas:
- `wCm/hCm` son el **tamaño físico de la hoja** (vertical/portrait por defecto).
  El modal ofrece toggle **vertical/horizontal** que intercambia w↔h al construir
  el PDF.
- `jsPDF` acepta `format: [wCm, hCm]` numérico además de strings → se usa el
  array para cualquier tamaño (pliego no es formato estándar de jsPDF).

## 5. Refactor `imageGridPdf.ts` (parametrizar hoja)

Hoy: `LETTER_W_CM`/`LETTER_H_CM` constantes + `format: 'letter'`. Cambios:

- Firma nueva:
  ```ts
  interface PdfOpts {
    sheet: SheetSize
    landscape?: boolean
    marginCm?: number   // default 1
  }
  export async function exportImageGridPdf(
    obj: BoardObject, scaler: Scaler, name: string, opts: PdfOpts,
  ): Promise<void>
  ```
- Dentro: `const pageW = landscape ? sheet.hCm : sheet.wCm` (y `pageH` espejo).
  Reemplazar `LETTER_W_CM`/`LETTER_H_CM` por `pageW`/`pageH` en el cálculo de
  `printW/printH`, `colsPerPage/rowsPerPage`, paginación y `addImage`.
- `new jsPDF({ unit: 'cm', format: [pageW, pageH], orientation })`.
- El resto del troceo (líneas rojas completas al borde, hoja de escala,
  instrucciones) se conserva igual — solo cambia el tamaño de página.
- Edge case: si la imagen entera **cabe en una hoja** (caso típico del pliego),
  `pagesX*pagesY = 1` → sale 1 hoja + hoja de escala. Ya lo soporta.

## 6. Salidas del modal: PDF a escala **o** Imagen (DECIDIDO)

El `download` del navbar hoy es `downloadBoard` (PNG vía Konva `stage.toDataURL`).
**Decisión del usuario:** se **quita del navbar** y esa función de exportar imagen
se **mete dentro del mismo modal**. El modal ofrece **dos salidas**:

- **Exportar PDF a escala** → `exportImageGridPdf(obj, scaler, name, { sheet, landscape })`
  con selector de hoja (§4) — el caso principal (troceado para imprimir y ampliar).
- **Exportar imagen (PNG)** → la imagen seleccionada con su cuadrícula quemada,
  usando `renderGridBlob` (ya existe en `grid/lib`) con los ajustes vivos del
  modal (celda, opacidad, color, números, zoom/pan) → descarga `.png`.
  - Esto reemplaza al `downloadBoard` del navbar. Es la imagen **seleccionada**,
    no el board entero. Si en el smoke se ve que falta exportar el board completo,
    se evalúa aparte (no en este plan).

UI: dos botones de acción en el pie del modal — `Exportar PDF` (con el selector de
hoja arriba) y `Exportar imagen`. Patrón visual: `SendActions`/`ToolButton`
`variant="action"`.

## 7. Modal — `boards/components/ImageGridModal.tsx`

Estructura (replica la lógica de `ReferenceGridScreen` pero embebida y sobre la
imagen ya cargada del board, sin upload ni handoff):

- **Props:** `{ obj: BoardObject; scaler: Scaler; name: string; onClose; onApplyGrid?(gridCm) }`.
- **Estado local** (semilla desde el objeto): `squareCm` (← `obj.gridCm ?? 2`),
  `opacity`, `color`, `showNumbers`, `zoom`, `pan`. El **tamaño real** sale de
  `cmOf(obj.w)` (la imagen del board ya tiene medida física), no se re-pregunta.
- **Preview:** mismo patrón que `ReferenceGridScreen` — `<img>` + overlay
  `gridStyle` de `computeGridGeometry`, numeración con `colLabel`. Reutilizar el
  cálculo puro; el preview es read-only de medidas (la imagen no se reescala).
- **Controles:** reutilizar `GridControls` (celda cm, presets, opacidad, color,
  números, zoom). Quitar de ese render lo que no aplique (SourceButton/cambiar
  foto). Si `GridControls` no se deja recortar limpio, extraer las clusters
  "Medidas" + "Estilo" a un sub-componente compartido `GridAdjustFields` usado
  por ambos (screen y modal) — preferible para no duplicar.
- **Sección PDF (nueva):**
  - Grid de chips con `SHEET_SIZES` (label + `wCm×hCm`); resalta el activo.
    Pliego y Medio pliego destacados.
  - Toggle vertical/horizontal.
  - Botón **Exportar PDF** → `exportImageGridPdf(obj, scaler, name, { sheet, landscape })`.
  - Botón **Exportar imagen (PNG)** → `renderGridBlob({...ajustes vivos})` + descarga
    (reemplaza el `download` del navbar; ver §6).
  - Estado `exporting` + manejo de error (toast/warning como en el screen).
- **Aplicar cuadrícula al board (solo botón explícito):** botón "Aplicar al lienzo"
  que llama `onApplyGrid(squareCm)` → `patchSelected({ gridCm })` (sustituye el viejo
  toggle `grid_on`). DECIDIDO: exportar **no** persiste `gridCm` por sí solo; el
  board solo cambia si se pulsa este botón.
- **Chrome del modal:** seguir el patrón de modales existente (ver
  `ImageSourceModal` / `plan-modal-animations.md`): overlay + panel centrado,
  cierre por backdrop/Escape, `motion`.

## 8. Decisiones confirmadas

1. **Salidas del modal:** PDF a escala **o** Imagen (PNG). El export-imagen del
   navbar se mete dentro del modal (§6). Navbar pierde `download`.
2. **gridCm:** no se persiste al exportar; solo con botón explícito "Aplicar al
   lienzo".
3. **Tamaños extra:** añadidos **Cuarto de pliego 50×35** y **Foto 10×15** (§4).

## 9. Orden de ejecución

1. `sheetSizes.ts` (catálogo + default).
2. Refactor `imageGridPdf.ts` a `PdfOpts` (parametrizar hoja/orientación);
   actualizar la única llamada actual para no romper compilación.
3. (Si aplica) extraer `GridAdjustFields` de `GridControls`.
4. `ImageGridModal.tsx` (preview + controles + selector hoja + exportar).
5. `BoardEditor.tsx`: estado `gridModalOpen`, montar modal, quitar
   `onToggleImageGrid`/`onExportPdf`, re-cablear `download` (§6).
6. `RightRail.tsx`: quitar `grid_on` + `picture_as_pdf`; añadir `download`
   contextual de imagen (abre modal).
7. `TopBar.tsx`: quitar `download` del navbar (+ prop).
8. i18n es/en: claves `boards.imageToolTip`, `boards.sheetSize`, `boards.pliego`,
   `boards.medioPliego`, `boards.orientation`, `boards.exportPdf`,
   `boards.applyGrid`, etc. Quitar huérfanas.
9. `tsc` + `vitest` verdes. Smoke en `/dashboard/workspaces/<id>/boards/<id>`:
   seleccionar imagen → `download` → ajustar celda → elegir Pliego → exportar →
   verificar PDF 70×100 con cuadrícula a escala.

## 10. Riesgos

- **CORS al renderizar la imagen del board a canvas** para el PDF: las imágenes
  del board pueden venir de storage remoto. `loadImage` ya usa
  `crossOrigin='anonymous'`; verificar que el bucket manda CORS (mismo riesgo que
  `downloadBoard`, que ya muestra `boards.exportErrorCORS`).
- **Pliego = lienzo gigante** (70×100 cm @150dpi ≈ 4134×5906 px por hoja). Si
  cabe en 1 hoja el canvas es grande pero puntual; vigilar memoria. El troceo por
  hojas más chicas (A4/carta) sigue siendo el camino para imprimir en casa.
- No duplicar la lógica de grid: preferir extracción compartida (§7) a copiar
  `ReferenceGridScreen`.

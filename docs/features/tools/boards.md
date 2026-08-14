---
title: Boards (Tableros de Referencia)
audience: frontend, architecture
status: stable
updated: 2026-08-14
owner: TBD
---

# Boards (Tableros de Referencia)

> **Ubicación:** `src/frontend/features/tools/boards/` (50 archivos en 9
> subcarpetas). **Rutas:** `/dashboard/tools/boards`, `.../boards/[id]`, y
> anidado en `/dashboard/workspaces/[id]/boards/[boardId]`.

Lienzo infinito sobre **Konva.js** para colocar, organizar y medir imágenes de
referencia. Es el subsistema más grande del repo y el que más manos tocan.

Este doc describe **la forma y las reglas**, no un catálogo archivo por archivo
— para eso está el código, que no se desactualiza.

## Mapa por responsabilidad

| Carpeta | Nº | Responsabilidad |
|---|---|---|
| `hooks/` | 12 | **Toda la lógica.** El estado vive aquí, no en los componentes. |
| `toolbars/` | 10 | Islas flotantes de UI (barras, popovers, estilos compartidos). |
| `nodes/` | 6 | Un componente Konva por `BoardObject.type` (imagen, texto, sticky, forma, freehand) + sus tipos. |
| `lib/` | 5 | Lógica pura y testeable: grid, export a PDF, comportamiento de resize, tamaños de hoja, uid. |
| `components/` | 5 | Piezas grandes no-isla: el `<Stage>`, panel de capas, menú contextual, modales. |
| `overlays/` | 4 | HTML posicionado **sobre** el canvas (etiquetas de cota, rect de selección, editor de texto inline). |
| `extensions/` | 3 | Punto de extensión para Workspaces — ver abajo. |
| `screens/` | 2 | Composición de pantalla (lista de boards, editor). Entrada del feature. |
| `layers/` | 2 | Capas Konva del motor: cuadrícula y medición. |

**La distinción que más se confunde:** `layers/` y `nodes/` renderizan **dentro**
del `<Stage>` de Konva; `overlays/` y `toolbars/` son **HTML encima**. No son
intercambiables: un componente HTML no puede vivir dentro del Stage y un nodo
Konva no puede usar CSS.

## Flujo de estado

`BoardEditor.tsx` es el orquestador y el **único** sitio que compone los hooks.
El patrón es consistente: cada hook posee un dominio de estado y devuelve
`{ estado, handlers }`; `BoardEditor` los cablea entre sí y baja props a
`BoardStage` (Konva) y a las islas (HTML).

Los hooks por dominio:

- **Datos/persistencia** — `useBoardData` (carga, autosave, y recepción del
  handoff entrante), `useBoardExport` (PNG/PDF y handoff **saliente**).
- **Cámara** — `usePanZoom`, `useSpacePan` (barra espaciadora), `useStagePointer`.
- **Objetos** — `useObjectCreation` (asigna `id`/`z`), `useObjectActions`
  (mover/transformar/patch), `useClipboard`, `useTextEditing`,
  `useTransformerSync` (ata el `Transformer` de Konva a la selección).
- **Historial** — `useHistory`, por snapshots del board completo.
- **Entrada** — `useShortcuts`.

## Invariantes

1. **`useTransformerSync` usa callback ref imperativo, no ref declarativa.** No
   "simplificar" a `useRef` normal: React 19 + `react-konva` pierden el ref en
   remontajes dinámicos, dejando el cuadro de redimensión invisible aunque el
   objeto sí esté seleccionado. Ver
   [ADR-0006](../../adr/0006-vercel-blob-konva-transformer.md).
2. **El autosave captura una miniatura con `stage.toDataURL()`** cada ~800ms,
   ocultando el `Transformer` durante la captura. Esa restauración va en un
   `finally` blindado: si un canvas *tainted* (CORS) hace lanzar el
   `toDataURL`, sin el `finally` el Transformer se queda invisible para
   siempre. Mismo ADR.
3. **El orden de anidamiento respecto al `BoardExtProvider` es load-bearing** —
   ver §Extensiones.
4. **`resizeBehavior.ts` protege contra `NaN`.** El snap durante resize tiene
   candados (mínimo forzado, delta > 0.01, sanitización) porque un `width: 0`
   propagaba `NaN` a React y tumbaba el árbol entero con pantalla en blanco.
   Ver [ADR-0005](../../adr/0005-konva-grid-snap-resize.md).
5. **El imán de la cuadrícula depende del zoom**: con zoom out, las líneas
   menores colapsan visualmente y el snap salta solo entre las mayores. No es
   un bug, es deliberado (mismo ADR).

## Extensiones (Workspaces)

`extensions/` define el contrato por el que un tipo de workspace (Carnaval)
inyecta capas, overlays y acciones **sin que el motor lo conozca**. El motor
resuelve `getBoardExtension(workspace.kind)` y renderiza los slots por
referencia.

Orden de anidamiento que **no se puede alterar**: `BoardStage`, `ToolIsland`,
`RightRail` y los overlays de extensión van **dentro** del `BoardExtProvider`;
`ZoomIsland` y el panel de capas van **fuera**. Mover un componente entre esas
zonas rompe el contexto de la extensión en silencio.

Detalle completo (los 3 registros, los 7 slots, qué pasa si falta cada uno):
[`../../architecture/workspaces-plugins.md`](../../architecture/workspaces-plugins.md).

## Medición y escala

Escala global compartida con el resto de herramientas — ver
[`escala-medicion.md`](escala-medicion.md). Los objetos guardan px de mundo; la
conversión a cm depende del `scaler` del workspace
(`workspaceScaler(workspace)`), no de una constante global.

## Handoff

`useBoardExport` envía imágenes a Crop/Grid y `useBoardData` recibe las que
vuelven, con las medidas físicas preservadas. Payload en
`src/shared/lib/tools/handoff.ts` — ojo: `takeHandoff()` es **destructivo**
(consume el payload). Ver
[`../../architecture/shared-lib.md`](../../architecture/shared-lib.md).

## Tests

`lib/grid.test.ts` e `lib/imageGridPdf.test.ts`. El resto del subsistema
(hooks, componentes) **no tiene tests** — ver
[`../../contributing/testing.md`](../../contributing/testing.md).

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Los 50 archivos y su reparto por subcarpeta verificados con `ls`. La versión
  anterior de este doc citaba `InspectorIsland.tsx`, que **no existe** en
  `toolbars/`.

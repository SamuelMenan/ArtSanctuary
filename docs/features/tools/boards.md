---
title: Boards (Tableros de Referencia)
audience: frontend, architecture
status: stable
updated: 2026-08-15
owner: TBD
---

# Boards (Tableros de Referencia)

> **Ubicación:** `src/frontend/features/tools/boards/` (52 archivos sin contar
> tests, en 9 subcarpetas + `BoardEditor.tsx`). **Rutas:**
> `/dashboard/tools/boards`, `.../boards/[id]`, y anidado en
> `/dashboard/workspaces/[id]/boards/[boardId]`.

Lienzo infinito sobre **Konva.js** para colocar, organizar y medir imágenes de
referencia. Es el subsistema más grande del repo y el que más manos tocan.

Este doc describe **la forma y las reglas**, no un catálogo archivo por archivo
— para eso está el código, que no se desactualiza.

## Mapa por responsabilidad

| Carpeta | Nº | Responsabilidad |
|---|---|---|
| `hooks/` | 13 | **Toda la lógica.** El estado vive aquí, no en los componentes. |
| `toolbars/` | 10 | Islas flotantes de UI (barras, popovers, estilos compartidos). |
| `nodes/` | 6 | Un componente Konva por `BoardObject.type` (imagen, texto, sticky, forma, freehand) + sus tipos. |
| `lib/` | 6 | Lógica pura y testeable: grid, export a PDF, imán del resize, tamaños de hoja, uid (+ `resizeBehavior.ts`, muerto — §Redimensionado). |
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
- **Entrada** — `useShortcuts`, `useResizeModifiers` (§Redimensionado).

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
4. **El resize tiene candados anti-`NaN` y son obligatorios.** Mínimo forzado
   de 5 px, delta > 0.01 para dar un borde por movido, y sanitización en los
   overlays: un `width: 0` propagaba `NaN` a React y tumbaba el árbol entero
   con pantalla en blanco. Viven en el `boundBoxFunc` **inline** de
   `BoardStage.tsx`, **no** en `lib/resizeBehavior.ts` pese al nombre
   (§Redimensionado). Ver [ADR-0005](../../adr/0005-konva-grid-snap-resize.md).
5. **El imán de la cuadrícula depende del zoom**: con zoom out, las líneas
   menores colapsan visualmente y el snap salta solo entre las mayores. No es
   un bug, es deliberado (mismo ADR).

## Redimensionado: imán + modificadores

⚠️ **Zona a medio migrar (2026-08-15).** Los módulos puros están escritos y
testeados, pero **`BoardStage.tsx` todavía no los consume**. Antes de tocar
nada aquí, leer
[`../../../.plans/pr/incompletos/plan-boards-resize-modificadores.md`](../../../.plans/pr/incompletos/plan-boards-resize-modificadores.md).

### Qué hace hoy el usuario

| Tecla | Efecto real hoy | De dónde sale |
|---|---|---|
| `Shift` | **Proporción** | Nativo de Konva (`Transformer._handleMouseMove`: `keepRatio() \|\| e.shiftKey`) |
| `Alt` | **Crecer desde el centro** | Nativo de Konva (`centeredScaling() \|\| e.altKey`) |
| `Ctrl`/`⌘` | **Proporción** (otra vez) | `BoardStage.tsx`, listener propio → prop `keepRatio` |

Tres teclas, dos conductas, ninguna documentada en el panel de atajos. Konva ya
traía dos de ellas; la app añadió una tercera vía redundante sin saberlo.

### Los tres bugs conocidos

1. **El `boundBoxFunc` pelea contra los modificadores** — la causa real de los
   "errores con el grip". El imán trabaja **por bordes** y los modificadores
   imponen una **forma** a la caja. Con centrado se mueven los dos bordes
   opuestos, cada uno se imanta a una línea distinta, la caja deja de ser
   simétrica y el objeto **deriva** mientras arrastras. Con proporción, imantar
   el ancho sin recalcular el alto rompe la razón: se ve como un tirón.
2. **El modificador se queda pegado**: el listener oye `keydown`/`keyup` pero no
   `blur`. Si sueltas la tecla fuera de la ventana (Alt+Tab), el `keyup` no
   llega nunca y el board queda en modo proporcional sin que nada lo indique.
3. **`lib/resizeBehavior.ts` es código muerto** — exporta
   `shouldKeepRatioForResize` con **0 consumidores**. Es el archivo que *parece*
   la implementación; la real está duplicada a mano dentro de `BoardStage`.
   `ctrlPressedRef` (`BoardStage.tsx:93`) se escribe y no se lee jamás.

### Lo que ya está en el repo (sin cablear)

- **`hooks/useResizeModifiers.ts`** — estado vivo de los modificadores. Lee las
  **banderas** del evento (`e.ctrlKey`/`e.shiftKey`), no el nombre de la tecla,
  así que cualquier evento posterior corrige el estado aunque se pierda un
  `keyup`; y resetea en `blur` (bug 2). Devuelve el **mismo objeto** cuando nada
  cambia, para no redibujar el Stage en cada pulsación.
- **`lib/resizeSnap.ts`** — el imán, puro y en coordenadas de **mundo**; el
  `boundBoxFunc` solo debería convertir pantalla↔mundo y delegar. La regla que
  arregla el bug 1: **se imanta ÚNICAMENTE el borde que el usuario arrastra** y
  todo lo demás se deriva de él (el opuesto se espeja respecto al centro si está
  centrado; el otro eje se calcula por la razón si es proporcional).
  `draggedSides()` usa `trRef.getActiveAnchor()` y cae a deducir el borde movido
  si no hay ancla.
- **`lib/resizeSnap.test.ts`** — 15 tests, incluida la regresión concreta del
  centro que derivaba.

### Mapeo decidido (aún sin implementar)

**`Shift` = desde el centro**, `Ctrl`/`⌘` = proporción. Se aparta del estándar
de la industria (Figma/Illustrator usan Shift para proporción), que es justo
como Konva viene cableado, así que exige `shiftBehavior="none"` en el
`Transformer` para apagar el Shift nativo. **`Alt` seguirá centrando de todos
modos**: es nativo y no hay prop para desactivarlo — se acepta como alias.

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

`lib/grid.test.ts`, `lib/imageGridCanvas.test.ts`, `lib/imageGridPdf.test.ts` y
`lib/resizeSnap.test.ts`. El resto del subsistema (hooks, componentes) **no
tiene tests** — ver
[`../../contributing/testing.md`](../../contributing/testing.md).

`resizeSnap` es el precedente a copiar para el resto de la lógica del Stage:
sale a un módulo puro en coordenadas de mundo, se testea, y el componente se
queda solo con la conversión de coordenadas. No hay jsdom ni testing-library en
el repo, así que **si la lógica no sale del componente, no se puede testear**.

## Última verificación

- Fecha: 2026-08-15
- Commit: HEAD (árbol de trabajo, cambios sin commitear)
- Conteo por subcarpeta reverificado con `ls` (`hooks/` 13, `lib/` 6 sin
  tests). El mapeo nativo de Konva se leyó en
  `node_modules/konva/lib/shapes/Transformer.js` (líneas 551, 553, 660) — no es
  de memoria ni de la documentación de Konva.
- `npx vitest run` pasa: 20 archivos, 161 tests.

### Verificación previa (2026-08-14)

- Los 50 archivos y su reparto por subcarpeta verificados con `ls`. La versión
  anterior de este doc citaba `InspectorIsland.tsx`, que **no existe** en
  `toolbars/`.

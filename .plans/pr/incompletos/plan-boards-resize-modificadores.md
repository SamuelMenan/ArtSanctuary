# Plan — Modificadores de redimensionado del board (Shift / Alt / Ctrl)

**Fecha:** 2026-08-14 · **actualizado:** 2026-08-15
**Estado:** ⏳ **a medias** — los módulos puros están escritos y en verde;
falta cablearlos. **El comportamiento en producción no ha cambiado todavía.**
**Alcance:** acotado. 3 ficheros de código + panel de atajos.

## Avance al 2026-08-15

| Fase | Estado | Nota |
|---|---|---|
| F1 — Limpieza | 🟡 a medias | `hooks/useResizeModifiers.ts` **creado** (con reset por `blur`, B2 resuelto en el módulo). **Falta** borrar `lib/resizeBehavior.ts` y `ctrlPressedRef`, y que `BoardStage` consuma el hook en vez de su `useEffect` inline (`:93-115`). |
| F2 — Mapeo de teclas | 🔴 sin empezar | Falta `shiftBehavior="none"` + pasar `centeredScaling={mods.centered}` y `keepRatio={mods.keepRatio}` al `Transformer`. |
| F3 — Arreglar el imán | 🟡 a medias | `lib/resizeSnap.ts` + `lib/resizeSnap.test.ts` (**15 tests, en verde**) escritos. **Falta** reescribir `boundBoxFunc` (`BoardStage.tsx:205-276`) para convertir pantalla↔mundo y delegar, pasándole `trRef.current?.getActiveAnchor()` y el modo vivo. |
| F4 — Panel de atajos | 🔴 sin empezar | `ShortcutsHelp.tsx:18` sigue prometiendo `Alt + arrastrar → Duplicar` (clave `boards.scAltDrag`), que no existe. |

⚠️ **Mientras F3 no se cablee, `resizeSnap.ts` tiene 0 consumidores** — es
exactamente el mismo olor que `resizeBehavior.ts` (B3). Si esto se queda parado,
el repo pasa a tener **dos** módulos de resize sin usar en la misma carpeta.

Verificado con `npx vitest run`: 20 archivos, 159 tests, exit 0.

## El hallazgo que cambia el plan

**Konva ya implementa las dos conductas de forma nativa.** No hay que escribirlas,
hay que dejar de estorbarlas. En `konva@10.3.0`, `Transformer.js`:

| Línea | Código | Efecto |
|---|---|---|
| 551 | `keepProportion = this.keepRatio() \|\| e.shiftKey` | **Shift → proporcional**, ya activo (`shiftBehavior` por defecto es `'default'`) |
| 553, 660 | `centeredScaling = this.centeredScaling() \|\| e.altKey` | **Alt → crece desde el centro**, ya activo |

O sea:

1. Lo que pides ("que se expanda en todos los lados igual") es `centeredScaling`, y
   **hoy ya funciona con Alt** aunque la app no lo declare en ningún sitio.
2. **Shift ya hace algo**: forzar proporción. Por eso "creo que está implementada con
   otra tecla" — hay dos teclas haciendo lo mismo.
3. La app añade una **tercera** vía: `BoardStage.tsx:96-115` escucha `Control`/`Meta`
   y alterna la prop `keepRatio` (`:193`). Redundante con el Shift nativo.

## Bugs reales encontrados

### B1 — `boundBoxFunc` pelea contra los dos modos ⚠️ la causa de "errores con el grip"

`BoardStage.tsx:243-275` imanta **cada borde por separado** a la cuadrícula. Konva ya
calculó una caja correcta y el `boundBoxFunc` la deshace después:

- **Con proporción:** imantar solo el borde que se mueve cambia el ancho sin tocar el
  alto → la relación se rompe justo al enganchar el imán. Se ve como un tirón.
- **Con centrado:** al crecer desde el centro se mueven **los dos** bordes opuestos, así
  que `movingLeft` y `movingRight` (`:250-251`) son ambos `true` y cada uno se imanta a
  una línea distinta → la caja deja de ser simétrica respecto al centro y el objeto
  **deriva** mientras arrastras.

El arreglo es imantar **una sola magnitud** y derivar el resto: en proporcional, imantar
el borde que manda y recalcular el otro eje con la razón; en centrado, imantar un borde
y espejar el opuesto respecto al centro guardado al empezar el arrastre.

### B2 — El modificador se queda pegado

`BoardStage.tsx:96-115` escucha `keydown`/`keyup` en `window` pero **no escucha `blur`**.
Si sueltas la tecla fuera de la ventana (Alt+Tab, o cualquier atajo del navegador con
Ctrl), el `keyup` nunca llega y `keepRatioResize` se queda en `true` para siempre. El
board queda en modo proporcional sin que nada lo indique.

### B3 — Código muerto que despista

- **`lib/resizeBehavior.ts`** exporta `shouldKeepRatioForResize` y **no lo importa
  nadie** (0 consumidores). Es un fichero que *parece* la implementación; la real está
  duplicada a mano dentro de `BoardStage`. Borrar o cablear, pero no dejar los dos.
- `ctrlPressedRef` (`BoardStage.tsx:93`) se escribe en `:99` y `:105` y **no se lee
  jamás**. Borrar.

### B4 — El panel de atajos miente

`components/ShortcutsHelp.tsx`:
- Fila 18: documenta `Alt + arrastrar → Duplicar arrastrando`, pero **esa función no
  existe**: duplicar solo está en `Ctrl/⌘+D` y en los botones. Alt está libre de hecho.
- **No hay ninguna fila** para redimensionar proporcional ni desde el centro. Las dos
  conductas que sí funcionan son invisibles para el usuario.

---

## Decisión: Shift crece desde el centro ✅

Se aparta del estándar de la industria (Figma/Illustrator/Photoshop usan Shift para
proporción y Alt para centro), que es justo como Konva viene cableado. Implica:

- `shiftBehavior="none"` en el `Transformer`, para que Konva **deje** de forzar
  proporción al detectar Shift (`Transformer.js:547-549`).
- Un listener propio que alterne la prop `centeredScaling` con Shift.
- **Alt seguirá haciendo centrado igualmente**: es nativo (`Transformer.js:553`) y no se
  puede desactivar. Se acepta como alias no documentado.
- **La proporción se queda en Ctrl/⌘** — el binding que la app ya tenía y que este plan
  iba a borrar por redundante. Al liberar Shift deja de ser redundante y pasa a ser su
  único acceso, así que se conserva y **se documenta** en el panel de atajos.
  Así está ya en `useResizeModifiers` (`keepRatio: e.ctrlKey || e.metaKey`).

## Lo que ya está escrito (contrato de los dos módulos)

**`hooks/useResizeModifiers.ts`**

```ts
type ResizeModifiers = { keepRatio: boolean; centered: boolean }
readResizeModifiers(e): ResizeModifiers   // Ctrl/⌘ → keepRatio · Shift → centered
sameModifiers(a, b): boolean
useResizeModifiers(): ResizeModifiers     // keydown + keyup + blur
```

Dos decisiones que no son obvias al leerlo:
- Lee las **banderas** del evento (`e.ctrlKey`), no `e.key`. Cualquier evento posterior
  corrige el estado aunque se haya perdido un `keyup`.
- Devuelve el **mismo objeto** si nada cambió, para que React descarte el re-render: si
  no, cada pulsación redibuja el Stage entero.

**`lib/resizeSnap.ts`** — puro, en coordenadas de **mundo**, por bordes
(`{left,right,top,bottom}`). La regla que arregla B1 es el orden de operaciones:

1. imantar **solo** el borde bajo el ancla activa;
2. si `centered`, el opuesto es su espejo respecto al centro de la caja vieja;
3. si `keepRatio` **y** el ancla toca los dos ejes (solo esquinas, igual que Konva),
   manda el eje que más ha cambiado en relativo y el otro se deriva;
4. el mínimo (5 px) se fuerza por `setWidth`/`setHeight`, que respetan centrado y ancla
   — así el candado anti-`NaN` no rompe la simetría.

`draggedSides(anchor, old, next)` usa `Transformer.getActiveAnchor()` y, si no hay
ancla, deduce el borde por el que se movió (la heurística vieja, ahora como red).

---

## Fases

### F1 — Limpieza (independiente de la decisión)
- Borrar `lib/resizeBehavior.ts` y `ctrlPressedRef`.
- Añadir reset por `blur` de la ventana al listener de modificadores (B2).
- Extraer el listener a un hook `useResizeModifiers` con su test: hoy es un `useEffect`
  suelto dentro de un componente de 285 líneas.

### F2 — Mapeo de teclas
- `shiftBehavior="none"` en el `Transformer`.
- Estado `centeredResize` alimentado por Shift (vía el hook de F1), pasado como
  `centeredScaling`.
- El binding de Ctrl/⌘ → `keepRatio` **se conserva** (era el único acceso a la
  proporción) pero pasa a documentarse en el panel de atajos, que hoy lo esconde.

### F3 — Arreglar el imán (B1) — el grueso del trabajo
- El `boundBoxFunc` necesita saber en qué modo está. Pasarle el modo activo y:
  - proporcional → imantar el eje dominante, derivar el otro por la razón original;
  - centrado → imantar un borde y espejar el opuesto respecto al centro del `oldBox`.
- El bloque de imán ya se salta las cajas rotadas (`:214`); aplicar el mismo criterio
  conservador si el modo activo y la rotación se combinan.
- Sacar la lógica a `lib/resizeSnap.ts` **puro** y testearlo: hoy son 60 líneas dentro
  de un JSX y no hay un solo test de redimensionado.

### F4 — Panel de atajos
- Borrar la fila `Alt + arrastrar` o implementar la duplicación que promete (B4).
- Añadir las filas de redimensionado con el mapeo que se elija, y sus claves i18n en
  `es.ts` / `en.ts` (los únicos dos ficheros de mensajes).

## Riesgos

| Riesgo | Nota |
|---|---|
| Alt en Windows enfoca la barra de menú del navegador y en algunos Linux arrastra la ventana. | Es conducta nativa de Konva ya presente hoy; si molesta, `e.preventDefault()` en el `keydown` del stage. |
| Tocar `boundBoxFunc` puede romper el imán normal (sin modificador), que hoy funciona. | Por eso F3 sale a un módulo puro con tests antes de cambiar el comportamiento. |
| Shift ya se usa para selección aditiva (`useStagePointer.ts:139`) y rueda horizontal (`usePanZoom.ts:32`). | No colisiona: son click y wheel, no arrastre de anclas. |

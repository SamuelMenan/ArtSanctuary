---
id: 0005
title: Snap-to-grid magnético y fix de colapso por NaN en resize (Konva)
status: proposed
date: 2026-06-04
deciders: [equipo-core]
supersedes: []
superseded-by: []
---

# 0005 — Refactorización Magnética (Snap to Grid) y Colapso por NaN
**Fecha:** 4 de Junio de 2026

## El Problema Original
Se reportaron dos deficiencias fundamentales en el sistema de tablero y lienzos (Boards):
1. **Arrastre Unidireccional:** Al arrastrar un objeto, el imán (`snapVal`) siempre encajaba utilizando exclusivamente la esquina superior izquierda (`x, y`), dejando desalineado el lado opuesto si la imagen no era un múltiplo exacto de la cuadrícula.
2. **Redimensionado Flotante:** Al estirar el objeto desde el `Transformer` (nodos en las esquinas), las dimensiones fluctuaban en valores decimales libres (sin anclarse al grid de centímetros). 

---

## Intento 1: Lógica de Doble Borde para Arrastre
**Hipótesis:** En lugar de enviar un único punto `x` al calculador de grillas, podíamos crear una función `snapDrag(v, span)` que evaluara la distancia desde el lado izquierdo (`snapVal(v) - v`) y el lado derecho (`snapVal(v + span) - (v + span)`) hacia la grilla más cercana, y moviera el bloque hacia el lado que requiriera el salto más corto.
**Resultado:** Éxito. Al mover una imagen de dimensiones no exactas, se encajará fluidamente por la izquierda o por la derecha, dependiendo de qué borde esté acariciando la línea del grid.

---

## Intento 2: Intercepción del Resize (`boundBoxFunc` v1)
**Hipótesis:** Konva provee una propiedad `boundBoxFunc` en su nodo `Transformer`. Decidimos interceptar la futura caja generada por el usuario al arrastrar la esquina (`newBox`), y pasar sus cuatro puntos (`x, y, width, height`) por la criba de redondeo de nuestro `snapVal`.
**Resultado:** Comportamiento súper errático. Al ajustar `x` y `width` de golpe, el usuario estiraba de la esquina inferior derecha, pero la esquina **superior izquierda** saltaba repentinamente al grid más cercano porque la función recababa los cuatro lados independientemente de qué nodo se estuviese tocando.
**Fallo Adicional:** Si los bordes colapsaban sobre sí mismos o el usuario los arrastraba muy cerca, el `width` podía llegar a valer cero.

---

## Intento 3: Desastre en Cascada y Pantalla Blanca (El Bug del NaN)
**Hipótesis/Problema:** Al permitir un `width: 0` dentro del bounding box modificado del `Transformer`, disparamos una paradoja matemática en el motor de Konva.
1. Para calcular la escala visual, Konva divide el ancho nuevo por el viejo (`newW / oldW`).
2. Al llegar a cero (o menor por el snap), la división resultaba errática o negativa cruzada y, al soltar el ratón (`onTransformEnd`), terminamos calculando una escala visual de `NaN` (Not a Number).
3. Este `NaN` infectó la base de datos local y se cargó en el atributo de React: `<div style={{ left: pos.x + w / 2 }}>`. React no admite `left: NaNpx` y causó el colapso fulminante de todo el árbol de componentes (Pantalla en blanco / Error 500 en consola de Next.js Turbopack).

**La Solución Estructural:**
1. Blindamos `boundBoxFunc` para rastrear matemáticamente el Delta (`Math.abs(newBox.x - oldBox.x) > 0.01`). Si un lado *no* cambió, **no se le aplica el imán**. Esto resolvió el comportamiento "errático" donde el objeto saltaba entero al estirar un solo lado.
2. Añadimos candados de seguridad en los `width` y `height` devueltos (mínimo forzado de `5px`), asegurando que jamás volvieran a devolver `0` o escalar a valores negativos.
3. Se añadió sanitización (`Number.isNaN()`) en todos los overlays flotantes de dimensiones para evitar futuros crasheos de React si una variable llegara corrompida.

---

## Intento 4: La Guerra de Resoluciones (Minor vs Major Grids)
**Problema:** Tras implementar el nuevo imán estable, el usuario sintió que ya "no dejaba redimensionar bien" y que el sistema ignoraba la cuadrícula grande ("tiene que permitir pegarse a los 2 no solo al pequeño").
**Hipótesis:** Al asignar el `gridGap` a las líneas menores (`0.5 cm`), el salto era tan corto que se sentía robótico o "pesado". Matemáticamente sí encajaba en los múltiplos mayores (1.0 cm), pero visualmente el usuario no notaba la firmeza al hacer zoom out (cuando las líneas menores desaparecen pero el imán las seguía sintiendo).

**La Solución Dinámica:**
Inyectamos la escala (`scale` - cámara) directamente a la calculadora de físicas del ratón (`useObjectActions.ts`).
*   **Si Zoom In:** Las líneas pequeñas (0.5cm) son dibujadas, así que el imán se afina y ancla a las líneas menores.
*   **Si Zoom Out:** Las líneas pequeñas colapsan visualmente en pantalla (menos de 6px de separación). El imán lo detecta automáticamente, apaga el ajuste milimétrico y vuelve a saltar poderosa y exclusivamente entre los recuadros de la cuadrícula grande.

**Estado Actual:** Pendiente de revisión y validación táctil del usuario.

---

## Intento 5 (2026-08-15): El imán contra los modificadores de teclado

**Problema reportado:** "cuando se presione shift la figura se expanda en todos
los lados igual tiene errores con el grip y creo que está implementada con otra
tecla".

**Lo que se encontró al mirar el código:** las dos conductas **ya existían**, y
por partida triple.

| Origen | Tecla | Conducta |
|---|---|---|
| `konva@10.3.0`, `Transformer.js:551` (`keepRatio() \|\| e.shiftKey`) | `Shift` | proporción |
| `konva@10.3.0`, `Transformer.js:553,660` (`centeredScaling() \|\| e.altKey`) | `Alt` | desde el centro |
| `BoardStage.tsx:96-115`, listener propio → prop `keepRatio` | `Ctrl`/`⌘` | proporción (duplicada) |

Konva las trae de fábrica; la app añadió una tercera vía sin saberlo. No hay
nada que implementar: hay que **dejar de estorbarlas**.

### La causa raíz de los "errores con el grip"

Es el mismo `boundBoxFunc` que estabilizamos en el Intento 3, y falla por la
misma razón de fondo, un nivel más arriba:

> **El imán razona por BORDES; los modificadores imponen una FORMA a la caja.**

Konva calcula una caja que ya cumple la forma pedida (simétrica respecto al
centro, o de razón fija) y el `boundBoxFunc` la **deshace después** al imantar
cada borde por su cuenta:

- **Centrado:** al crecer desde el centro se mueven **los dos** bordes opuestos,
  así que `movingLeft` y `movingRight` son ambos `true`, cada uno se imanta a
  una línea distinta, la caja deja de ser simétrica y el objeto **deriva** en
  cada tirón del imán.
- **Proporción:** imantar el ancho sin recalcular el alto rompe la razón justo
  al enganchar.

El guard del Intento 3 (`delta > 0.01` → no imantar el lado quieto) resolvía el
caso sin modificador, donde **siempre** hay un lado quieto. Con centrado no lo
hay: la premisa deja de cumplirse y el guard no protege nada.

### La decisión

1. **Imantar UNA sola magnitud y derivar el resto.** Se imanta exclusivamente el
   borde bajo el ancla activa (`Transformer.getActiveAnchor()`); el opuesto se
   espeja respecto al centro guardado si el modo es centrado, y el segundo eje
   se calcula por la razón original si el modo es proporcional. Los candados
   anti-`NaN` del Intento 3 se aplican **al final**, por la misma vía, para que
   forzar el mínimo no rompa la simetría.
2. **Sacar la lógica a `src/frontend/features/tools/boards/lib/resizeSnap.ts`,
   puro y en coordenadas de mundo**, y
   testearlo **antes** de cambiar el comportamiento. El `boundBoxFunc` se queda
   solo con la conversión pantalla↔mundo. Motivo: el Intento 2 y el Intento 3
   se depuraron a ojo sobre 60 líneas dentro de un JSX, sin un solo test de
   redimensionado; esta es la tercera vez que se toca el mismo bloque.
3. **Mapeo: `Shift` = desde el centro, `Ctrl`/`⌘` = proporción.** Se aparta del
   estándar de la industria (y del cableado por defecto de Konva), así que
   requiere `shiftBehavior="none"` en el `Transformer`. `Alt` seguirá centrando
   igualmente: es nativo y no hay prop para apagarlo — se acepta como alias.
4. **Leer las banderas del evento, no el nombre de la tecla**, y resetear en
   `blur`: el listener anterior se quedaba pegado en modo proporcional si
   soltabas `Ctrl` fuera de la ventana.

**Estado:** `src/frontend/features/tools/boards/lib/resizeSnap.ts` +
`src/frontend/features/tools/boards/hooks/useResizeModifiers.ts` escritos y
testeados (15 tests). **`BoardStage.tsx` todavía no los consume** — el
comportamiento en producción sigue siendo el de la tabla de arriba. Plan y
fases pendientes en
[`../../.plans/pr/incompletos/plan-boards-resize-modificadores.md`](../../.plans/pr/incompletos/plan-boards-resize-modificadores.md).

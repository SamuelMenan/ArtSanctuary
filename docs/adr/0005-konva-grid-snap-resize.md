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

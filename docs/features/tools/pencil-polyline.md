---
title: "Propuesta: lápiz de polilíneas (modo pluma)"
audience: product
status: proposed
updated: 2026-08-14
owner: TBD
---

# Diseño Futuro: Lápiz de Polilíneas y Curvas Punto a Punto (Modo Pluma)

Este documento detalla el diseño conceptual y técnico de la futura herramienta de **Polilínea / Pluma** para el lienzo de ArtSanctuary, diseñada para integrarse sin fricciones con el sistema de dibujo libre.

---

## 1. Concepto y Casos de Uso
En lugar de forzar al usuario a arrastrar el puntero de manera continua (lo cual exige un pulso firme), el **Modo Pluma** permite definir un trazo mediante clics sucesivos:
* Cada clic izquierdo añade un vértice o nodo a la figura.
* El sistema dibuja una línea guía en tiempo real desde el último nodo hasta la posición actual del cursor.
* Un doble clic o presionar la tecla `Enter` finaliza y consolida la figura.
* Una tecla modificadora (como `Shift`) permite restringir los segmentos a ángulos de 45° y 90°.

Esto es sumamente útil en el diseño de carrozas y estructuras de carnaval, donde se requieren trazos precisos de soporte y andamiaje sobre fotos de referencia.

---

## 2. Modelo de Datos y No-Conflicto
Para evitar introducir nuevos tipos complejos en la base de datos, la polilínea compartirá el nodo de renderizado de dibujo libre:

1. **Tipo de Objeto:** Reutilizará el tipo `'freehand'` o se registrará como un nuevo tipo `'polyline'`.
2. **Propiedades:**
   ```typescript
   {
     id: string;
     type: 'freehand'; // O 'polyline' si se requiere edición interactiva de nodos
     x: number; // Esquina superior izquierda del bounding box
     y: number;
     w: number; // Ancho del bounding box
     h: number;
     points: number[]; // Coordenadas relativas de los nodos [dx1, dy1, dx2, dy2, ...]
     stroke: string;
     strokeWidth: number;
   }
   ```
3. **Coexistencia Limpia:** La única diferencia reside en el método de recolección de puntos en la capa del puntero (`useStagePointer.ts`), el cual acumula puntos con eventos de clic individuales en lugar de eventos continuos de movimiento de arrastre.

---

## 3. Implementación del Flujo de Interacción
Cuando la herramienta `polyline` esté activa en la barra de herramientas:

1. **MouseDown/Click:**
   * Si no hay un trazo activo, crea una línea temporal con un primer punto.
   * Si hay un trazo activo, añade el punto `(x, y)` transformado al array de puntos.
2. **MouseMove:**
   * Actualiza el último segmento temporal (la línea elástica o *rubber band*) que conecta el último punto fijado con la posición actual del ratón.
3. **Doble Clic / Enter:**
   * Remueve el último punto temporal del doble clic.
   * Calcula el bounding box final.
   * Convierte los puntos a relativos y guarda el objeto definitivo mediante `addObject()`.

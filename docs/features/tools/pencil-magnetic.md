---
title: "Propuesta: lápiz magnético a bordes"
audience: product
status: proposed
updated: 2026-08-14
owner: TBD
---

# Diseño Futuro: Lápiz Magnético (Adherencia a Bordes de Imagen)

Este documento describe la arquitectura conceptual para dotar al lápiz de una funcionalidad magnética que se adhiera automáticamente a los contornos de las imágenes de referencia cargadas en el fondo del tablero.

---

## 1. Concepto y Casos de Uso
Al calcar elementos complejos del carnaval (como la silueta de una máscara, plumas de un tocado, o el volumen de una carroza), el usuario activa el **Lápiz Magnético**. A medida que arrastra el puntero cerca de los bordes de la imagen de referencia, el trazo se "pega" o imanta de forma automática a la silueta de mayor contraste en esa región, compensando la imprecisión del ratón o tableta digitalizadora.

---

## 2. Estrategia de Procesamiento y Rendimiento (Evitando el Bloqueo del Hilo Principal)
De acuerdo con el **ADR 0016 (Procesamiento Pesado de Imágenes en Cliente)**, procesar una imagen de alta resolución en tiempo real puede degradar drásticamente los frames por segundo (FPS). Para evitarlo, la arquitectura utilizará un enfoque por demanda basado en vecindarios locales:

1. **Offscreen Canvas Regional:**
   * Al iniciar el dibujo, localizamos la imagen de fondo que se encuentra inmediatamente debajo del puntero.
   * En lugar de procesar toda la imagen, creamos un buffer de canvas virtual pequeño de `80x80` píxeles centrado en la coordenada del cursor.
2. **Cálculo de Gradientes (Filtro Sobel / Operador de Borde):**
   * Extraemos la información de color de este vecindario de 80x80 píxeles.
   * Aplicamos un filtro Sobel rápido en escala de grises para encontrar la magnitud del gradiente de intensidad (los bordes físicos del objeto).
3. **Optimización del Punto de Destino:**
   * Dentro de un radio de búsqueda (p. ej. 15 píxeles del cursor), buscamos el píxel que tenga la mayor magnitud de gradiente.
   * Desplazamos la posición efectiva del dibujo de `(mx, my)` a `(snapX, snapY)`.

---

## 3. Coexistencia sin Conflictos
La lógica magnética se encapsularía como un middleware en la captura de eventos
del puntero, en `src/frontend/features/tools/boards/hooks/useStagePointer.ts`:

*   **Puntero Normal:**
    ```typescript
    const worldPos = toWorld(cursor.x, cursor.y);
    ```
*   **Puntero Magnético:**
    ```typescript
    const rawWorldPos = toWorld(cursor.x, cursor.y);
    const worldPos = snapToImageEdges(rawWorldPos, backgroundImage);
    ```

El punto retornado se pasa directamente a la entrada del **Estabilizador del Lápiz**. De este modo, ambas lógicas cooperan: el lápiz magnético busca el contorno y el estabilizador suaviza la transición hacia este, produciendo un trazo orgánico, limpio y perfectamente alineado sin alterar en absoluto la estructura de almacenamiento.

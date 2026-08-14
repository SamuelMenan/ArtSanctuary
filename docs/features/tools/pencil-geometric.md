---
title: "Propuesta: lápiz de reconocimiento geométrico"
audience: product
status: proposed
updated: 2026-08-14
owner: TBD
---

# Diseño Futuro: Lápiz de Reconocimiento Geométrico Asistido

Este documento especifica cómo se puede extender el sistema de dibujo libre en ArtSanctuary para reconocer y transformar trazos a mano alzada imperfectos en figuras geométricas perfectas.

---

## 1. Concepto y Casos de Uso
Permite a diseñadores de carnaval esbozar de forma rápida una idea en el tablero (como un círculo para una rueda, o un cuadrado para una sección de carroza) y recibir de inmediato una geometría vectorial perfecta e imantada al grid.

El proceso es totalmente transparente:
1. El usuario selecciona el Lápiz Asistido.
2. Dibuja a mano alzada un trazo continuo tembloroso.
3. Al levantar el lápiz (`onStagePointerUp`), la aplicación analiza el contorno geométrico.
4. Si coincide con una de las formas conocidas dentro de un umbral de tolerancia, reemplaza el trazo libre por una forma primitiva (`rect`, `ellipse`, `line`, o `arrow`).

---

## 2. Algoritmo de Reconocimiento (Sin Dependencias)
Para evitar recargar la aplicación cliente con librerías pesadas de inteligencia artificial o reconocimiento gestual (por ejemplo, `$1 recognizer`), podemos implementar una lógica heurística basada en descriptores geométricos simples:

*   **Paso 1: Simplificación y Centrado:** Pasar el trazo por una versión ligera del algoritmo RDP y calcular su centro y bounding box.
*   **Paso 2: Análisis de Extremos (Línea o Flecha):**
    *   Si la distancia entre el primer punto y el último punto es casi igual a la longitud total recorrida por el trazo (relación cercana a 1.0), el trazo es una **línea recta** o **flecha**.
    *   Podemos detectar flechas si el trazo tiene un cambio abrupto de dirección (> 90 grados) justo al final de la trayectoria.
*   **Paso 3: Análisis de Área e Inercia (Rectángulo o Elipse):**
    *   Si el trazo es cerrado (el primer y el último punto están muy cerca):
        *   Calculamos el área real encerrada por el polígono ($A$) y su perímetro ($P$).
        *   Obtenemos el coeficiente de circularidad $C = \frac{4\pi A}{P^2}$.
        *   Si $C$ está cerca de $1.0$ (tolerancia $> 0.82$), se transforma en una **elipse** (círculo).
        *   Si $C$ está cerca de $\pi/4 \approx 0.785$ y los vértices extremos forman ángulos ortogonales, se transforma en un **rectángulo**.

---

## 3. Coexistencia sin Conflictos
Este reconocedor actúa como un filtro intermedio justo antes de almacenar el objeto en la base de datos:

1. El usuario dibuja el trazo temporal de tipo `'freehand'` en pantalla de forma normal.
2. Al soltar el cursor, en lugar de guardar directamente el objeto `'freehand'`:
   * Pasamos el trazo por la función `classifyStroke(points)`.
   * Si devuelve `{ type: 'ellipse' | 'rect' | 'line' | 'arrow', x, y, w, h, rotation }`, se crea un objeto de dicho tipo a través del despachador estándar de figuras.
   * Si no se reconoce ninguna forma o el nivel de confianza es bajo, se guarda como un trazo libre tradicional (`'freehand'`).

Esto asegura que no existan conflictos de almacenamiento ni renders especiales, ya que el resultado final utiliza componentes ya integrados (`ShapeNode.tsx`).

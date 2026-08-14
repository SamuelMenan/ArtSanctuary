---
id: 0020
title: Canon Frontal - Geometría Asimétrica y Prioridades Z-Index
status: proposed
date: 2026-06-18
deciders: [Sam]
supersedes: []
superseded-by: []
---

# 0020 — Canon Frontal - Geometría Asimétrica y Prioridades Z-Index

## Contexto

Al automatizar el mapeo poligonal del Canon Frontal, encontramos problemas graves para que los polígonos de la cabeza, cuello y trapecios calcen exactamente con los line-arts base. Los intentos de usar geometría estrictamente simétrica o de "adivinar" polígonos de fondo causaban fugas visuales (partes que sobresalían), solapamientos incorrectos o deformación de las curvas del rostro. Necesitábamos una estrategia para calcular vértices que respeten tanto el *Z-Index* (orden de pintado) como la asimetría natural del dibujo humano.

## Decisión

Adoptar una estrategia de **"Desacople Asimétrico y Vértices Compartidos"**. Los polígonos subyacentes (trapecio) deben compartir matemáticamente el mismo arreglo de puntos de los polígonos superpuestos (mandíbula) recorriéndolos en reversa para garantizar encaje hermético (0 pixel gap). Además, abandonar la función matemática `.map(mir)` de simetría especular para regiones orgánicas en favor de anclajes independientes (X,Y) que compensen las irregularidades del dibujo manual.

## Consecuencias

- **Positivas:** Calce visual perfecto con los line-arts; no hay fugas ni polígonos asomándose detrás de las mejillas.
- **Negativas:** El código de `head-shape.js` es más verboso, ya que obliga a declarar los arreglos izquierdo y derecho de forma manual en lugar de un simple reflejo geométrico.
- **Riesgos / deuda:** Si el line-art base cambia, las coordenadas asimétricas manuales (`0.155` izq vs `0.145` der) tendrán que ser recalibradas.

## Línea de Tiempo e Intentos Fallidos (El "Cementerio de Soluciones")

⚠️ **Crucial para la IA y desarrolladores futuros:** Enumera cronológicamente los enfoques que se intentaron y **fracasaron**. Explica exactamente *por qué* fallaron para evitar volver a cometer estos errores en vistas futuras (espalda, perfil, etc).

1. **Intento 1 (Curvas matemáticas colapsadas por RDP):**
   - **Qué se hizo:** Generamos curvas paramétricas hermosas de 52 puntos para la mandíbula, pero se dejaron con la tolerancia alta heredada (`eps = 0.004`).
   - **Por qué falló:** El algoritmo de simplificación poligonal RDP destruyó la curva generada en `head-shape.js` al pasarlo por `refine-frontal.js`, devolviéndola al triángulo recto de solo 12 puntos intentando "optimizar".
   
2. **Intento 2 (EPS reducido y polígonos al techo):**
   - **Qué se hizo:** Se bajó `eps` a `0.001` y se forzó a que los polígonos del cuello y trapecio subieran rectos hasta el techo del canvas (`Y=0`), asumiendo que el polígono de la cara los taparía por tener mayor prioridad (100 vs 92/88).
   - **Por qué falló:** La curva de la mandíbula se va haciendo más angosta hacia abajo. Los polígonos de fondo rectos terminaron siendo más anchos que la cara en la zona de las mejillas, "asomándose" por detrás. Además, `eps = 0.001` trazaba las escaleras de los píxeles dejando hombros aserrados. La altura de la cara (`Y_CHIN = 0.115`) era demasiado corta y no tapaba el dibujo real de la mandíbula.

3. **Intento 3 (Anclaje hermético con espejo matemático):**
   - **Qué se hizo:** Bajamos el tamaño de la cara (`Y_CHIN = 0.128`) y forzamos a que el trapecio compartiera exactamente la matriz de puntos de la mandíbula. Luego, reflejamos todo hacia la derecha de forma perfecta usando `.map(mir)`.
   - **Por qué falló:** El line-art a mano **no es perfectamente simétrico**. El hombro derecho está más alto y el cuello izquierdo dibujado es más delgado. La geometría "perfecta" causó que el trapecio se comiera el hombro derecho (que estaba más alto) y quedara diminuto en el hombro izquierdo (que requería más área).

4. **Solución Definitiva (Intento actual exitoso):**
   - Se ajustó `eps = 0.002` (el "punto dulce" entre curvas paramétricas limpias y rectas no aserradas).
   - Se separó el cuello izquierdo del derecho (`cXL = jX - 0.005` vs `cXR = jX - 0.020`) para liberar espacio.
   - Se aplicó asimetría vertical a los bordes exteriores de los trapecios (`Y = 0.155` izquierda vs `Y = 0.145` derecha) para frenar exactamente donde empieza el hombro dibujado en cada lado.

## Notas

Revisar `scripts/canon-parthits/head-shape.js` y `scripts/canon-parthits/refine-frontal.js`.

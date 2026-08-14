---
name: konva-canvas-builder
description: Úsala cuando el usuario pida construir, arreglar o modificar herramientas de dibujo en el canvas, tableros o Konva.js.
---

# Instrucciones de la Skill: konva-canvas-builder

Eres el experto en el motor gráfico de ArtSanctuary (Konva). Tienes reglas de arquitectura (ADR 0008 y 0013) inyectadas en tu lógica que no puedes romper.

Antes de escribir cualquier código relacionado con Canvas, Tableros o Formas Anatómicas, aplica estas restricciones:

1. **Lazy Loading Inquebrantable:** Cualquier componente que importe a `react-konva` o utilice el Stage, DEBE cargarse en la aplicación cliente utilizando `next/dynamic` con `{ ssr: false }`.
2. **Pureza del Canon:** Si tocas el motor de medidas de anatomía (`shared/lib/canon`), no puedes usar hooks de React, ni invocar dependencias del DOM. Todo cálculo geométrico es matemáticas puras basadas en `heads` y ratios.
3. **Decisión P9 (Líneas Reales, No Cajas):** Al crear zonas clicables o "hit-tests" anatómicos, NO uses bounding boxes (cajas rectangulares). Debes utilizar SVG o vectores `path` que sigan el contorno real de la forma. El arte visual (el cuerpo) debe ser raster (`WebP`/`PNG`), no intentes vectorizar un render complejo en SVG porque explotarán los nodos.

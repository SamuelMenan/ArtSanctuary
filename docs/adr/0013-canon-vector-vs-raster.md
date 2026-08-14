---
id: 0013
title: Rasterización del tono vs. vectorización anatómica (Decisión P9)
status: accepted
date: 2026-06-18
deciders: [equipo-core]
supersedes: []
superseded-by: []
---

# 0013 — Rasterización del Tono vs Vectorización Anatómica (Decisión P9)

## Contexto
Al diseñar hit-tests y resaltados para los mapas anatómicos, hubo la disyuntiva de usar bounding boxes (cajas) que eran baratas computacionalmente o intentar vectorizar por completo la imagen del héroe para que cada músculo fuese interactivo.

## Decisión
La Decisión "P9" dicta el uso del modelo Híbrido:
1. **Vectorización interactiva obligatoria:** NUNCA se deben usar cajas rectangulares para hit-testing o resaltado de anatomía. Se exige usar un `path` SVG trazado a mano que siga la silueta perfecta del músculo.
2. **Raster innegociable para el arte:** La lámina de render visual (el sombreado del cuerpo) NO se debe vectorizar. Se renderiza mediante `WebP` de alta resolución (next/image) para conservar las gradientes y evitar una explosión de millones de nodos SVG y artefactos.

## Consecuencias
- **Positivas:** La experiencia de usuario es inmersiva ("brilla el músculo, no una caja"). El DOM se mantiene ligero porque el SVG solo contiene los trazos invisibles (o de overlay), delegando el sombreado complejo a una imagen plana y optimizada.
- **Negativas:** Trazar SVG mappings a mano o mediante clasificación de píxeles es un proceso costoso y requiere pipelines especiales en Node para extraer los trazos del dibujo (como se detalló en el ADR-006).

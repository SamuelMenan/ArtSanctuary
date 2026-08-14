---
id: 0012
title: Pureza de datos y escalado relativo en la plataforma Canon
status: accepted
date: 2026-06-18
deciders: [equipo-core]
supersedes: []
superseded-by: []
---

# 0012 — Pureza de Datos y Escalado Relativo en Plataforma Canon

## Contexto
La Plataforma Canon (Atlas anatómico) requiere poder dibujar dimensiones y referencias a cualquier tamaño, canon (cabezas) o vista. Mezclar la lógica de medición con los componentes de React crea una deuda técnica masiva que impide reusar la métrica en otras herramientas (ej. hit-tests fuera del canvas).

## Decisión
Se establecen dos invariantes estrictos:
1. **Separación de Capas Radical:** Todo el motor matemático (`shared/lib/canon`) debe ser 100% puro. Tiene prohibido importar dependencias de React, Next.js, o tocar el DOM. Es un módulo abstracto.
2. **Medición por Ratios:** Ningún dato visual (coordenadas, dimensiones) se guarda en centímetros o píxeles fijos. Absolutamente toda la data se guarda como ratios relativos a la altura de una cabeza (`heads`). El cálculo se realiza en tiempo real escalando: `headCm = heightCm/headCount`.

## Consecuencias
- **Positivas:** El motor se vuelve testeable al 100% (Node purista) y reusable en otras vistas (como la herramienta Carnaval). Cualquier cambio de altura en la UI solo muta una variable y recalcula el árbol en milisegundos sin rescribir estado profundo.
- **Negativas:** Curva de aprendizaje más alta; para añadir una marca visual hay que calcular su ratio anatómico en lugar de usar coordenadas directas de pantalla.

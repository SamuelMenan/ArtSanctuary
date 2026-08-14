---
id: 0011
title: Prohibición de sintaxis de corchetes para variables de texto en Tailwind v4
status: accepted
date: 2026-06-18
deciders: [equipo-core]
supersedes: []
superseded-by: []
---

# 0011 — Prohibición de Sintaxis de Corchetes para Variables de Texto en Tailwind v4

## Contexto
En Tailwind v4, las variables del tema definidas en `@theme` (como `--text-label-sm`) se exponen automáticamente como clases estáticas. Sin embargo, históricamente se utilizaba la sintaxis arbitraria de corchetes `text-[var(--text-label-sm)]` para aplicar tamaños.
Esta sintaxis causa un error grave y difícil de rastrear: Tailwind JIT es ambiguo con la utilidad `text-[]` y asume que cualquier contenido de la variable corresponde a un **color**, ignorando clases previas de color (como `text-on-primary`) y compilando código CSS roto (ej. `color: 12px;`). El resultado son botones o textos ilegibles porque pierden su color contrastante.

## Decisión
Queda estrictamente prohibido utilizar sintaxis de corchetes con variables de fuente: `text-[var(--text-*)]`.
Toda asignación de tipografía basada en las variables del diseño debe usar **únicamente** la clase utilitaria estática autogenerada (ej. `text-label-sm`, `text-body-md`).

## Consecuencias
- **Positivas:** Previene bugs silenciosos de contraste y pérdida de estilos en componentes. Código HTML más limpio.
- **Negativas:** La IA o los desarrolladores deben memorizar la equivalencia estática en lugar de depender de autocompletado de variables CSS arbitrarias.

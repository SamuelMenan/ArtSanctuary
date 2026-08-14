---
id: 0015
title: Tokens de animación compartidos (single source of truth)
status: accepted
date: 2026-06-18
deciders: [equipo-core]
supersedes: []
superseded-by: []
---

# 0015 — Tokens de Animación Compartidos (Single Source of Truth)

## Contexto
Las animaciones con librerías como `framer-motion` (ahora `motion/react`) suelen derivar en "números mágicos" esparcidos por el código base, donde un desarrollador usa duración `0.3`, otro `0.5`, o se inventan curvas bezier personalizadas por componente, causando una experiencia fragmentada e irregular.

## Decisión
Se establece `src/frontend/shared/motion/tokens.ts` como la **ÚNICA fuente de la verdad** para la animación en ArtSanctuary.
**Reglas:**
1. **Librería exclusiva:** Toda animación debe usar `motion/react` (nunca CSS transitions manuales complejas).
2. **Tokens Obligatorios:** Prohibido escribir duraciones o easings manuales en los componentes. Se deben usar los exportados en `DURATION` (fast: 0.15, base: 0.22, slow: 0.32) y `EASE` (standard, emphasized).
3. **Sensibilidad Editorial:** Los movimientos deben ser cortos (máximo 0.32s) y los desplazamientos pequeños (máximo 8px). Están estrictamente prohibidos los rebotes exagerados (bouncy physics).

## Consecuencias
- **Positivas:** Animaciones fluidas, rápidas, y consistentes. Sensación de aplicación "premium". Reutilización inmediata de variantes pre-escritas (como `fadeSlide` o `scaleIn`).
- **Negativas:** Obliga a importar `tokens.ts` cada vez que se usa el prop `transition` en un componente `motion`.

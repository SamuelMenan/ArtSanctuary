---
id: 0008
title: Restricción de "use client" y lazy loading para Konva
status: accepted
date: 2026-06-18
deciders: [equipo-core]
supersedes: []
superseded-by: []
---

# 0008 — Restricción de "use client" y Lazy Loading para Konva

## Contexto
ArtSanctuary usa herramientas como `konva` para la edición y dibujo interactivo. Konva es una librería extremadamente pesada. Si cualquier archivo superior en el árbol de componentes (ej. un Layout) fuese marcado con `"use client"`, forzaría a empaquetar y descargar esta librería en cada visita a cualquier pantalla pública de la aplicación, destruyendo el TTI (Time to Interactive).

## Decisión
Hemos estandarizado una política radical para el Bundle del Cliente:
1. **Empujar "use client" a las hojas del árbol (Leaf Nodes):** Se prohíbe usar directivas cliente en componentes contenedores. Solo componentes estrictamente atados a eventos (botones, formularios) lo llevarán.
2. **Lazy Loading de Librerías Pesadas:** El motor del canvas y tableros (`BoardStage` y dependencias gráficas) **NUNCA** se deben importar de forma estática en las vistas.
   Se debe usar obligatoriamente `next/dynamic` configurado con `{ ssr: false }` para asegurar que el canvas no se ejecute en el servidor (donde `window` no existe) y solo se descargue cuando el usuario abra explícitamente el tablero.

## Consecuencias
- **Positivas:** El First Load JS para usuarios leyendo perfiles o galerías públicas es minúsculo e inmediato (puro HTML estático / RSC). Las rutas que no necesitan Konva se mantienen limpias.
- **Negativas:** Obliga a mantener las importaciones en revisión constante. Un import estático de un helper de Konva en un layout puede desatar la inclusión completa en el bundle global silenciosamente.

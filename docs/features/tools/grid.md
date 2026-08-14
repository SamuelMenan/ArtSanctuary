---
title: Reference Grid Screen (Cuadrícula de Referencia)
audience: frontend, architecture
status: stable
updated: 2026-08-14
owner: TBD
---

# Reference Grid Screen (Cuadrícula de Referencia)

> **Ubicación:** `src/frontend/features/tools/grid/`

La herramienta Cuadrícula de Referencia ha sido refactorizada para separar su geometría, historia y renderizado de la UI. Permite aplicar cuadriculados sobre imágenes, gestionar historiales de cambios y exportar los resultados para usarse en otras herramientas o guardar localmente.

## Estructura

- **Screens**: `screens/ReferenceGridScreen.tsx`
- **Components**: `components/GridControls.tsx` (foto, historial, medidas, estilo y acciones).
- **Hooks (`hooks/`)**:
  - `useGridPrefs.ts`: Carga/guarda las preferencias de la cuadrícula en `localStorage`.
  - `useGridHistory.ts`: Implementa *undo*/*redo* mediante snapshots del estado de la cuadrícula, y gestiona atajos de teclado relacionados.
  - `useGridPanZoom.ts`: Maneja el paneo por arrastre y el zoom orientado hacia el cursor del usuario.
- **Lib (`lib/`)**: Lógica pura y testeable.
  - `colLabel.ts`: Función de ayuda para etiquetar columnas al estilo de hojas de cálculo (A, B, C...).
  - `gridGeometry.ts`: `computeGridGeometry`, `snapToSquare`, etc. Calcula medidas y proporciones exactas.
  - `renderGridBlob.ts`: Exportación de la cuadrícula y su configuración mediante un `<canvas>`. **WebP en producción, PNG solo en dev** (corregido 2026-08-14; el doc decía PNG siempre). Ver [`../image-compression.md`](../image-compression.md).

## Integración con otras herramientas

La herramienta de Cuadrícula consume y exporta el mismo formato de `handoff.ts`, integrándose fluidamente con **Crop** y **Boards**.
Las dimensiones siempre manejan la escala global definida en `src/shared/lib/measure.ts`.

---
title: Boards (Tableros de Referencia)
audience: frontend, architecture
status: stable
updated: 2026-06-01
owner: TBD
---

# Boards (Tableros de Referencia)

> **Ubicación:** `src/frontend/features/tools/boards/`

El Editor de Tableros es un lienzo infinito basado en **Konva.js** que permite a los artistas colocar, organizar y medir imágenes de referencia. 

## Arquitectura

El editor ha sido refactorizado en múltiples componentes y hooks para facilitar la mantenibilidad y los tests.

### Componentes Principales

- `BoardEditor.tsx`: Componente principal que coordina el estado y los hooks.
- `components/BoardStage.tsx`: El árbol de Konva. Contiene la capa de fondo, la capa de objetos (nodos + Transformer) y la capa de medición.
- `components/LayersPanel.tsx`: Panel de control de capas.
- **Layers (`layers/`)**: 
  - `GridLayer.tsx`: Renderiza cuadrículas en el tablero.
  - `MeasureLayer.tsx`: Renderiza dimensiones y guías de medición.
- **Toolbars e Islas (`toolbars/`)**:
  - `TopBar.tsx`, `DimensionsFooter.tsx`, `InspectorIsland.tsx`, `ToolIsland.tsx`, `ZoomIsland.tsx`, etc.
  - Gestionan las acciones del usuario, herramientas activas y paneles laterales.

### Hooks de Lógica

Toda la lógica compleja ha sido extraída a hooks especializados (`hooks/`):

- `useBoardData.ts`: Carga y guardado de datos del tablero.
- `useBoardExport.ts`: Exportación del lienzo a imagen (PNG) y handoff (`editIn`) hacia otras herramientas como Crop o Grid.
- `useHistory.ts`: Sistema de Deshacer/Rehacer basado en snapshots del tablero.
- `usePanZoom.ts` y `useSpacePan.ts`: Lógica de paneo (por arrastre, barra espaciadora) y zoom.
- `useObjectActions.ts` y `useObjectCreation.ts`: Gestión de objetos (mover, transformar, crear nuevas imágenes/formas).
- `useClipboard.ts`: Copiar y pegar dentro del tablero.
- `useTextEditing.ts`: Modo de edición para elementos de texto.
- `useTransformerSync.ts`: Sincronización del estado de transformación con el componente Konva Transformer.
- `useShortcuts.ts`: Atajos de teclado del editor.

## Medición y Escala

Los Boards utilizan una escala global exacta compartida con otras herramientas. Los valores escalados son pasados internamente. Ver [`escala-medicion.md`](escala-medicion.md) para más detalles.

## Flujo de Trabajo (Handoff)

Usando `useBoardExport`, el usuario puede enviar (Handoff) imágenes recortadas o editadas desde el tablero a otras herramientas (como Grid) pasando las medidas de referencia y medidas escaladas usando el payload definido en `src/shared/lib/tools/handoff.ts`.

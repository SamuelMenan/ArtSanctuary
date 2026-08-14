---
title: "Jerarquía y Estado de BoardEditor"
audience: frontend, dev
status: stable
updated: 2026-08-14
---

# Jerarquía y Estado de BoardEditor

> ⚠️ **Parcialmente incorrecto e incompleto** (verificado 2026-08-14):
> - **No existe una "Background Layer".** `BoardStage` monta `GridLayer`,
>   `BoardExtLayers`, la capa de objetos y `MeasureLayer`. El fondo lo dibuja
>   el propio `GridLayer` (`type: 'grid'|'dots'|'plain'`).
> - `DimensionLabel` **no vive dentro de `MeasureLayer`**: está en `overlays/`
>   y se renderiza como HTML desde `BoardEditor`.
> - **Omite el sistema de extensiones** (`extensions/`), que es un eje
>   estructural del editor — ver
>   [`../workspaces-plugins.md`](../workspaces-plugins.md).
> - Faltan 8 de los 12 hooks y buena parte de las islas de UI (`RightRail`,
>   `ZoomIsland`, `DimensionsFooter`, `TextFormatBar`, `ShapeStyleBar`,
>   `LayersPanel`, `ContextMenu`).
>
> Vista actualizada: [`../../features/tools/boards.md`](../../features/tools/boards.md).

Este diagrama documenta la compleja estructura del Tablero Infinito interactivo, separando las responsabilidades de estado (Hooks) de la presentación visual (Konva y React).

## Explicación del Diagrama

El componente `BoardEditor` es un orquestador que centraliza el estado y lo distribuye a los componentes de presentación. Está dividido en 3 grandes bloques:

1. **Hooks de Lógica (`hooks/`):** Almacenan el estado y la lógica de negocio del lado del cliente.
   - `useBoardData`: Carga y autoguardado de los datos del tablero hacia la API.
   - `useHistory`: Gestiona la pila de deshacer/rehacer (snapshots).
   - `usePanZoom`: Cálculos matemáticos para moverse por el lienzo infinito.
   - `useObjectActions`: Lógica para transformar y manipular nodos.
2. **Componentes de Interfaz UI (`toolbars/`):** Elementos HTML/React tradicionales superpuestos sobre el canvas.
   - Barras superiores (`TopBar`) e inspectores laterales/inferiores (`ToolIsland`) donde el usuario hace clic para elegir herramientas.
3. **Capa de Renderizado (`BoardStage.tsx`):** Un árbol de `react-konva` encargado de dibujar todo en un elemento `<canvas>`.
   - Se compone de capas dedicadas (`Background Layer`, `GridLayer`, la capa de objetos y el `MeasureLayer` para dibujar cotas de medición).

## Diagrama (Mermaid)

```mermaid
graph TD
    BE["BoardEditor.tsx"] --> Hooks(("Hooks de Lógica"))
    Hooks -.-> H1("useBoardData")
    Hooks -.-> H2("useHistory")
    Hooks -.-> H3("usePanZoom")
    Hooks -.-> H4("useObjectActions")

    BE --> UI["Componentes de Interfaz"]
    UI --> TP["TopBar"]
    UI --> IS["ToolIsland / Inspector"]

    BE --> Stage["BoardStage.tsx"]
    Stage --> Konva(("Motor Konva.js"))
    Konva --> BG["Background Layer"]
    Konva --> BL["GridLayer"]
    Konva --> Obj["Objects Layer<br/>Nodos + Transformer"]
    Konva --> ML["MeasureLayer<br/>DimensionLabels"]
```

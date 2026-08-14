---
title: "Flujo de Handoff entre Herramientas de Estudio"
audience: frontend, dev
status: stable
updated: 2026-08-14
---

# Flujo de Handoff entre Herramientas de Estudio

> **Lo que viaja es una URL, no la imagen.** El payload lleva `imageUrl`
> (persistente, subida vía `/api/upload`) más las medidas **físicas en cm** —
> nunca base64.
>
> **No es unidireccional:** `ToolSource` incluye `'boards'` y `'upload'` como
> orígenes, y el payload lleva `boardId`/`objectId`/`workspaceId` para el
> round-trip de vuelta al objeto exacto del tablero.
>
> **`takeHandoff()` consume, `peekHandoff()` no.** Elegir mal deja el payload
> huérfano o lo borra antes de tiempo.
>
> Existe además un **segundo canal independiente** para enviar láminas de Canon
> a Boards: `takePendingFigure` en `tools/canon/lib/boardHandoff.ts`.
>
> Contrato completo: [`../shared-lib.md`](../shared-lib.md).

Este diagrama describe cómo una imagen transita a través del ecosistema de herramientas para artistas (`CropTool`, `ReferenceGridScreen`, `BoardEditor`).

## Explicación del Diagrama

El **Handoff** es el mecanismo que permite enviar una imagen de una herramienta a otra sin perder contexto, calidad ni escala de medida. 

1. **Subida y Recorte (`CropTool / CutoutTool`):** La imagen original entra al sistema. Aquí el artista extrae el fondo o recorta la parte que le interesa.
2. **Payload de Transición (`handoff.ts`):** Al pasar a la siguiente etapa, se envía un objeto que contiene el Base64 de la imagen recortada, junto con su ancho y alto original.
3. **Cuadriculado (`ReferenceGridScreen`):** La herramienta recibe la imagen, permite aplicar guías visuales y configurar la escala física en centímetros.
4. **Lienzo Final (`BoardEditor`):** Al integrarse al tablero infinito de Konva, la imagen aterriza con sus proporciones físicas exactas previamente calculadas (`Medidas físicas escaladas`), garantizando que la referencia sea métricamente precisa.

## Diagrama (Mermaid)

```mermaid
flowchart LR
    Upload(["/api/upload"]) -->|"imageUrl persistente"| Crop
    Crop["CropTool<br/><small>/dashboard/tools/crop</small>"]
    Cutout["CutoutTool<br/><small>/dashboard/tools/cutout</small>"]
    Grid["ReferenceGridScreen<br/><small>/dashboard/tools/grid</small>"]
    Board["BoardEditor<br/><small>Konva</small>"]

    Crop <-->|"PhysicalImage"| Grid
    Cutout <-->|"PhysicalImage"| Grid
    Crop <-->|"PhysicalImage"| Board
    Cutout <-->|"PhysicalImage"| Board
    Grid <-->|"PhysicalImage"| Board

    Canon["CanonScreen"] -.->|"canal aparte:<br/>setPendingFigure()"| Board

    P["PhysicalImage (sessionStorage)<br/>imageUrl · widthCm/heightCm<br/>widthScaledCm/heightScaledCm · squareCm<br/>source · boardId/objectId/workspaceId"]

    style P fill:#fef3c7,stroke:#d97706,color:#92400e
```

---
title: Crop & Cutout Tools (Recorte y Extracción)
audience: frontend, architecture
status: stable
updated: 2026-06-01
owner: TBD
---

# Crop & Cutout Tools (Recorte y Extracción)

> **Ubicación:** `src/frontend/features/tools/crop/`

Estas herramientas permiten preparar imágenes para el **BoardEditor** o la **Reference Grid** de manera precisa y aislada.

## CropTool

La herramienta general de recorte permite delimitar exactamente qué porción de una imagen se enviará a otra herramienta. Mantiene un flujo de handoff (ver `src/shared/lib/tools/handoff.ts`) y puede recibir medidas físicas (escaladas) de referencia.

## CutoutTool

La herramienta de Extracción (`CutoutTool`) facilita recortar formas irregulares o limpiar fondos indeseados.

### Componentes

- `CutoutTool.tsx`: Interfaz principal.
- `components/CutoutStage.tsx`: Lienzo de edición para realizar los trazos/selecciones de extracción.
- `components/CutoutToolbar.tsx`: Controles para gestionar los pinceles, máscaras y opciones de exportación.
- `useCutoutEditor.ts`: Hook de lógica de la herramienta. Gestiona estado de herramientas, historial de máscaras y generación de la imagen recortada.

## Handoff e Integración

Al terminar un proceso de *Crop* o *Cutout*, el usuario puede enviar la imagen recortada (como un Data URL/Blob) directamente a `BoardEditor` o a `ReferenceGridScreen`, preservando la metadata de tamaño físico real (usando el formato `handoff.ts`).

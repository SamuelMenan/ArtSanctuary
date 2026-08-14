---
title: "Notan (simplificación tonal)"
audience: frontend, product
status: wip
updated: 2026-08-14
owner: TBD
---

# Notan

> **Ubicación:** `src/frontend/features/tools/notan/screens/NotanScreen.tsx`.
> **Ruta:** `/dashboard/tools/notan`. Ver `glossary.md` para la definición
> de la técnica (simplificación tonal, "una de las herramientas en
> `/dashboard/tools/notan`" — esa entrada del glosario también necesita
> revisión a la luz de lo que sigue).

## ⚠️ Estado real: prototipo visual, no funcional

Verificado leyendo el archivo completo (único archivo de la feature) —
**no procesa ninguna imagen real**:

- Las dos imágenes ("ORIGINAL" y "NOTAN") son la **misma clase de URL
  externa hardcodeada** que en `gesture.md`
  (`lh3.googleusercontent.com/aida-public/...`), no una imagen subida por
  el usuario.
- El "efecto Notan" es un filtro CSS —
  `grayscale(100%) contrast(1000%) brightness(${umbral / 128})` — aplicado
  sobre esa imagen fija. No hay canvas, no hay muestreo de píxeles, no hay
  algoritmo de threshold/posterize real, pese a que `shared/lib/image/`
  (`canvas.ts`, `autocrop.ts`, `floodfill.ts`) ya tiene utilidades de
  procesamiento de imagen reales usadas en otras partes del proyecto.
- El botón "SELECCIONAR IMAGEN" no tiene `onClick`.
- Los controles de `umbral` (slider 0-255) y `tonoMedio` (checkbox 2/3
  valores) sí tienen estado real (`useState`) — pero solo mueven el filtro
  CSS sobre la imagen fija, no un procesamiento verdadero.

## Qué haría falta para que sea real

No verificado/diseñado en esta pasada. Como mínimo: permitir subir/elegir
una imagen real (reutilizando `ImageSourceModal` de
`tools/shared/`, ya usado por Crop/Grid), y un threshold real por canvas
(posiblemente reutilizando parte de `shared/lib/image/canvas.ts`) en vez
del filtro CSS actual.

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Verificado: archivo completo leído. `grep` sin resultados para canvas o
  procesamiento de imagen en el resto de `tools/notan/`.

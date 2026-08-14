---
title: "Color Mixing (mezcla de pigmentos)"
audience: frontend
status: stable
updated: 2026-08-14
owner: TBD
---

# Color Mixing

> **Ubicación:** `src/frontend/features/tools/color-mixing/`. **Ruta:**
> `/dashboard/tools/color-mixing`. 100% cliente, sin endpoints API.

Simulador de mezcla de pigmentos: elige un medio (óleo, acuarela, etc.),
apila hasta 6 pigmentos con peso relativo, y calcula el color resultante —
distinto de una mezcla RGB ingenua, modela el comportamiento real de
pigmentos físicos (¿por qué mezclar azul+naranja da un marrón "sucio" en
vez de gris?).

## Arquitectura

- **`useColorMixer.ts`** — todo el estado (medio activo, slots de pigmento,
  historial, paleta guardada) + cálculo derivado (`useMemo`).
- **`colorMixHelpers.ts`** — labels es/en (`getMixLabels`) y tipo `Slot`.
- **`@shared/lib/colorMix.ts`** — el motor real: `mixColors(pigments, model)`,
  conversiones `rgbToHex`/`rgbToCmyk`/`rgbToHsl`/`rgbToLab`, `isMuddy()`
  (detecta mezclas "sucias"). Tiene test (`colorMix.test.ts`).
- **`@shared/lib/mediums.ts`** — `getMedium(id)`: cada medio define su
  `model` de mezcla (afecta cómo se combinan los pigmentos).
- **Componentes**: `MixControls` (selector de medio + peso), `PigmentStack`
  (slots activos), `ResultOrb` (swatch del resultado + valores CMYK/HSL/Lab),
  `MixHistory`, `PaletteDock` (paleta guardada, copiar hex).

## Reglas

- Máximo 6 pigmentos simultáneos por mezcla.
- No se puede añadir el mismo hex dos veces al stack.
- Cambiar de medio limpia el stack (los pesos no tienen sentido entre medios distintos).

## Tests

`src/shared/lib/colorMix.test.ts`. Ver [`../../contributing/testing.md`](../../contributing/testing.md).

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Verificado: `ColorMixScreen.tsx`, `useColorMixer.ts` leídos directamente. Confirmado funcional (motor de mezcla real, no mockup) — contraste con `gesture.md`/`notan.md` en esta misma carpeta.

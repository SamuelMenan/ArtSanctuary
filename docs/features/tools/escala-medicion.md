---
title: "Escala global de medición (Referencia / Final)"
audience: frontend
status: stable
updated: 2026-08-14
owner: TBD
---

# Escala global de medición (Referencia / Final)

Las herramientas de medición (Grid, Boards, Crop, Cutout) comparten una única
**escala global exacta** definida en `src/shared/lib/measure.ts`.

## Escala exacta

```
SCALE_RATIO = 215 / 14   (= 430 / 28)
applyScale(cm) = cm * 215 / 14
```

Se define como fracción entera (`SCALE_RATIO_NUM=215`, `SCALE_RATIO_DEN=14`)
para que los mapeos clave sean exactos en coma flotante:

| Entrada | `applyScale` | Notas |
|--------:|-------------:|-------|
| 28 cm   | **430 cm**   | exacto (28·215/14 = 430) |
| 2 cm    | 430/14 ≈ **30.714285…** cm | decimal periódico |

> No replicar la multiplicación fuera de `measure.ts`. `formatScaled` ya aplica
> la escala internamente; pasarle un valor ya escalado lo duplicaría.

## Formato Referencia vs Final

Ambas escalas se muestran siempre juntas en las herramientas.

- **Referencia** → `formatCm(cm)`: cm **crudos**, **sin** aplicar escala y
  **sin metros**. Ej.: `28 cm`, `430 cm`.
- **Final** → `formatScaled(cm)`: cm **escalados** (×215/14) y, **solo cuando el
  valor escalado ≥ 100 cm**, añade los metros entre paréntesis. Ej.:
  `430 cm (4.3 m)`, `30.71 cm`.

### Redondeo

- **cm**: 2 decimales, recortando ceros finales (`30.70` → `30.7`, `430.00` → `430`).
- **m**: 2 decimales, recortando ceros finales (`4.30` → `4.3`).

### Ejemplos

| Origen | Referencia (`formatCm`) | Final (`formatScaled`) |
|-------:|-------------------------|------------------------|
| 28 cm  | `28 cm`                 | `430 cm (4.3 m)`       |
| 2 cm   | `2 cm`                  | `30.71 cm`             |
| 7 cm   | `7 cm`                  | `107.5 cm (1.08 m)`    |

## Handoff entre herramientas

El payload de handoff (`src/shared/lib/tools/handoff.ts`) ya transporta los
valores escalados precalculados: `widthScaledCm` / `heightScaledCm`
(= `applyScale(widthCm)` / `applyScale(heightCm)`). Úsalos tal cual; no vuelvas
a aplicar la escala al consumirlos.

## Tests

`src/shared/lib/measure.test.ts` (Vitest). Ejecuta:

```bash
npm test
```

---
title: Testing
audience: dev
status: stable
updated: 2026-08-13
owner: TBD
---

# Testing

Vitest. **19 archivos `*.test.ts`** a fecha 2026-08-13, todos lógica pura —
cero tests de componentes React, cero tests de endpoints API.

> ⚠️ **Estado real verificado 2026-08-13, no asumido:** `npm test` falla hoy
> — dos motivos independientes, ninguno relacionado con esta auditoría de
> documentación:
> 1. `i18n:scan` encuentra 3 strings hardcodeados (`AuthAside.tsx:27`,
>    `ImageSourceModal.tsx:172`, `CollectionActions.tsx:55`) y aborta antes
>    de llegar a Vitest (ver más abajo).
> 2. Corriendo `vitest run` directo (saltándose el scan): **18/19 archivos
>    pasan, `lateralMirror.test.ts` falla con 2 tests rotos** —
>    `mirrorSelectedImagesForLateral is not a function` y un mismatch de
>    `id`/`mirroredFrom` en los fixtures. Coincide con el feature de "modo
>    espejo" del commit más reciente del repo — probablemente tests
>    desincronizados de una implementación en curso, no verificado a fondo
>    (fuera de alcance de esta auditoría de documentación).

## Correr los tests

```bash
npm test          # npm run i18n:scan && vitest run — lo que corre en local antes de un PR
npm run test:watch # vitest en modo watch, sin el scan de i18n
npx vitest run     # salta el gate de i18n:scan, corre solo la suite
```

`npm test` corre primero `scripts/find-hardcoded-strings.mjs` (detecta
strings hardcodeados sin i18n) y solo si eso pasa, corre la suite de Vitest.
Un fallo del scan de i18n aborta antes de llegar a los tests — revisa la
salida completa si `npm test` falla y no ves ningún test rojo.

## Dónde viven

Colocados junto al código que prueban, no en una carpeta `__tests__/`
separada: `foo.ts` + `foo.test.ts` en el mismo directorio. Alias
`@shared`/`@frontend`/`@backend` resueltos en `vitest.config.ts` (espejo de
`tsconfig.json`).

## Qué está cubierto

| Dominio | Archivos |
|---|---|
| Motor de medidas Canon (`src/shared/lib/canon/`) | `anatomyParts`, `figure`, `landmarks`, `measurements`, `partHits`, `regions`, `units` |
| Boards / Grid | `boards/lib/grid`, `boards/lib/imageGridPdf`, `grid/lib/colLabel`, `grid/lib/gridGeometry` |
| Reglas de Carnaval (`src/shared/lib/workspaces/carnaval/`) | `planos`, `rules`, `lateralMirror` |
| Workspace Carnaval (frontend) | `carnaval/lib/carnavalGuide`, `carnaval/lib/humanFigure` |
| Utilidades | `colorMix`, `measure`, `validation/settings` |

Patrón común: son módulos de **lógica pura** (`src/shared/lib/*`,
`src/frontend/features/*/lib/*`) — sin React, sin DB, sin HTTP. Coincide con
la regla de arquitectura que exige que el motor de Canon y las reglas de
negocio sean puros y testeables (ver
[`../architecture/estructura-optimizada.md`](../architecture/estructura-optimizada.md)).

## Qué NO está cubierto

Dicho explícito, no implícito:

- **Route handlers** (`src/app/api/**/route.ts`) — cero tests. La única
  verificación hoy es manual o vía el "Post-deploy smoke" de
  [`../ops/deployment.md`](../ops/deployment.md).
- **Componentes React** — cero tests (ni RTL ni snapshot). Los hooks
  (`useBoardData`, `useProfileForm`, etc.) tampoco tienen tests dedicados.
- **Servicios** (`src/backend/services/`) — no verificado si tienen
  cobertura indirecta vía los tests de `shared/lib/`; asumir que no la
  tienen salvo que se compruebe lo contrario.
- **Integración end-to-end** — no hay Playwright/Cypress ni equivalente.

Si vas a tocar algo en esas zonas, no hay red de seguridad automática —
probar manualmente contra `npm run dev` antes de dar por hecho que funciona.

## Convención al añadir tests

- Nombre: `<archivo>.test.ts` junto al archivo que prueba.
- Solo lógica pura por ahora — si necesitas testear algo que toca React o
  HTTP, es una categoría nueva sin precedente en el repo; decide el enfoque
  antes de asumir que existe una convención para eso.

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD
- Conteo de `*.test.ts`: 19 (verificado con `Glob`, sin `*.test.tsx` ni `*.spec.ts`)
- `npm test` corrido realmente: falla en el gate de `i18n:scan`. `npx vitest run`
  corrido por separado: 18/19 archivos, 139/141 tests pasan. Ver aviso arriba.

---
title: Code & commit conventions
audience: all
status: stable
updated: 2026-08-13
owner: TBD
---

# Code & commit conventions

## TypeScript

- **`strict: true`** activo en `tsconfig.json`. No relajar.
- Sin `any` salvo justificación en comentario.
- `unknown` para input no validado, refinar via type guards.
- Discriminated unions para resultados (`{ ok: true, value } | { ok: false, ... }`).
- Interfaces para shapes públicos, `type` para uniones/utilidades.
- `Type imports` con `import type` si `verbatimModuleSyntax` se activa
  (actualmente solo en `mcp/`).

## Naming

| Tipo | Convención | Ejemplo |
|---|---|---|
| Componente | PascalCase | `ProfileHero` |
| Hook | camelCase con `use` | `useStatus` |
| Helper / util | camelCase | `safeResolve`, `validateProfile` |
| Constante | UPPER_SNAKE | `CONFIRM_WORD`, `AVATAR_MAX_BYTES` |
| Tipo | PascalCase | `EndpointInfo`, `ProfileInput` |
| Archivo componente | `PascalCase.tsx` | `ProfileForm.tsx` |
| Archivo hook | `useX.ts` | `useStatus.ts` |
| Archivo helper | `kebab-case.ts` o `camelCase.ts` | `paths.ts`, `requestPreferences.ts` |

## Imports

- Path aliases (`tsconfig.json`): `@backend/*` → `src/backend/*`,
  `@frontend/*` → `src/frontend/*`, `@shared/*` → `src/shared/*`. No existe
  alias genérico `@/*`.
- Orden: external → `@backend/*` → `@frontend/*` → `@shared/*` → relativos.
- Sin imports default cuando se puede nombrar.

## Estructura de componente

```tsx
'use client'                             // si es client component

import { useState } from 'react'
import { someHelper } from '@shared/lib/...'

interface Props {
  // ...
}

export function MyComponent({ ... }: Props) {
  // hooks
  // handlers
  // render
}

// Sub-componente interno (no exportado)
function SubPart() { ... }
```

## Commits

**Convention Commits** (best-effort, no enforzado por hook todavía):

```
<type>(<scope>): <description>

[body opcional]

[footer opcional]
```

Types:
- `feat` — nueva funcionalidad
- `fix` — bug fix
- `refactor` — sin cambio funcional
- `docs` — solo documentación
- `chore` — build, deps, herramientas
- `style` — formateo, sin lógica
- `perf` — optimización
- `test` — solo tests

Ejemplos:
```
feat(settings): añadir privacy toggles
fix(auth): rotar tokenVersion en delete account
docs(api): documentar /api/settings/avatar
refactor(profile): extraer ProfileHero
chore(mcp): bump @modelcontextprotocol/sdk
```

Subject:
- imperativo presente ("añadir", no "añadido").
- minúscula.
- ≤ 72 chars.

Co-author footer cuando aplique:
```
Co-Authored-By: Nombre <email>
```

## Branches

- `main` — protegida, deploys automáticos.
- Feature branches: `feat/<short-desc>`, `fix/<short-desc>`, `docs/<...>`.
- Sin long-lived branches paralelos a `main`.

## PRs

- Título sigue formato de commit.
- Body con:
  - **Summary**: 1-3 bullets de qué cambió.
  - **Test plan**: checklist manual.
- Squash merge a `main` por default.

## Linting

```bash
npm run lint                # ESLint
npx tsc --noEmit            # TypeScript check
```

Sin auto-format hook todavía. Si se añade Prettier, configurar via `.prettierrc`
con:
- `singleQuote: true`
- `semi: false`
- `printWidth: 100`
- `trailingComma: 'all'`

## Code review

- Cambios en `src/backend/models/` o `src/app/api/` requieren actualizar docs correspondientes.
- Cambios en `src/backend/auth/` requieren ADR si afectan flujo de sesión.
- Cambios destructivos en endpoints (response shape, status codes) requieren
  versionado o nota de migración.
- **Todo rename/move de carpeta bajo `src/` requiere `grep -r "<ruta-vieja>"
  docs/` antes de mergear, y corregir lo que aparezca.** Esta regla existe
  porque el refactor a `src/` (2026-06) dejó ~26 docs con rutas rotas sin que
  nadie lo notara hasta una auditoría en 2026-08 — ver
  [ADR-0022](../adr/0022-docs-agents-tracked-in-git.md) para el contexto
  completo. Corre `npm run docs:check` como primer filtro (detecta el patrón
  más común, no sustituye el grep dirigido para un rename específico).

## Anti-patterns

❌ Comentarios que repiten el código (`// incrementa contador` sobre `i++`).
❌ Catch silencioso de errores: `try { ... } catch {}` sin loggear ni rethrow.
❌ Endpoints sin `requireUser` cuando deberían tenerlo.
❌ Hardcode de strings que deberían ir en i18n.
❌ Lógica en JSX (más de un ternario o nested `&&`). Extraer a variable o helper.
❌ Props drilling > 2 niveles. Considerar context.
❌ `useEffect` con array de deps vacío para "ejecutar al montar" cuando se
   puede usar lazy initialization.
❌ Importar componentes server desde client (rompe RSC).

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD

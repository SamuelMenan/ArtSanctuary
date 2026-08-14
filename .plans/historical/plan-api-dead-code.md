---
title: "Plan: Eliminación de código muerto en la API"
audience: dev
status: draft
updated: 2026-06-01
owner: TBD
---

# Plan: Dead Code Elimination en `app/api` y wrappers de fetch

> Continuación (Fase 4) de [`plan-reestructuracion-global.md`](./plan-reestructuracion-global.md),
> ya **completado**. Aquel movió la lógica a `backend/services` y confirmó que las
> lecturas de UI ya van Server Component → `@backend` directo (0 `fetch('/api')`
> interno). Este plan retira lo que quedó sin uso.

## Contexto

Con la lógica en servicios y las lecturas en servidor, pueden existir:
1. **Endpoints `route.ts` sin consumidor**: si un endpoint solo lo usaba un Server
   Component (que ahora llama al servicio directo), la ruta puede sobrar.
2. **Wrappers/helpers de fetch local** creados para envolver `fetch('/api/...')`.
3. **DTOs/interfaces** que solo serializaban respuestas de rutas borradas.
4. **Restos** ya detectados: dead-code tras `return` (limpiado en artworks POST),
   imports muertos.

> Nota de realidad (medida): hoy el cliente usa `fetch('/api')` para **mutaciones**
> (41 ocurrencias, todas en componentes cliente). Esos endpoints **siguen vivos**.
> No esperar muchos endpoints muertos; este plan es de **auditoría + poda fina**.

## Procedimiento

### 1. Auditoría de endpoints sin uso
Por cada `route.ts`, buscar consumidores:

- Cliente: `grep -rn "fetch(\`/api/<ruta>\`" src/frontend` (y variantes con comillas).
- Servidor: ¿algún Server Component llama al **servicio** equivalente en vez del
  endpoint? Si el endpoint **solo** existía para alimentar un RSC y ya nadie lo
  llama por HTTP → candidato a borrar.
- API externa: confirmar que no haya clientes móviles/terceros (si los hay, **no**
  borrar aunque la web no lo use; documentarlo).

Salida: lista `endpoint → consumidores`. Los de **0 consumidores web y sin API
externa** se eliminan (carpeta + `route.ts`).

### 2. Borrado de wrappers de fetch local
- Buscar helpers tipo `apiFetch`, `getJson`, `lib/api/*` que solo envuelvan
  `fetch('/api/...')`. Si el dato ya se obtiene vía servicio en RSC, retirar el
  wrapper y sus usos.

### 3. Limpieza de tipos
- Eliminar DTOs/interfaces creados solo para tipar respuestas de rutas borradas.
- Pasar `eslint`/`tsc` para detectar imports/símbolos sin uso resultantes.

### 4. Restos varios
- `void mongoose` y trucos similares ya retirados en el refactor; verificar que no
  queden imports inertes (`connectDB` importado y no usado en controllers que ahora
  delegan, etc.).

## Guardarraíl

- (Opcional) `eslint` con `no-unused-vars`/`@typescript-eslint/no-unused-vars` en
  `error` para `src/app/api` y `src/backend`.
- (Opcional) script que liste `route.ts` sin referencias `fetch('/api/<x>')` en
  `src/frontend` para revisión periódica.

## Métrica de éxito

- 0 `route.ts` sin consumidor (web) y sin API externa documentada.
- 0 wrappers de fetch local muertos.
- 0 DTOs/imports sin uso (tsc/eslint limpios).
- Build + typecheck + lint verdes; **sin cambios de comportamiento**.

## Riesgo

- **Borrar un endpoint con cliente externo**: mitigar con la confirmación de API
  externa antes de eliminar. Ante la duda, marcar `@deprecated` y esperar, no borrar.

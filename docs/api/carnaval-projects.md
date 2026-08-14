---
title: Rutas API de Carnaval
audience: backend
status: stable
updated: 2026-08-14
owner: TBD
---

> ⚠️ Corregido a fondo 2026-08-14 tras verificar `route.ts` y los modelos
> reales directamente — varios `body`/`response` no coincidían con el
> código (ver detalle en cada endpoint abajo).

# API: Proyectos de Carnaval (`/api/carnaval-projects`)

Este conjunto de rutas gestiona el backend del Workspace Carnaval, incluyendo el CRUD de proyectos, la serialización de planos (Boards) y la inmutabilidad de versiones. Todas las respuestas siguen la convención `apiOk`/`apiError`.

## Endpoints Principales

### `GET /api/carnaval-projects`
Retorna la lista de proyectos pertenecientes al usuario autenticado —
**corregido 2026-08-14**: incluye tanto proyectos `kind: 'carnaval'` como
`kind: 'libre'` (es el mismo modelo `CarnivalProject`/"Project" genérico
para ambos, ver [`../architecture/data-model.md#carnivalproject`](../architecture/data-model.md#carnivalproject)).
- **Respuesta real**: `{ projects: ICarnivalProject[] }` — **no** `{ data: { projects } }`.

### `POST /api/carnaval-projects`
Crea un nuevo proyecto en blanco.
- **Body real**: `{ name: string, modality?: string, year?: number }` —
  **corregido**: no es `title`/`kind`/`editionYear`. `kind` no se pasa en
  el body (el schema lo default-ea a `'carnaval'` — no verificado si existe
  otra vía para crear un proyecto `kind: 'libre'`).
- Límite de plan free: `MAX_FREE_PROJECTS = 3`, error 403 con `{ error: string }` inline (no `apiError`, mismo patrón inconsistente que `collections`).
- **Validación**: `createCarnivalProject` devuelve `null`/falsy si `modality` no es válida → `apiError('VALIDATION_ERROR', 'Modalidad inválida')`.

### `GET /api/carnaval-projects/[id]`
Retorna el detalle completo del proyecto, incluyendo los tableros (planos) activos.
- **Comportamiento Especial**: Mapea manualmente el arreglo de IDs de `planos` cruzándolos con la colección `boards`. Retorna el proyecto populado completo.

### `PATCH /api/carnaval-projects/[id]`
Actualiza parámetros del expediente (título, descripción, etc.).

### `DELETE /api/carnaval-projects/[id]`
Elimina el proyecto. **Faltaba en este doc** — añadido 2026-08-14 tras
verificar `[id]/route.ts` directamente (exporta GET/PATCH/DELETE, no solo
GET/PATCH).

## Endpoints de Versiones (Snapshots)

### `GET /api/carnaval-projects/[id]/versions`
Lista el historial de versiones/snapshots generados para este proyecto.
- **Seguridad**: Proyección optimizada (`.select("-planos.objects -planos.background")`) que evita descargar los arrays masivos de trazos de Konva, basándose en la pre-computación del campo `objectCount`.

### `POST /api/carnaval-projects/[id]/versions`
Toma el estado *actual* de todos los planos del proyecto (sus `Board`s) y los clona en profundidad de manera inmutable dentro de un nuevo documento `CarnivalProjectVersion`.
- **Uso Crítico**: Imprescindible para el envío final de la propuesta a los Jurados de Corpocarnaval.

### `POST /api/carnaval-projects/[id]/versions/[vid]`
**Corregido 2026-08-14 — antes documentado como `GET`, es incorrecto.**
Verificado leyendo `versions/[vid]/route.ts` completo: esa ruta **no exporta
ningún `GET`**. Restaura el snapshot `[vid]` sobre los planos actuales del
proyecto (`restoreVersion()`).

### `PATCH /api/carnaval-projects/[id]/versions/[vid]`
Marca la versión como final (`markFinal()`). No documentado antes.

### `DELETE /api/carnaval-projects/[id]/versions/[vid]`
Borra la versión (`deleteVersion()`). No documentado antes.

**Pendiente de verificar** (no resuelto en esta pasada): cómo se obtiene el
detalle de lectura de una versión específica en modo solo-lectura si no hay
`GET` dedicado — ¿se sirve completo dentro de la lista de
`GET .../versions`, o falta ese endpoint? Confirmar antes de asumir que el
frontend puede leer una versión individual por ID.

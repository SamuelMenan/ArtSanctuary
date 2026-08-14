---
title: "Capa de servicios (src/backend/services/)"
audience: backend
status: stable
updated: 2026-08-14
owner: TBD
---

# Capa de servicios

El núcleo real de lógica de negocio, según el patrón Controlador-Servicio de
[`estructura-optimizada.md`](estructura-optimizada.md): los `route.ts` son
delgados (extraen sesión/body, llaman al servicio, mapean a `apiOk`/
`apiError`), y los Server Components invocan estas mismas funciones
**directo en memoria**, sin pasar por HTTP (ver
[`diagramas/flujo-datos-rsc.md`](diagramas/flujo-datos-rsc.md)).

## Reglas de la capa

Copiadas de `src/backend/services/README.md` (vive en el código, no en
`docs/` — por eso se repite aquí):

1. **Nunca** importar `NextRequest`/`NextResponse`/nada de `next/server`.
2. **Nunca** importar hooks de React ni componentes de UI.
3. Toda consulta a DB que retorne objetos debe terminar en `.lean()` (POJOs — los Server Components no pueden serializar documentos Mongoose completos, ver ADR-0017).
4. Los errores lanzados aquí los atrapa la capa superior (`withErrorHandler` en la ruta, o el propio Server Component).
5. Import directo (`@backend/services/artworks.service`), no hay barrel/index.

## Inventario (verificado con `get_outline`, 2026-08-14)

### `artworks.service.ts`
`getPublicGallery`, `searchArtworks`, `getGalleryArtworks`,
`getFollowingFeed`, `getArtworksByArtist`, `createArtwork`,
`getArtworkForView`, `updateArtwork`, `deleteArtwork`, `interactWithArtwork`
(like/save/view — devuelve `InteractResult`).

### `boards.service.ts`
`getUserBoards`, `countUserBoards`, `createBoard`, `getBoardById`,
`updateBoard`, `deleteBoard`. **`MAX_FREE_BOARDS = 5`** — límite del plan
free, no documentado en ningún otro lado hasta ahora.
`syncCarnavalLateralMirror` — sincroniza el "modo espejo" de Boards con
Carnaval; corresponde a `shared/lib/workspaces/carnaval/lateralMirror.ts`,
que a fecha 2026-08-14 tiene **2 tests rotos** (ver
[`../contributing/testing.md`](../contributing/testing.md)).

### `collections.service.ts`
`getUserCollections`, `countUserCollections`, `createCollection`,
`getCollectionById`, `deleteCollection`, `renameCollection`,
`addArtworkToCollection`, `removeArtworkFromCollection`.
**`MAX_FREE_COLLECTIONS = 3`**.

### `explore.service.ts`
`getExploreTrending` — único export, respalda `GET /api/explore/trending`
(hoy sin doc de API dedicado, solo una línea en
[`routing.md`](routing.md)).

No es una función normal: es un **`unstable_cache`** con
`revalidate: 60` y tag `artworks`, así que la respuesta se sirve cacheada hasta
60s o hasta que se invalide el tag.

⚠️ Dos de sus cuatro campos son **stubs**: `trendingTags` es un array literal
hardcodeado y `featuredArtists` son los 4 primeros usuarios sin `sort`. Ver
[`../ops/known-issues.md`](../ops/known-issues.md#6).

### `notifications.service.ts`
`getUserNotifications`, `markNotificationRead`, `markAllNotificationsRead`.

⚠️ Los `import "@backend/models/User"` sin usar al principio del archivo **son
load-bearing**: registran los schemas para que `.populate()` no lance en
arranque en frío. Un linter que "limpie imports" rompe producción. `getUserNotifications`
está capado a 20 sin paginación. Ver [`../ops/known-issues.md`](../ops/known-issues.md#8).

### `users.service.ts`
`isUsernameTaken`, `isEmailTaken`, `deleteAccountCascade` (la cascada de
[ADR-0004](../adr/0004-hard-delete-sin-tx.md)), `updateUserPreferences`,
`getUserById`, `getPublicProfile`, `followUser`, `unfollowUser`,
`getFollowConnections`.

Comportamiento que no se deduce de la firma:

- **`followUser` crea una `Notification` de forma idempotente**: solo si no
  existe ya una `{recipientId, actorId, type:'follow'}`. Un re-follow meses
  después **no** vuelve a notificar. `unfollowUser` borra esa notificación
  aunque ya se hubiera leído.
- **`deleteAccountCascade` — orden exacto**, secuencial y sin transacción:
  `Artwork.deleteMany` → `Collection.deleteMany` → `Notification.deleteMany` →
  `$pull` de following/followers en el resto de usuarios → `User.deleteOne` →
  `deleteAvatarFile`. El borrado del usuario es el **penúltimo** paso.
- **`getFollowConnections` devuelve la lista completa junto al flag
  `allowFollow`** y delega la decisión de acceso al controlador: si un caller
  olvida mirarlo, filtra. Sin paginación.

⚠️ Este servicio concentra 4 de los bugs conocidos, incluido el más grave
(`getPublicProfile` devuelve siempre `artworks: []`). Leer
[`../ops/known-issues.md`](../ops/known-issues.md) antes de tocarlo.

### `workspaces/carnaval/carnaval-projects.service.ts`
`getUserProjects`, `countUserProjects`, `createCarnivalProject`,
`getProjectById`, `updateProject`, `deleteProject`.
**`MAX_FREE_PROJECTS = 3`**.

### `workspaces/carnaval/carnaval-versions.service.ts`
`createVersion`, `listVersions`, `restoreVersion`, `markFinal`,
`deleteVersion` — el ciclo de vida de `CarnivalProjectVersion` (snapshots
inmutables). Corregido en
[`../api/carnaval-projects.md`](../api/carnaval-projects.md) el 2026-08-14
(faltaban `restoreVersion`/`markFinal`/`deleteVersion`, y el método de
restore estaba mal documentado como `GET` siendo `POST`).

### `auth.service.ts`
`registerUser` — ver [`../features/auth-ui.md`](../features/auth-ui.md) y
[`auth.md`](auth.md#registro).

## Límites de plan free — resumen

No documentados en ningún otro lugar antes de esta pasada:

| Recurso | Límite free |
|---|---|
| Boards | 5 |
| Collections | 3 |
| Proyectos Carnaval | 3 |

No verificado: dónde/cómo se aplica el upgrade a `pro` para saltarse estos
límites (fuera de alcance de esta pasada).

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Verificado: `get_outline` (MCP) sobre los 9 archivos de servicio +
  `auth.service.ts` leído completo. `api/carnaval-projects.md` **no** se
  releyó contra `carnaval-versions.service.ts` — marcar como pendiente si
  se necesita certeza total ahí.

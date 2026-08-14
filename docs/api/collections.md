---
title: API /api/collections
audience: backend
status: wip
updated: 2026-08-13
owner: TBD
---

# API `/api/collections`

Colecciones curadas por usuario. Ya usa `withErrorHandler`/`apiError`
(verificado 2026-08-14) — **excepto** el límite de plan free en `POST`, que
responde `{ error: string }` inline en vez de `apiError`.

## Resumen

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| GET | `/api/collections` | requerida | Colecciones del usuario actual |
| POST | `/api/collections` | requerida | Crear (máx. `MAX_FREE_COLLECTIONS = 3` en plan free) |
| GET | `/api/collections/[id]` | público (si `!isPrivate`) | Detalle |
| PUT | `/api/collections/[id]` | requerida (owner) | Renombrar (**no** `PATCH`, y **solo** `name` — no "editar metadata" en general) |
| DELETE | `/api/collections/[id]` | requerida (owner) | Eliminar |
| POST | `/api/collections/[id]/artworks` | requerida (owner) | Añadir obra |
| DELETE | `/api/collections/[id]/artworks` | requerida (owner) | Quitar obra |

---

## GET `/api/collections`

Lista colecciones del usuario autenticado (ambas públicas y privadas, solo las
propias).

**Response:** `{ collections: [...] }`.

---

## POST `/api/collections`

Crear colección.

**Body:**

```ts
{
  name: string
  description?: string
  isPrivate?: boolean   // default false. NO es `isPublic` — verificar antes de usar.
}
```

`coverArtworkId` **no** se acepta en create pese a que `data-model.md` lo
lista como campo del modelo — no verificado si hay otro endpoint que lo
setee.

**Side effects:** `createCollection(userId, { name, description, isPrivate })`
→ `Collection.create(...)`. Antes de crear, chequea
`countUserCollections(userId) >= MAX_FREE_COLLECTIONS` → 403 con
`{ error: string }` (no `apiError`, inconsistente con el resto del archivo).

---

## GET `/api/collections/[id]`

Detalle. Si `collection.isPrivate` y viewer ≠ owner → `apiError('FORBIDDEN', ...)`.

**Response:** `{ collection: {..., artworks: [Artwork...]} }`.

---

## PUT `/api/collections/[id]`

Renombrar. Owner-only (chequeado dentro de `renameCollection`, no antes).

**Body:** `{ name: string }` — solo renombra, no toca `description`/`isPrivate`.

**Response:** `{ success: true, collection }`.

---

## DELETE `/api/collections/[id]`

Eliminar. Owner-only.

**Cascada delete usuario:** `Collection.deleteMany({ owner: userId })` ejecuta
en endpoint de delete cuenta.

---

## POST `/api/collections/[id]/artworks`

Añadir obra a la colección.

**Body:** `{ artworkId: string }`.

**Side effects:** `Collection.artworks.$addToSet(artworkId)` +
`Artwork.savedBy.$addToSet(ownerId)`.

**Notificación: NO se crea.** Verificado 2026-08-14 leyendo
`addArtworkToCollection()` completo (`collections.service.ts`) — no hay
`Notification.create` en absoluto. La afirmación anterior de este doc (y la
tabla de `api/notifications.md`) de que esto dispara un `save` era
incorrecta; corregir también allá.

---

## DELETE `/api/collections/[id]/artworks`

Quitar obra.

**Body:** ninguno — `artworkId` va en **query string**
(`?artworkId=...`), no en el body JSON.

**Side effects:** `Collection.artworks.pull(artworkId)` (vía
`removeArtworkFromCollection`).

---

## Consumers

- `src/app/collections/[id]/page.tsx` — detalle.
- `src/frontend/shared/ui/SaveToCollectionModal.tsx` — POST artworks.
- `src/frontend/shared/ui/CollectionActions.tsx` — CRUD.
- Sidebar — list de colecciones del usuario.

## Pendiente

- Unificar el error del límite de plan free a `apiError` (hoy es el único inline).
- `coverArtworkId` no tiene endpoint que lo setee — confirmar si es campo muerto en el modelo o falta implementar.
- Endpoint para reordenar obras dentro de colección.

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Verificado leyendo los 3 `route.ts` completos + `collections.service.ts` completo, no solo por nombre.

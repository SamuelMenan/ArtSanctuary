---
title: API /api/collections
audience: backend
status: wip
updated: 2026-08-13
owner: TBD
---

# API `/api/collections`

Colecciones curadas por usuario. Endpoints legacy (no `apiError` estructurado).

## Resumen

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| GET | `/api/collections` | requerida | Colecciones del usuario actual |
| POST | `/api/collections` | requerida | Crear |
| GET | `/api/collections/[id]` | público (si `isPublic`) | Detalle |
| PATCH | `/api/collections/[id]` | requerida (owner) | Editar |
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
  isPublic?: boolean
  coverArtworkId?: string
}
```

**Side effects:** `Collection.create({ ...body, owner: currentUserId, artworks: [] })`.

---

## GET `/api/collections/[id]`

Detalle. Si `isPublic === false` y viewer ≠ owner → 403.

**Response:** `{ collection: {..., artworks: [Artwork...]} }`.

---

## PATCH `/api/collections/[id]`

Editar metadata. Owner-only.

---

## DELETE `/api/collections/[id]`

Eliminar. Owner-only.

**Cascada delete usuario:** `Collection.deleteMany({ owner: userId })` ejecuta
en endpoint de delete cuenta.

---

## POST `/api/collections/[id]/artworks`

Añadir obra a la colección.

**Body:** `{ artworkId: string }`.

**Side effects:** `Collection.artworks.$addToSet(artworkId)`.

**Notificación:** crear `Notification { type: 'save', recipientId: artwork.artistId, actorId, entityId: artworkId }` si la obra no es del owner de la colección.

---

## DELETE `/api/collections/[id]/artworks`

Quitar obra.

**Body:** `{ artworkId: string }`.

**Side effects:** `Collection.artworks.pull(artworkId)`.

---

## Consumers

- `src/app/collections/[id]/page.tsx` — detalle.
- `src/frontend/shared/ui/SaveToCollectionModal.tsx` — POST artworks.
- `src/frontend/shared/ui/CollectionActions.tsx` — CRUD.
- Sidebar — list de colecciones del usuario.

## Pendiente

- Migrar a `apiOk`/`apiError`.
- Documentar shape exacta de `coverArtworkId` populate.
- Endpoint para reordenar obras dentro de colección.

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD

---
title: API /api/artworks
audience: backend
status: wip
updated: 2026-08-13
owner: TBD
---

# API `/api/artworks`

CRUD de obras + búsqueda + interacciones (like / save / view).

Endpoints legacy con shape `{ error: string }` (no `apiError` estructurado).
Migrar progresivamente.

## Resumen

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| GET | `/api/artworks` | público | List paginado |
| POST | `/api/artworks` | requerida | Crear obra |
| GET | `/api/artworks/[id]` | público | Detalle |
| PATCH | `/api/artworks/[id]` | requerida (owner) | Editar metadata |
| DELETE | `/api/artworks/[id]` | requerida (owner) | Eliminar |
| POST | `/api/artworks/[id]/interact` | requerida | like / save / view |
| GET | `/api/artworks/search` | público | Búsqueda + filtros |

---

## GET `/api/artworks`

List paginado de obras públicas.

**Query params (esperados):**
- `category`
- `discipline`
- `limit`, `offset` o `cursor`

**Response:** `{ artworks: [...], total?: number }`.

---

## POST `/api/artworks`

Crear obra. Body típicamente recibe `imageUrl` ya subida vía `/api/upload`.

**Body:**

```ts
{
  title: string
  imageUrl: string
  thumbnailUrl?: string
  category?: string
  discipline?: string
  technique?: string
  medium?: string
  materials?: string
  dimensions?: string
  tags?: string[]
  creationDate?: { type, value }
  visibility?: 'public' | 'private' | 'unlisted'
}
```

**Side effects:** `Artwork.create({...artistId: currentUserId})`.

---

## GET `/api/artworks/[id]`

Detalle de obra. Incluye populate de `artistId`.

**Response:** `{ artwork: {..., artistId: { username, displayName, avatarUrl } } }`.

**Side effects:** opcionalmente añade currentUser a `viewedBy` (idempotente con
`$addToSet`).

---

## PATCH `/api/artworks/[id]`

Editar metadata. Solo el `artistId` original puede editar.

**Auth check:** `artwork.artistId.toString() === session.user.id` → 403 si no
match.

---

## DELETE `/api/artworks/[id]`

Eliminar. Mismo check de owner. Además:
- Remover de todas las `Collection.artworks` que la contengan.
- Notificaciones relacionadas: no se eliminan (deferred).

---

## POST `/api/artworks/[id]/interact`

Like / save / view. Body discriminator:

```ts
{ action: 'like' | 'unlike' | 'save' | 'unsave' | 'view' }
```

**Side effects (`like`)**:
- `Artwork.likedBy.$addToSet(currentUserId)`
- Crear `Notification { type: 'like', recipientId: artwork.artistId, actorId, entityId }`

**Side effects (`save`)**:
- Para guardar en una colección específica, usar `/api/collections/[id]/artworks`.
- `interact` con `save` añade a `Artwork.savedBy` solamente (índice global).

---

## GET `/api/artworks/search`

Búsqueda full-text + filtros.

**Query params:**
- `q` — texto libre (matchea title, tags, technique)
- `category`, `medium`, `technique`
- `tag`

**Response:** `{ artworks: [...] }`.

Sin paginación documentada — verificar leyendo `src/app/api/artworks/search/route.ts` directamente.

---

## Consumers

- `src/app/gallery/page.tsx` — GET list.
- `src/app/explore/page.tsx` — search.
- `src/app/upload/page.tsx` → `/api/upload` → POST artwork.
- `src/app/profile/page.tsx`, `/profile/[id]/page.tsx` — usan `Artwork.find` directo
  (server component, no llaman endpoint).
- `src/frontend/shared/ui/ArtworkModal.tsx` — interact.

## Pendiente

- Migrar todas las responses a `apiOk`/`apiError`.
- Documentar exactamente qué hace cada `action` de `interact`.
- Paginación cursor estandarizada.

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD

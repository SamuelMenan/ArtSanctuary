---
title: API /api/users
audience: backend
status: stable
updated: 2026-08-13
owner: TBD
---

# API `/api/users`

Perfil público, follow toggle, listas followers/following.

## Naming quirk

El segmento dinámico se llama `[username]` por razones históricas pero recibe
**ObjectId**, no username. Mantener para compatibilidad con `FollowButton.tsx`
existente. Considerar rename futuro a `[id]`.

## Resumen

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| GET | `/api/users/[id]` | público | Perfil + obras públicas del artista |
| POST | `/api/users/[id]/follow` | requerida | Empezar a seguir |
| DELETE | `/api/users/[id]/follow` | requerida | Dejar de seguir |
| GET | `/api/users/[id]/followers` | público (con gating) | Lista seguidores |
| GET | `/api/users/[id]/following` | público (con gating) | Lista seguidos |

---

## GET `/api/users/[id]`

Perfil público de un usuario + sus obras públicas.

**Auth:** no requerida.

**Response 200:**

```json
{
  "user": {
    "_id": "...",
    "username": "esteban",
    "displayName": "Esteban Pérez",
    "bio": "...",
    "avatarUrl": "...",
    "location": "Pasto, Nariño",
    "plan": "free",
    "createdAt": "..."
  },
  "artworks": [ { "_id", "title", "imageUrl", "thumbnailUrl", "category", "technique", "year", "createdAt" } ]
}
```

**Errores:** `NOT_FOUND` (404), `INTERNAL_ERROR` (500).

> Endpoint legacy con shape `{ error: string }` (no `apiError` estructurado).
> Migrar cuando se reescriba.

---

## POST `/api/users/[id]/follow`

Empezar a seguir al usuario.

**Auth:** requerida.

**Side effects:**
- `User[targetId].followers.addToSet(currentUserId)`
- `User[currentUserId].following.addToSet(targetId)`
- Crear `Notification { type: 'follow', recipientId: target, actorId: current }`

**Response 200:** `{ followers: number, following: number, isFollowing: true }`.

**Errores:**
- `UNAUTHORIZED` (401)
- 400 si `followerId === followingId` (no autofollow)
- `NOT_FOUND` (404)

---

## DELETE `/api/users/[id]/follow`

Dejar de seguir.

**Side effects:**
- `User[targetId].followers.pull(currentUserId)`
- `User[currentUserId].following.pull(targetId)`
- (no se elimina la notificación previa)

**Response 200:** `{ followers, following, isFollowing: false }`.

---

## GET `/api/users/[id]/followers`

Lista de usuarios que siguen al target.

**Gating:** `target.privacySettings.allowFollow`. Si `false` y viewer no es
owner → 403.

**Response 200:**

```json
{
  "users": [
    { "_id": "...", "username": "...", "displayName": "...", "avatarUrl": "..." }
  ]
}
```

**Errores:**
- `NOT_FOUND` (404)
- 403 "Lista privada"

---

## GET `/api/users/[id]/following`

Lista de usuarios seguidos por el target. Mismo gating y shape.

---

## Consumers

- `src/app/profile/[id]/page.tsx` — GET perfil.
- `src/frontend/shared/ui/FollowButton.tsx` — POST/DELETE follow.
- `src/frontend/features/profile/FollowListModal.tsx` — GET listas.

## Mejoras pendientes

- Migrar a `apiOk`/`apiError` consistente.
- Rename `[username]` → `[id]`.
- Paginación en listas followers/following (cursor-based).
- Devolver `isFollowedByMe` por cada item de la lista para mostrar follow button
  inline.

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD

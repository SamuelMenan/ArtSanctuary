---
title: API /api/notifications
audience: backend
status: wip
updated: 2026-08-13
owner: TBD
---

# API `/api/notifications`

Notificaciones del usuario actual.

## Resumen

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| GET | `/api/notifications` | requerida | List notif del usuario actual |
| POST | `/api/notifications/[id]/read` | requerida | Marcar individual leída |
| POST | `/api/notifications/read-all` | requerida | Marcar todas leídas |

---

## GET `/api/notifications`

Notificaciones donde `recipientId === currentUserId`.

**Response:**

```json
{
  "notifications": [
    {
      "_id": "...",
      "type": "like | comment | follow | save",
      "actorId": { "_id", "username", "displayName", "avatarUrl" },  // populated
      "entityId": "...",
      "read": false,
      "createdAt": "..."
    }
  ],
  "unreadCount": 12
}
```

Ordenado por `createdAt: -1`.

---

## POST `/api/notifications/[id]/read`

Marcar una notificación como leída.

**Owner check:** `notification.recipientId === currentUserId` → 403 si no
match.

**Side effects:** `notification.read = true`.

---

## POST `/api/notifications/read-all`

Marcar todas las del usuario como leídas.

**Side effects:**

```ts
Notification.updateMany(
  { recipientId: currentUserId, read: false },
  { $set: { read: true } }
)
```

**Response:** `{ updated: number }`.

---

## Generación de notificaciones

Las notificaciones NO se crean por este endpoint. Se crean como **side effect**
en otros endpoints:

| Endpoint que dispara | Tipo de notif |
|---|---|
| `POST /api/users/[id]/follow` | `follow` |
| `POST /api/artworks/[id]/interact` action=like | `like` |
| `POST /api/artworks/[id]/interact` action=comment | `comment` |
| `POST /api/collections/[id]/artworks` | `save` |

---

## Consumers

- `src/frontend/shared/layouts/Navbar.tsx` — badge unread count + dropdown.
- (futuro) `/notifications/page.tsx` — vista completa.

## Cascada delete usuario

```ts
Notification.deleteMany({
  $or: [{ recipientId: userId }, { actorId: userId }]
})
```

Borra tanto las que recibió como las que disparó. Ver
[ADR-0004](../adr/0004-hard-delete-sin-tx.md).

## Pendiente

- Migrar a `apiOk`/`apiError`.
- Paginación cursor.
- Filtrar por tipo desde el endpoint (`?type=follow`).
- Respetar `User.notificationSettings` para filtrar disabled types (hoy solo
  estructura, no se aplica en el GET).
- Push notifications (web push API) — out of scope.

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD

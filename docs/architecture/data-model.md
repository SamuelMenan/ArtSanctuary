---
title: Data model
audience: backend
status: stable
updated: 2026-08-13
owner: TBD
---

# Data model

> ⚠️ Rutas actualizadas a la estructura vigente (`src/backend/models/`). Ver
> [`estructura-optimizada.md`](estructura-optimizada.md).

Mongoose schemas en `src/backend/models/`. MongoDB single-instance (no replica set en demo).

## ER simplificado

```
┌─────────┐ 1   N ┌──────────┐
│  User   ├───────┤ Artwork  │  artistId → User._id
│         │       └──────────┘
│         │ 1   N ┌──────────┐
│         ├───────┤Collection│  owner → User._id
│         │       └──────────┘
│         │ 1   N ┌──────────────┐
│         ├───────┤ Notification │ recipientId / actorId → User._id
│         │       └──────────────┘
│         │ 1   N ┌───────────────┐  1   N ┌───────────────┐
│         ├───────┤ CarnivalProj  ├────────┤ CarnivalVers  │
│         │       └───────┬───────┘        └───────────────┘
│         │               │ 1
│         │               v N
│         │       ┌───────────────┐
│         └───────┤     Board     │ owner → User._id
└────┬────┘       └───────────────┘
     │
     │ M:N self-ref via followers[] / following[]
     └──→ User._id[]
```

## Convenciones

- ID externo: `Types.ObjectId` (Mongoose default).
- Timestamps en todos los schemas (`{ timestamps: true }` → `createdAt`, `updatedAt`).
- `delete mongoose.models.X` antes de re-registrar — evita errores en hot-reload.
- Subdocuments (`socials`, `notificationSettings`, `privacySettings`) sin `_id` propio.

## `User`

`src/backend/models/User.ts`. Documento central: perfil + preferencias + flags de seguridad.

### Identidad

| Campo | Tipo | Restricciones |
|---|---|---|
| `username` | `String` | unique, 3-30, `[a-z0-9_]+`, required |
| `email` | `String` | unique, lowercase, trim, required |
| `emailPendingChange` | `String \| null` | Reservado verificación SMTP |
| `passwordHash` | `String` | `select: false`, required |
| `displayName` | `String` | maxlength 60 |
| `bio` | `String` | maxlength 300 |
| `avatarUrl` | `String` | `/uploads/avatars/...` o externa |
| `location` | `String` | maxlength 80 |
| `website` | `String` | maxlength 200 |

### Subdocument `socials`

```ts
{
  twitter?: string
  instagram?: string
  behance?: string
  artstation?: string
  tiktok?: string
}
```

### Preferencias

| Campo | Tipo | Default | Enum |
|---|---|---|---|
| `theme` | `String` | `'dark'` | `dark`, `light`, `system` |
| `locale` | `String` | `'es'` | `es`, `en` |

### `notificationSettings`

```ts
{
  likes: boolean         // true
  comments: boolean      // true
  follows: boolean       // true
  saves: boolean         // true
  weeklyDigest: boolean  // false
}
```

### `privacySettings`

```ts
{
  profilePublic: boolean   // true
  showEmail: boolean       // false
  allowMessages: boolean   // true
  allowFollow: boolean     // true
}
```

### Plan

| Campo | Tipo | Default | Enum |
|---|---|---|---|
| `plan` | `String` | `'free'` | `free`, `pro` |

### Relaciones sociales

| Campo | Tipo |
|---|---|
| `following` | `ObjectId[]` ref `User` |
| `followers` | `ObjectId[]` ref `User` |

Bidireccional manual: follow actualiza ambos arrays. Ver
[`../api/users.md`](../api/users.md).

### Seguridad / sesión

| Campo | Tipo | Default | Notas |
|---|---|---|---|
| `tokenVersion` | `Number` | `0` | Rota en password/email/sessions/deactivate/delete. Ver [ADR-0001](../adr/0001-jwt-tokenversion.md) |
| `status` | `String` | `'active'` | `active`, `deactivated`, `deleted` |
| `lastLoginAt` | `Date \| null` | `null` | Actualizado por `authorize()` en cada login |

### Reglas implícitas

- `status === 'deleted'` ⇒ login bloqueado (chequeo en `auth.ts` y `requireUser`).
- `status === 'deactivated'` + login válido ⇒ reactivación automática a `active`.
- `passwordHash` solo se carga con `.select('+passwordHash')`.

---

## `Artwork`

`src/backend/models/Artwork.ts`. Obra registrada.

| Campo | Tipo | Notas |
|---|---|---|
| `title` | `String` | required, maxlength 150 |
| `artistId` | `ObjectId` ref `User` | required, **FK** |
| `imageUrl` | `String` | required |
| `thumbnailUrl` | `String` | |
| `uploadDate` | `Date` | default now |
| `creationDate` | `{ type, value }` | discriminator: `exact`, `year`, `monthyear`, `range`, `approx` |
| `category` | `String` | `pintura`, `escultura`, `ilustracion`, `fotografia`, `otro` |
| `discipline` | `String` | |
| `technique` | `String` | |
| `medium` | `String` | |
| `materials` | `String` | |
| `dimensions` | `String` | |
| `tags` | `String[]` | |
| `visibility` | `String` | `public`, `private`, `unlisted` |
| `likedBy` | `ObjectId[]` ref `User` | |
| `viewedBy` | `ObjectId[]` ref `User` | |
| `savedBy` | `ObjectId[]` ref `User` | |

**Índices:** `{ artistId: 1, visibility: 1 }`, `{ uploadDate: -1 }`.

**Cascada delete usuario:** `Artwork.deleteMany({ artistId: userId })`.

---

## `Collection`

`src/backend/models/Collection.ts`.

| Campo | Tipo | Notas |
|---|---|---|
| `name` | `String` | required |
| `owner` | `ObjectId` ref `User` | required, FK |
| `description` | `String` | |
| `coverArtworkId` | `ObjectId` ref `Artwork` | |
| `isPublic` | `Boolean` | |
| `artworks` | `ObjectId[]` ref `Artwork` | |

**Índice:** `{ owner: 1 }`.

**Cascada delete:** `Collection.deleteMany({ owner: userId })`.

---

## `Notification`

`src/backend/models/Notification.ts`.

| Campo | Tipo | Notas |
|---|---|---|
| `recipientId` | `ObjectId` ref `User` | quién recibe |
| `actorId` | `ObjectId` ref `User` | quién la dispara |
| `type` | `String` | `like`, `comment`, `follow`, `save`... |
| `entityId` | `ObjectId` | recurso afectado |
| `read` | `Boolean` | default false |

**Cascada delete:** `Notification.deleteMany({ $or: [{ recipientId }, { actorId }] })`.

---

## `CarnivalProject`

`src/backend/models/workspaces/carnaval/CarnivalProject.ts`. Expediente de acreditación.

| Campo | Tipo | Notas |
|---|---|---|
| `title` | `String` | required |
| `description` | `String` | |
| `owner` | `ObjectId` ref `User` | required, **FK** |
| `kind` | `String` | Enum: `disfraz`, `comparsa`, `carroza`, etc. |
| `editionYear` | `Number` | |
| `planos` | `ObjectId[]` ref `Board` | Referencias a los lienzos reglamentarios |

---

## `CarnivalProjectVersion`

`src/backend/models/workspaces/carnaval/CarnivalProjectVersion.ts`. Snapshots inmutables.

| Campo | Tipo | Notas |
|---|---|---|
| `projectId` | `ObjectId` ref `CarnivalProject` | required, **FK** |
| `owner` | `ObjectId` ref `User` | required, **FK** |
| `version` | `Number` | Autoincremental por proyecto |
| `commitMessage`| `String` | |
| `objectCount` | `Number` | **Performance**: Evita parsear `planos` completos al listar |
| `planos` | `Array` | Clon profundo del estado de los Boards en JSON |

---

## `Board`

`src/backend/models/Board.ts`. Lienzo de trabajo (Konva) infinito.

| Campo | Tipo | Notas |
|---|---|---|
| `title` | `String` | required |
| `owner` | `ObjectId` ref `User` | required, **FK** |
| `workspace` | `Object` | `{ type: 'libre' \| 'carnaval', view: string }` |
| `objects` | `Array` | Nodos gráficos Konva (JSON) |
| `background` | `String` | Color o textura |
| `metadata` | `Object` | Extensible (ej. `carnaval` con dims, warnings) |

---

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD

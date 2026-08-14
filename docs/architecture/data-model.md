---
title: Data model
audience: backend
status: stable
updated: 2026-08-14
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
| `avatarUrl` | `String` | URL de Vercel Blob en prod, `/uploads/avatars/...` en fallback local (ver [ADR-0021](../adr/0021-vercel-blob-image-storage.md)), o externa |
| `location` | `String` | maxlength 80, **default `"Pasto, Nariño"`** (no documentado antes) |
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

> ⚠️ **Reescrito por completo 2026-08-14** — la versión anterior de esta
> tabla tenía 3 campos con **tipo equivocado** (`materials`/`dimensions`
> documentados como `String`, siendo objeto/array) y un campo `discipline`
> que **no existe** en el schema real, además de faltarle ~15 campos
> reales. Verificado leyendo `Artwork.ts` completo, no por nombre.

| Campo | Tipo | Notas |
|---|---|---|
| `title` | `String` | required, maxlength 150 |
| `artistId` | `ObjectId` ref `User` | required, **FK** |
| `imageUrl` | `String` | required |
| `uploadDate` | `Date` | default now |
| `creationDate` | `{ type, value, certainty? }` | `type`: `exact`\|`year`\|`monthyear`\|`range`\|`approx`. `certainty`: `confirmed`\|`estimated`\|`desconocida` |
| `artistProvidedDateText` | `String` | texto libre alternativo a `creationDate` |
| `description` | `String` | default `""`, maxlength 2000 |
| `category` | `String` | `pintura`\|`escultura`\|`ilustracion`\|`fotografia`\|`otro`, default `otro`. **No existe `discipline`** — corregido, se documentaba antes por error. |
| `medium` | `String` | |
| `technique` | `String` | |
| `materials` | `String[]` | **array**, no string — corregido |
| `dimensions` | `{ width?, height?, depth?: Number, unit?: 'cm'\|'in'\|'px'\|'mm' }` | **objeto**, no string — corregido |
| `edition` | `{ type: 'unique'\|'limited'\|'series', number?, total?: Number }` | no documentado antes |
| `signature` | `Boolean` | default `false`, no documentado antes |
| `signatureLocation` | `String` | no documentado antes |
| `provenance` | `String` | no documentado antes |
| `visibility` | `String` | `public`\|`unlisted`\|`private`, default `public` |
| `altText` | `String` | no documentado antes |
| `licenseRights` | `{ copyrightHolder?, licenseType?: 'all-rights-reserved'\|'cc-by'\|'cc-by-nc', licenseUrl? }` | no documentado antes |
| `tags` | `String[]` | lowercase, trim |
| `fileMeta` | `{ filename?, mimeType?, sizeBytes?, width?, height? }` | ⚠️ en `createArtwork()` hoy es **relleno falso**: `filename` autogenerado, `mimeType` hardcodeado a `image/jpeg`, `sizeBytes` es `Math.random()` — no viene del archivo real. No confiar en este campo para nada real todavía. |
| `thumbnails` | `{ small?, medium?, large? }` | **no `thumbnailUrl`** (corregido) — y hoy los 3 tamaños son alias del mismo `imageUrl`, no hay generación de thumbnail real |
| `likes` | `Number` | default `0`, no documentado antes |
| `likedBy` | `ObjectId[]` ref `User` | |
| `views` | `Number` | default `0`, no documentado antes |
| `viewedBy` | `ObjectId[]` ref `User` | |
| `savedBy` | `ObjectId[]` ref `User` | |
| `comments` | `[{ userId, userName, userAvatar, text, createdAt }]` | **array embebido en el propio documento** — no existe colección `Comment` separada. No documentado antes en absoluto. |

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
| `isPrivate` | `Boolean` | default `false` — **no** `isPublic`, verificado 2026-08-14 contra `Collection.ts`. Antes documentado al revés. |
| `artworks` | `ObjectId[]` ref `Artwork` | IDs, no documentos poblados |
| `references` | `IReference[]` | `{ imageUrl, caption, addedAt }`. **No estaba documentado** — detectado por `npm run docs:verify` el 2026-08-14. Imágenes de referencia sueltas de la colección, distintas de `artworks`. |

> **`coverArtworkId` no existe.** Se documentaba como campo del modelo hasta
> 2026-08-14; no está ni en la interfaz ni en el schema. Si se necesita una
> portada, hay que añadirla — no asumir que ya está.

**Índice:** `{ owner: 1 }`.

**Cascada delete:** `Collection.deleteMany({ owner: userId })`.

---

## `Notification`

`src/backend/models/Notification.ts`.

| Campo | Tipo | Notas |
|---|---|---|
| `recipientId` | `ObjectId` ref `User` | quién recibe |
| `actorId` | `ObjectId` ref `User` | quién la dispara |
| `artworkId` | `ObjectId` ref `Artwork` | **no `entityId`** — corregido 2026-08-14, ese campo no existe |
| `type` | `String` | `like`\|`comment`\|`follow`\|`save`, enum cerrado (verificado, no hay más valores) |
| `message` | `String` | opcional, no documentado antes |
| `read` | `Boolean` | default `false` |

**Cascada delete:** `Notification.deleteMany({ $or: [{ recipientId }, { actorId }] })`.

---

## `CarnivalProject`

`src/backend/models/workspaces/carnaval/CarnivalProject.ts`.

> ⚠️ **Reescrito 2026-08-14** — casi ningún campo coincidía con lo
> documentado antes (`title`→`name`, `editionYear`→`year`, `kind` tenía la
> lista de valores de `modality`, `description`/`planos` no existen). El
> comentario del propio archivo aclara algo no documentado en ningún lado:
> este modelo es en realidad genérico ("Project"), la colección se llama
> `carnivalprojects` solo por compatibilidad histórica, y **también lo usa
> el Workspace Libre** (`kind: 'libre'`) — no es exclusivo de Carnaval pese
> al nombre del archivo/colección.

| Campo | Tipo | Notas |
|---|---|---|
| `kind` | `String` | `'libre'` \| `'carnaval'`, default `'carnaval'` — determina si es un proyecto Libre o de acreditación |
| `name` | `String` | required, maxlength 80, default `"Proyecto sin título"` |
| `modality` | `String` | solo si `kind==='carnaval'`: `disfraz`\|`comparsa`\|`carroAlegorico`\|`carroza` |
| `year` | `Number` | default `2027` |
| `accreditationStatus` | `String` | `draft`\|`review`\|`ready`, default `draft` — no documentado antes |
| `owner` | `ObjectId` ref `User` | required, **FK** |

**No tiene campo `planos`.** La relación es al revés de lo documentado
antes: cada `Board` apunta a su proyecto vía `Board.projectId`, el proyecto
no mantiene un array de referencias.

---

## `CarnivalProjectVersion`

`src/backend/models/workspaces/carnaval/CarnivalProjectVersion.ts`. Snapshots inmutables.

> ⚠️ **Reescrito 2026-08-14** — `version` (Number autoincremental) y
> `commitMessage` **no existen**; `objectCount` no es un campo top-level.

| Campo | Tipo | Notas |
|---|---|---|
| `projectId` | `ObjectId` ref `CarnivalProject` | required, **FK** |
| `owner` | `ObjectId` ref `User` | required, **FK** |
| `label` | `String` | maxlength 80, default `"Versión"` — texto libre, **no** un número autoincremental |
| `isFinal` | `Boolean` | default `false` — marca la versión enviada a jurados (`markFinal()`). No documentado antes. |
| `planos` | `[{ view, name, background, objects, objectCount? }]` | array de sub-documentos, uno por plano — `objectCount` vive **dentro de cada plano**, no a nivel de versión |

---

## `Board`

`src/backend/models/Board.ts`. Lienzo de trabajo (Konva) infinito.

> ⚠️ **Reescrito 2026-08-14** — el campo se llama `name`, no `title`;
> `workspace.type` es en realidad `workspace.kind` con valores `free`\|
> `carnaval` (no `libre`\|`carnaval`); `background` es un objeto, no un
> string; **`metadata` no existe**; y faltaban 5 campos reales completos.

| Campo | Tipo | Notas |
|---|---|---|
| `name` | `String` | required, maxlength 80, default `"Board sin título"` — **no `title`** |
| `owner` | `ObjectId` ref `User` | required, **FK** |
| `isPrivate` | `Boolean` | default `false`, no documentado antes |
| `lateralMirrorEnabled` | `Boolean` | default `false` — el "modo espejo" entre planos laterales (feature reciente, ver `boards.service.ts:syncCarnavalLateralMirror` y [`../contributing/testing.md`](../contributing/testing.md) — sus tests están rotos a fecha 2026-08-14). No documentado antes en absoluto. |
| `background` | `{ type: 'grid'\|'dots'\|'plain', squareCm, color, opacity }` | **objeto**, no string — corregido |
| `objects` | `IBoardObject[]` | `{ id, type, x, y, w, h, rotation, z, ...específicos }`. Sub-schema `strict:false` — permite campos extra por `type` sin migración |
| `viewport` | `{ x, y, zoom }` | no documentado antes |
| `workspace` | `{ kind: 'free'\|'carnaval', modality?, view? }` | **`kind`, no `type`**; valores `free`\|`carnaval`, no `libre`\|`carnaval`. `modality`/`view` (7 vistas: frontal/posterior/lateralIzq/lateralDer/superior/bastidores/jugadores) no documentados antes |
| `projectId` | `ObjectId` ref `CarnivalProject` | FK real hacia el proyecto — no documentado antes, y es la relación inversa de lo que decía este doc |
| `thumbnailUrl` | `String` | default `""`, no documentado antes |

---

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Verificado: los 7 modelos (`User`, `Artwork`, `Collection`, `Notification`,
  `Board`, `CarnivalProject`, `CarnivalProjectVersion`) leídos completos,
  campo por campo, no por nombre. `Artwork`, `Board`, `CarnivalProject` y
  `CarnivalProjectVersion` tenían discrepancias serias (tipos equivocados,
  campos fabricados, campos reales faltantes) — ver avisos ⚠️ en cada
  sección.

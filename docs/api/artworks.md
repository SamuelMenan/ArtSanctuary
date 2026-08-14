---
title: API /api/artworks
audience: backend
status: stable
updated: 2026-08-14
owner: TBD
---

# API `/api/artworks`

CRUD de obras + búsqueda + interacciones (like / save / comment).

Todas las rutas usan `withErrorHandler`/`apiError` — corregido 2026-08-14,
la afirmación anterior de "legacy, sin apiError estructurado" ya no era
cierta.

## Resumen

| Método | Ruta | Auth | Propósito |
|---|---|---|---|
| GET | `/api/artworks` | público | List paginado |
| POST | `/api/artworks` | requerida | Crear obra |
| GET | `/api/artworks/[id]` | público (con cookie anti-doble-vista) | Detalle |
| PUT | `/api/artworks/[id]` | requerida (owner) | Editar metadata — **no** `PATCH`, corregido |
| DELETE | `/api/artworks/[id]` | requerida (owner) | Eliminar |
| POST | `/api/artworks/[id]/interact` | requerida | like / save / **comment** |
| GET | `/api/artworks/search` | público | Búsqueda + filtros |

---

## GET `/api/artworks`

List paginado de obras públicas (`getPublicGallery`).

**Query params reales** (corregido — antes decía `discipline`, `offset`/`cursor`, ninguno existe):
- `page` (default 1), `limit` (default 20, máx. 50)
- `category`

**Response:** `{ artworks: [...], pagination: { page, limit, total, pages } }`.

---

## POST `/api/artworks`

Crear obra. Body típicamente recibe `imageUrl` ya subida vía `/api/upload`.
Sin allowlist — el body pasa completo a `createArtwork()`, que solo exige
`title`/`imageUrl` y toma el resto tal cual del modelo real (ver
[`../architecture/data-model.md#artwork`](../architecture/data-model.md#artwork),
reescrito 2026-08-14 — `materials` es array, `dimensions` es objeto, no
existe `discipline` ni `thumbnailUrl`).

**Body (campos aceptados, no obligatorios salvo los 2 primeros):**

```ts
{
  title: string
  imageUrl: string
  description?: string
  category?: string          // default 'otro'
  medium?: string
  technique?: string
  materials?: string[]       // array, no string
  dimensions?: { width?, height?, depth?: number, unit?: 'cm'|'in'|'px'|'mm' }
  edition?: { type: 'unique'|'limited'|'series', number?, total?: number }
  signature?: boolean
  signatureLocation?: string
  provenance?: string
  visibility?: 'public' | 'unlisted' | 'private'   // default 'public'
  altText?: string
  licenseRights?: { copyrightHolder?, licenseType?, licenseUrl? }
  tags?: string[]
  creationDate?: { type, value, certainty? }
  artistProvidedDateText?: string
}
```

**Side effects:** `createArtwork()` genera `fileMeta`/`thumbnails` con
**datos de relleno** (no reales — ver nota en `data-model.md`), no del
archivo subido.

---

## GET `/api/artworks/[id]`

Detalle de obra. Incluye populate de `artistId`.

**Response:** el objeto artwork **directo**, sin envolver — corregido
(antes decía `{ artwork: {...} }`).

**Side effects:** cookie `viewed_{id}` (httpOnly, 24h) para no contar vistas
repetidas del mismo anónimo; el incremento real de `views`/`viewedBy` ocurre
dentro de `getArtworkForView()` (`artworks.service.ts`), no verificado línea
a línea en esta pasada.

---

## PUT `/api/artworks/[id]`

Editar metadata. Owner-only, chequeado dentro de `updateArtwork()`
(`result.status === 'forbidden'` → 403), no antes en la ruta.

**Body:** allowlist explícita vía `pickEditableArtworkFields()` (en el
propio `route.ts`, arreglado 2026-08-14) — solo `title`, `description`,
`category`, `medium`, `technique`, `materials`, `dimensions`, `edition`,
`signature`, `signatureLocation`, `provenance`, `visibility`, `altText`,
`licenseRights`, `tags`, `creationDate`, `artistProvidedDateText`. Body
vacío tras filtrar → `apiError('VALIDATION_ERROR', 'Nada que actualizar')`.

> Antes de esta fecha la ruta pasaba el body completo sin filtrar a
> `updateArtwork()`, que solo bloqueaba `_id`/`artistId`/`uploadDate`/
> `views`/`likes` — dejando `likedBy`/`savedBy`/`viewedBy`/`comments`
> abiertos a sobreescritura por el propio owner vía `PUT`. Ver
> [`../ops/security.md`](../ops/security.md).

---

## DELETE `/api/artworks/[id]`

Eliminar. Mismo patrón de owner-check vía `deleteArtwork()`. No verificado
en esta pasada si limpia `Collection.artworks` — la afirmación anterior de
este doc sobre eso no se reconfirmó, tratar como no verificado hasta
comprobar `deleteArtwork()` directamente.

---

## POST `/api/artworks/[id]/interact`

**Corregido 2026-08-14** — el body real y las acciones no coincidían con lo
documentado antes:

```ts
{ action: string, text?: string }   // text solo para comentar
```

Respuesta según `result.kind` (no hay un enum cerrado de `action` validado
explícito antes de llamar al servicio — cualquier `action` no reconocida
cae en `apiError('VALIDATION_ERROR', 'Acción no válida')`):

| `result.kind` | Respuesta |
|---|---|
| `like` | `{ success: true, liked, likes }` |
| `save` | `{ success: true, saved: true, savedCount }` |
| `unsave` | `{ success: true, saved: false, savedCount }` |
| `comment` | `{ success: true, comment }` — **acción no documentada antes en absoluto** |
| `comment-empty` | `apiError('VALIDATION_ERROR', 'Texto vacío')` |
| `notfound` | `apiError('NOT_FOUND', ...)` |

**Side effects (`like`):** `Artwork.likedBy.$addToSet` + `Notification{type:'like'}` si no es el propio owner.
**Side effects (`save`):** `Artwork.savedBy.$addToSet` + `Notification{type:'save'}` si no es el propio owner — este es el **único** lugar real donde se crea la notificación `save` (no en `/api/collections/[id]/artworks`, ver [`collections.md`](collections.md)).
**Side effects (`comment`):** empuja a `Artwork.comments[]` (embebido, ver `data-model.md`) + `Notification{type:'comment'}` si no es el propio owner.

---

## GET `/api/artworks/search`

Búsqueda full-text + filtros (`searchArtworks`).

**Query params reales** (corregido — antes decía `tag` singular):
- `q` — texto libre
- `page`, `limit` (mismo default/máx. que `GET /api/artworks`)
- `category`, `medium`, `technique`, `tags`

**Response:** `{ artworks: [...], pagination: { page, limit, total, pages } }` — misma forma que `GET /api/artworks`, corregido (antes decía sin paginación).

---

## Consumers

- `src/app/gallery/page.tsx` — GET list.
- `src/app/explore/page.tsx` — search.
- `src/app/upload/page.tsx` → `/api/upload` → POST artwork.
- `src/app/profile/page.tsx`, `/profile/[id]/page.tsx` — usan `Artwork.find` directo
  (server component, no llaman endpoint).
- `src/frontend/shared/ui/ArtworkModal.tsx` — interact.

## Pendiente

- `fileMeta`/`thumbnails` con datos reales (hoy son relleno, ver `data-model.md`).
- Verificar si `DELETE` limpia `Collection.artworks` — no reconfirmado en esta pasada.
- Confirmar consumidores exactos (`Consumers` arriba no reverificado 2026-08-14, puede tener rutas obsoletas).

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Verificado: los 4 `route.ts` de `artworks/` leídos completos + `createArtwork()`/`interactWithArtwork` (parcial) del servicio. `Consumers` y el detalle interno de `deleteArtwork()`/`getArtworkForView()` no releídos.

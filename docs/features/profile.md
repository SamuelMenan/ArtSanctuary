---
title: Feature — Profile
audience: all
status: stable
updated: 2026-08-13
owner: TBD
---

# Feature — Profile

Dos páginas comparten estructura visual:

| Página | Path | Audiencia |
|---|---|---|
| Perfil propio | `/profile` | Usuario autenticado, su propia info |
| Perfil público | `/profile/[id]` | Cualquier visitante (anónimo o logueado) |

Ambos usan los mismos componentes de `src/frontend/features/profile/`. Diferencias son la
fuente de datos y los CTAs.

## Anatomy

```
ProfileHero          ← header compacto: avatar + name + chips + metrics + actions
ProfileMetaBlock     ← bio (pull quote) + dl (location/website/memberSince) + socials
ArtworkSectionHeader ← eyebrow + título + count grande
ArtworkGrid | EmptyPortfolio
```

## Componentes (`src/frontend/features/profile/`)

| Componente | Tipo | Propósito |
|---|---|---|
| `ProfileHero` | server | Header compuesto. Top bar + identity + metrics + actions slot |
| `ProfileMetaBlock` | server | Bio blockquote + dl editorial + socials |
| `ArtworkSectionHeader` | server | Título + count |
| `EmptyPortfolio` | server | Empty state con marcos rotados |
| `SocialLinks` | server | Chips para redes sociales no vacías |
| `FollowStats` | client | Botones contador → abren modal. Variants `inline` / `cells` |
| `FollowListModal` | client | Modal accesible: carga al abrir, escape, click-fuera, skeleton |

## Datos

### Perfil propio (`/profile`)

```ts
const session = await auth()                         // requireUser equivalente
const dbUser = await User.findById(session.user.id)
  .select('username displayName bio avatarUrl location website socials plan followers following privacySettings createdAt')
  .lean()
const userArtworks = await Artwork.find({ artistId: dbUser._id })
  .sort({ uploadDate: -1 })
  .lean()
```

`isOwner = true` siempre. CTAs: **Subir obra** + **Editar perfil**.

### Perfil público (`/profile/[id]`)

```ts
const user = await User.findById(id).lean()
if (!user) return notFound()

const isOwner = session?.user?.id === userId
const isFollowing = user.followers?.includes(session.user.id)
const isMutual = isFollowing && user.following?.includes(session.user.id)

const profilePublic = user.privacySettings?.profilePublic ?? true
const showEmail = user.privacySettings?.showEmail ?? false
```

### Gating de privacidad

```
profilePublic = false  AND  !isOwner   →  Renderiza tarjeta "Perfil privado"
                                          NO carga artworks ni meta
showEmail     = false  AND  !isOwner   →  Oculta email en header
allowFollow   = false  AND  !isOwner   →  Modal lista responde 403 "Lista privada"
```

## CTAs

| Caso | Acciones |
|---|---|
| Owner | Subir obra (primary) + Editar perfil (ghost) |
| Visitante autenticado, no es follower | FollowButton "Seguir" |
| Visitante autenticado, ya follower | FollowButton "Siguiendo" |
| Visitante anónimo | FollowButton → alert para iniciar sesión |

## Metric cards

`ProfileHero` integra 3 métricas en grid (works / followers / following). Layout:

```
─────────────────────────────────────────────────────
  AVATAR  Esteban Pérez       │  12    │  340   │  87
   80px   @estebanperez       │ Obras  │Seguid. │Sigue
          [FREE] [Te sigue]   │        │        │
          [Editar] [Subir]    │        │        │
─────────────────────────────────────────────────────
```

- `Works` es display-only.
- `Followers` y `Following` son `<button>` → abren `FollowListModal`.
- Divisores `divide-x` a 1px reemplazan gaps.

## FollowStats variants

```ts
<FollowStats userId={u} followersCount={f} followingCount={g} layout="cells" />
// → renderiza solo los 2 botones tipo metric card. Inserts dentro de grid del hero.

<FollowStats userId={u} followersCount={f} followingCount={g} layout="inline" />
// → renderiza inline "N Seguidores  M Seguidos" estilo numérico
```

## FollowListModal

Endpoints:
- `GET /api/users/[id]/followers`
- `GET /api/users/[id]/following`

Respeta `privacySettings.allowFollow` — 403 si no owner.

UX:
- Carga al abrir (no preload).
- Skeleton 4 filas durante fetch.
- Empty state localizado.
- Error state ("Lista privada" si 403).
- Escape + click-fuera + botón ✕ → cierra.
- Click en item → navega a `/profile/[id]` + cierra modal.
- `aria-modal`, `role=dialog`, focus inicial en close button, scroll lock.

## ProfileMetaBlock

Layout `[1fr_auto]` con `divide-x`:

| Bloque izquierdo | Bloque derecho |
|---|---|
| Bio como `<blockquote>` con border-l-2 primary | dl compacto: location, website (link `noopener noreferrer`), memberSince, socials |

Si todos los campos están vacíos → componente no renderiza nada.

## EmptyPortfolio

Composición:
- 3 marcos rotados solapados (uno primary on top, dos grises atrás).
- Patrón diagonal hatch 45° de fondo (CSS `repeating-linear-gradient`).
- Copy editorial + CTA "Subir primera obra" (solo si `ownerView`).

## Diseño responsive

| Breakpoint | Hero | Meta block | Empty |
|---|---|---|---|
| Mobile | Avatar+identity stack vertical; métricas bajo en 3 cols | dl 2 cols | 1 col |
| Desktop | Identity izquierda + metric panel `w-[360px]` derecha | dl 1 col al lado de bio | 2 cols |

## Endpoints relacionados

- `GET /api/users/[id]` — perfil público + obras del artista
- `GET /api/users/[id]/followers` — lista
- `GET /api/users/[id]/following` — lista
- `POST/DELETE /api/users/[id]/follow` — toggle follow

Ver [`../api/users.md`](../api/users.md).

## i18n

Claves bajo `profile.*` en `src/shared/i18n/`. Strings nuevos en Fase 3 de
implementación: `bio`, `location`, `website`, `socials`, `followers`, `following`,
`privateProfile`, `noFollowers`, `noFollowing`, `memberSince`, etc.

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD

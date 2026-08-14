---
title: "Feature: Home, Explore, Gallery, Collections"
audience: frontend
status: stable
updated: 2026-08-14
owner: TBD
---

# Feature: pantallas centrales de navegación

4 pantallas core que antes no tenían ningún doc de feature — solo aparecían
como rutas en `architecture/routing.md`. Todas son Server Components salvo
Explore, que necesita interactividad de búsqueda.

## Home (`/`)

`src/frontend/features/home/screens/HomeScreen.tsx` — **una sola página con
dos vistas**, no dos rutas:

- **Sesión activa** → `DashboardHome`: feed de obras de gente que sigues
  (`getFollowingFeed()`, servicio `artworks.service.ts`), hidratado con
  `getUserById()`.
- **Sin sesión** → `PublicHome`: landing pública (no leído en detalle en
  esta pasada).

RSC puro — llama servicios directo, sin HTTP interno (patrón de
[`../architecture/services.md`](../architecture/services.md)).

## Gallery (`/gallery`)

`src/frontend/features/gallery/screens/GalleryScreen.tsx` — RSC. Filtro de
categoría vía `searchParams` (`?category=pintura`, etc.), no estado
cliente. `getGalleryArtworks(category)` (`artworks.service.ts`).

## Explore (`/explore`)

`src/frontend/features/explore/screens/ExploreScreen.tsx` — **el único de
los 4 que es Client Component** (`'use client'`), porque necesita
búsqueda/filtros interactivos sincronizados con la URL
(`useSearchParams`). A diferencia de Home/Gallery, **sí** hace `fetch` a
endpoints propios en vez de llamar servicios directo — es la excepción a la
regla RSC-primero, justificada porque la búsqueda es client-driven:

- `GET /api/explore/trending` — categorías + tags trending + recientes, al montar.
- `GET /api/artworks/search?...` — búsqueda con query/categoría/medium/technique/tags.

Soporta abrir un artwork directo por URL (`?artworkId=...`) vía `ArtworkModal`.

## Collections detail (`/collections/[id]`)

`src/frontend/features/collections/screens/CollectionDetailScreen.tsx` —
RSC. `getCollectionById()`. Gating: si `collection.isPrivate` y el viewer
no es el owner → mensaje "colección privada" en vez de `notFound()` (distinto
de un 404 — la colección existe, solo no es visible). Ver
[`../api/collections.md`](../api/collections.md) para el contrato completo
(incluye una corrección de campo hecha 2026-08-14: es `isPrivate`, no
`isPublic`).

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Verificado: los 4 archivos de screen leídos (Explore completo vía grep de
  sus llamadas `fetch`; Home/Gallery/Collections primeras ~50 líneas,
  suficiente para confirmar servicio consumido y patrón RSC — no leídos
  completos).

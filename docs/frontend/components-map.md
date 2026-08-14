---
title: Components map
audience: frontend
status: stable
updated: 2026-08-13
owner: TBD
---

# Components map

> ⚠️ Rutas reescritas a la estructura vigente (`src/frontend/`) y verificadas
> archivo por archivo vía MCP el 2026-08-13. `Badge.tsx` (antes en `ui/`) ya
> no se encontró en el código — probablemente eliminado o renombrado; no
> asumir que existe. Conteo original ("31 archivos") no reverificado en esta
> pasada.

Inventario de `src/frontend/`.

## Layout (`src/frontend/shared/layouts/`)

| Componente | Tipo | Usado en | Notas |
|---|---|---|---|
| `AppShell.tsx` | server | Casi todas las páginas | Contenedor + nav + sidebar |
| `Navbar.tsx` | client | AppShell | Top nav, user menu, notif |
| `Sidebar.tsx` | client | AppShell (desktop) | Menú lateral, colecciones |
| `ChromeProvider.tsx` | client | AppShell | No estaba en el inventario original — confirmar propósito |

## Providers (`src/frontend/shared/providers/`)

| Componente | Tipo | Notas |
|---|---|---|
| `Providers.tsx` | client | NextAuth `<SessionProvider>` + AppPreferencesProvider |
| `AppPreferencesProvider.tsx` | client | Context: theme / locale / `t` / `resolvedTheme`. Ver [`theming.md`](theming.md) |
| `CollectionsProvider.tsx` | client | No estaba en el inventario original — confirmar propósito |

## UI (`src/frontend/shared/ui/`)

| Componente | Tipo | Endpoint(s) | Notas |
|---|---|---|---|
| `ArtworkGrid.tsx` | client | — | Grid masonry-like de obras + modal integrado |
| `ArtworkModal.tsx` | client | `/api/artworks/[id]/interact`, `/api/artworks/[id]` | Detalle + comentarios + like/save |
| `ArtworkLightbox.tsx` | client | — | No estaba en el inventario original — confirmar propósito |
| `Button.tsx` | server | — | Botón con variants |
| `CollectionActions.tsx` | client | `/api/collections/[id]` | CRUD botones |
| `FollowButton.tsx` | client | `/api/users/[id]/follow` | Toggle follow optimista |
| `PanelSection.tsx`, `Select.tsx`, `Spinner.tsx` | — | — | No estaban en el inventario original — confirmar propósito |
| `SaveToCollectionModal.tsx` | client | `/api/collections/[id]/artworks` | Modal "Guardar en colección" |
| `UploadButton.tsx` | client | `/upload` | CTA navegación |

## Settings (`src/frontend/features/settings/`)

| Componente | Tipo | Endpoint | Notas |
|---|---|---|---|
| `useStatus.ts` | hook | — | idle/loading/success/error, auto-reset 3.5s |
| `StatusBanner.tsx` | client | — | Banner accesible `role=alert\|status` |
| `Toggle.tsx` | client | — | Switch `role=switch` |
| `AvatarUploader.tsx` | client | `POST/DELETE /api/settings/avatar` | Preview + upload + delete |
| `ProfileForm.tsx` | client | `PATCH /api/settings/profile` | Diff dirty + validación |
| `AccountForm.tsx` | client | `PATCH /api/settings/account/{email,password}`, `DELETE .../sessions` | Email + password + logout-all |
| `AppearanceForm.tsx` | client | `usePreferences()` → `/api/preferences` | Theme + locale |
| `NotificationsForm.tsx` | client | `PATCH /api/settings/notifications` | 5 toggles |
| `PrivacyForm.tsx` | client | `PATCH /api/settings/privacy` | 4 toggles |
| `DangerZone.tsx` | client | `POST .../deactivate`, `DELETE /api/settings/account` | Deactivate + delete con confirm |

## Profile (`src/frontend/features/profile/`)

| Componente | Tipo | Endpoint | Notas |
|---|---|---|---|
| `ProfileHero.tsx` | server | — | Header compuesto con avatar+identity+metrics |
| `ProfileMetaBlock.tsx` | server | — | Bio + dl + socials |
| `ArtworkSectionHeader.tsx` | server | — | Eyebrow + título + count |
| `EmptyPortfolio.tsx` | server | — | Empty state composición |
| `SocialLinks.tsx` | server | — | Chips de redes filtrados |
| `FollowStats.tsx` | client | `/api/users/[id]/{followers,following}` | Botones contador + modal |
| `FollowListModal.tsx` | client | idem | Modal accesible con skeleton |

## Workspaces (`src/frontend/features/workspaces/`, `src/frontend/features/tools/boards/extensions/`)

Verificado componente por componente vía `search_code`/`Glob` el 2026-08-13
— rutas exactas, no solo el paquete contenedor.

| Componente | Ruta | Tipo | Endpoint | Notas |
|---|---|---|---|---|
| `WorkspacesScreen.tsx` | `workspaces/shared/screens/` | client | `/api/carnaval-projects` | Selección Libre vs Carnaval |
| `WorkspaceProjectScreen.tsx` | `workspaces/carnaval/screens/` | client | `/api/carnaval-projects/[id]` | Dashboard base del proyecto |
| `ExpedienteScreen.tsx` | `workspaces/carnaval/screens/` | client | `/api/carnaval-projects/[id]/versions`| Historial y versión final |
| `RecursosCulturalesScreen.tsx` | `workspaces/carnaval/screens/` | client | — | Biblioteca de normativas |
| `Host.tsx` | `tools/boards/extensions/` | client | — | Inyector de plugins sobre Board base |
| `CarnavalLayers.tsx` | `workspaces/carnaval/board/` | client | — | Grilla reglamentaria + referencias |
| `CarnavalInspector.tsx` | `workspaces/carnaval/board/` | client | — | Panel lateral de warnings en vivo |
| `CarnavalOverlays.tsx` | `workspaces/carnaval/board/` | client | — | Líneas de cota automáticas on-canvas |

Todas las rutas de la columna "Ruta" son relativas a
`src/frontend/features/`.

## Tools (`src/frontend/features/tools/`)

| Componente | Tipo | Notas |
|---|---|---|
| `ToolActiveLayout.tsx` | server | Wrapper para `/dashboard/tools/*` |

## Otros / artwork / auth / gallery

Verificar `src/frontend/features/artwork/`, `.../auth/`, `.../gallery/` si
contienen archivos adicionales — no reverificado en esta pasada.

## Convenciones

- **Client component** marcado con `'use client'` en línea 1.
- **Server component** sin directiva, puede ser `async`.
- Props tipados con `interface Props { ... }` justo antes del export.
- Hooks separados en archivos `useX.ts` (no `.tsx`).
- Archivos `.ts` solo para hooks/types/utilidades sin JSX.
- Componentes agrupados por **dominio funcional**, no por tipo (`profile/`,
  `settings/`, no `forms/`, `modals/`).

## Reglas RSC

| Patrón | OK / NO |
|---|---|
| Server component pasa `t` a client | OK — `t` es función pura serializable |
| Server pasa objeto Mongoose | NO — usar `.lean()` + `JSON.parse(JSON.stringify(...))` o mapear |
| Server importa client | OK |
| Client importa server | NO — fuerza el server a quedar como client wrapper |
| Server async + DB query | OK |
| Client + DB query | NO — usar endpoint y `fetch` |

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD
- `settings/`, `profile/`, `layout/`, `ui/`, `providers/` y `workspaces/`
  verificados archivo por archivo vía `list_directory`/`search_code` del
  MCP. `tools/` (fuera de `boards/extensions/Host.tsx`) no reverificado en
  profundidad.

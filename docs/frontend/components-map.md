---
title: Components map
audience: frontend
status: stable
updated: 2026-08-14
owner: TBD
---

# Components map

> ⚠️ Rutas reescritas a la estructura vigente (`src/frontend/`), verificadas
> archivo por archivo. `Badge.tsx` (antes en `ui/`) ya no se encontró en el
> código — probablemente eliminado o renombrado; no asumir que existe.
> Conteo original ("31 archivos") no reverificado.
>
> **2026-08-14 — segunda pasada, esta vez verificando "Tipo" (client/server)
> y "Endpoint" contra el código, no solo las rutas de archivo.** Encontrados
> y corregidos 5 componentes con Tipo equivocado (`AppShell`, `ArtworkGrid`,
> `Host`, `ToolActiveLayout`, `CarnavalInspector`) y 1 endpoint atribuido al
> componente que no hace el fetch (`FollowStats`). Añadidas ~30 rutas/
> archivos que existían y no estaban inventariados (`artwork-modal/`,
> `settings/account/` + `settings/profile/`, `navbar/`+`appbar/`,
> `tools/shared/workspace/`). No se verificó cada componente uno por uno —
> spot-check dirigido a las columnas Tipo/Endpoint, que es donde aparecieron
> los bugs en los modelos de datos.

Inventario de `src/frontend/`.

## Layout (`src/frontend/shared/layouts/`)

| Componente | Tipo | Usado en | Notas |
|---|---|---|---|
| `AppShell.tsx` | **client** | Casi todas las páginas | Corregido 2026-08-14 — tiene `'use client'`, doc anterior decía server. Contenedor + nav + sidebar |
| `Navbar.tsx` | client | AppShell | Top nav, user menu, notif |
| `Sidebar.tsx` | client | AppShell (desktop) | Menú lateral, colecciones |
| `ChromeProvider.tsx` | client | AppShell | Provider de estado del chrome (nav/sidebar) |

**Subcarpetas no inventariadas antes** (`navbar/`, `appbar/`), todas
`'use client'`: `navbar/NotificationsMenu.tsx`, `navbar/ProfileMenu.tsx`,
`navbar/MobileMenu.tsx`, `navbar/useNotifications.ts` (hook — el polling de
30s que `NOTIFICATIONS_REALTIME_PLAN.md` quiere eliminar),
`appbar/AppBarButton.tsx`.

## Providers (`src/frontend/shared/providers/`)

| Componente | Tipo | Notas |
|---|---|---|
| `Providers.tsx` | client | NextAuth `<SessionProvider>` + AppPreferencesProvider |
| `AppPreferencesProvider.tsx` | client | Context: theme / locale / `t` / `resolvedTheme`. Ver [`theming.md`](theming.md) |
| `CollectionsProvider.tsx` | client | Caché compartida de `/api/collections` — antes cada consumidor (Sidebar, ImageSourceModal, SaveToCollectionModal) la pedía por separado en cada montaje; ahora se pide una vez y `refresh()` la invalida |

## UI (`src/frontend/shared/ui/`)

| Componente | Tipo | Endpoint(s) | Notas |
|---|---|---|---|
| `ArtworkGrid.tsx` | **server** | — | Corregido 2026-08-14 — sin `'use client'`, doc anterior decía client. Grid masonry-like de obras + modal integrado |
| `ArtworkModal.tsx` | client | `/api/artworks/[id]/interact`, `/api/artworks/[id]` | Ya no es un solo archivo — composición sobre `artwork-modal/` (ver abajo) |
| `ArtworkLightbox.tsx` | **server** | — | Corregido 2026-08-14 por `docs:verify`. Visor a pantalla completa, usado por `ArtworkGrid` |
| `Button.tsx` | server | — | Botón con variants |
| `CollectionActions.tsx` | client | `/api/collections/[id]` | CRUD botones |
| `FollowButton.tsx` | client | `/api/users/[id]/follow` | Toggle follow optimista |
| `PanelSection.tsx`, `Select.tsx` | client | — | Confirmado `'use client'` — controles genéricos de panel/select |
| `Spinner.tsx` | server | — | Sin `'use client'` — spinner puramente visual |
| `SaveToCollectionModal.tsx` | client | `/api/collections/[id]/artworks` | Modal "Guardar en colección" |
| `UploadButton.tsx` | client | `/upload` | CTA navegación |

**`artwork-modal/` — no inventariado antes**, todos `'use client'`:
`ArtworkComments.tsx`, `ArtworkMedia.tsx`, `ArtworkMeta.tsx`,
`ArtworkActions.tsx`, `useArtwork.ts` (hook). `ArtworkModal.tsx` compone
estas piezas — no es un componente monolítico como sugería el inventario
anterior.

## Settings (`src/frontend/features/settings/`)

| Componente | Tipo | Endpoint | Notas |
|---|---|---|---|
| `useStatus.ts` | hook | — | idle/loading/success/error, auto-reset 3.5s |
| `StatusBanner.tsx` | client | — | Banner accesible `role=alert\|status` |
| `Toggle.tsx` | client | — | Switch `role=switch` |
| `AvatarUploader.tsx` | client | `POST/DELETE /api/settings/avatar` | Preview + upload + delete |
| `ProfileForm.tsx` | client | `PATCH /api/settings/profile` | Diff dirty + validación |
| `AccountForm.tsx` | **server** | `PATCH /api/settings/account/{email,password}`, `DELETE .../sessions` | Corregido 2026-08-14 por `docs:verify`: es un composer sin `'use client'`; las 4 secciones que agrupa (`account/*Section.tsx`) sí son client |
| `AppearanceForm.tsx` | client | `usePreferences()` → `/api/preferences` | Theme + locale |
| `NotificationsForm.tsx` | client | `PATCH /api/settings/notifications` | 5 toggles |
| `PrivacyForm.tsx` | client | `PATCH /api/settings/privacy` | 4 toggles |
| `DangerZone.tsx` | client | `POST .../deactivate`, `DELETE /api/settings/account` | Deactivate + delete con confirm |

**Subcarpetas no inventariadas antes** (`account/`, `profile/`), todas
`'use client'`: `account/AccountInfoSection.tsx`, `account/EmailSection.tsx`,
`account/PasswordSection.tsx`, `account/SessionsSection.tsx` (`AccountForm`
compone estas 4, igual que pasó con `ArtworkModal`), `profile/SocialsFieldset.tsx`,
`profile/useProfileForm.ts` (hook). `profile/Field.tsx` y `profile/profileLogic.ts`
sin `'use client'` (server / lógica pura respectivamente).

## Profile (`src/frontend/features/profile/`)

| Componente | Tipo | Endpoint | Notas |
|---|---|---|---|
| `ProfileHero.tsx` | server | — | Header compuesto con avatar+identity+metrics |
| `ProfileMetaBlock.tsx` | server | — | Bio + dl + socials |
| `ArtworkSectionHeader.tsx` | server | — | Eyebrow + título + count |
| `EmptyPortfolio.tsx` | server | — | Empty state composición |
| `SocialLinks.tsx` | server | — | Chips de redes filtrados |
| `FollowStats.tsx` | client | — | Corregido 2026-08-14 — no hace `fetch` propio, solo recibe conteos por props y abre el modal. El endpoint real está en `FollowListModal` |
| `FollowListModal.tsx` | client | `GET /api/users/[id]/{followers,following}` | Modal accesible con skeleton |

## Workspaces (`src/frontend/features/workspaces/`, `src/frontend/features/tools/boards/extensions/`)

Verificado componente por componente vía `search_code`/`Glob` el 2026-08-13
— rutas exactas, no solo el paquete contenedor.

| Componente | Ruta | Tipo | Endpoint | Notas |
|---|---|---|---|---|
| `WorkspacesScreen.tsx` | `workspaces/shared/screens/` | client | `/api/carnaval-projects` | Selección Libre vs Carnaval |
| `WorkspaceProjectScreen.tsx` | `workspaces/carnaval/screens/` | client | `/api/carnaval-projects/[id]` | Dashboard base del proyecto |
| `ExpedienteScreen.tsx` | `workspaces/carnaval/screens/` | client | `/api/carnaval-projects/[id]/versions`| Historial y versión final |
| `RecursosCulturalesScreen.tsx` | `workspaces/carnaval/screens/` | client | — | Biblioteca de normativas |
| `Host.tsx` | `tools/boards/extensions/` | **server** | — | Corregido 2026-08-14 — sin `'use client'`, doc anterior decía client. Glue que resuelve slots opcionales de extensión |
| `CarnavalLayers.tsx` | `workspaces/carnaval/board/` | client | — | Grilla reglamentaria + referencias |
| `CarnavalInspector.tsx` | `workspaces/carnaval/board/` | **server** | — | Corregido 2026-08-14 — sin `'use client'`, doc anterior decía client. Panel lateral de warnings en vivo |
| `CarnavalOverlays.tsx` | `workspaces/carnaval/board/` | client | — | Líneas de cota automáticas on-canvas |
| `CarnavalWorkspaceActions.tsx` | `workspaces/carnaval/board/` | client | — | No inventariado antes |
| `context.tsx` | `workspaces/carnaval/board/` | client | — | Context de estado del board Carnaval, no inventariado antes |

Todas las rutas de la columna "Ruta" son relativas a
`src/frontend/features/`.

## Tools (`src/frontend/features/tools/`)

| Componente | Tipo | Notas |
|---|---|---|
| `ToolActiveLayout.tsx` | **client** | Corregido 2026-08-14 — tiene `'use client'`, doc anterior decía server. Wrapper para `/dashboard/tools/*` |

**`tools/shared/workspace/` — no inventariado antes** (14 archivos,
todos `'use client'`): `ToolWorkspace.tsx`, `ToolStage.tsx`, `ToolPanel.tsx`,
`ToolCluster.tsx`, `ToolButton.tsx`, `ToolSelect.tsx`, `ToolSlider.tsx`,
`EmptyState.tsx`, `HistoryButtons.tsx`, `MeasureBar.tsx`, `SendActions.tsx`,
`SourceButton.tsx`, más `ImageSourceModal.tsx` (usado por Crop/Grid/Notan)
y `useImageCompression.ts` (hook). Es el kit compartido de UI que usan las
herramientas de imagen — no tenía entrada en este mapa pese a ser
transversal a Boards/Grid/Crop/Canon.

## Otros / artwork / auth / gallery / explore / home / collections

Resuelto 2026-08-14 — estas features sí tienen componentes reales y ya
tienen su propio doc, no listados aquí en detalle para no duplicar:

- `features/auth/` (`AuthFlow`, `LoginForm`, `RegisterForm`, `PasswordField`, `PasswordStrength`, `FormField`, `AuthAside`, `validation.ts`) → [`../features/auth-ui.md`](../features/auth-ui.md).
- `features/artwork/` (`ArtworkForm.tsx`, `UploadDropzone.tsx`, `useUploadArtwork.ts`, `UploadScreen.tsx`) → [`../features/upload.md`](../features/upload.md).
- `features/home/`, `features/explore/`, `features/gallery/`, `features/collections/` (1 screen cada uno) → [`../features/navigation-screens.md`](../features/navigation-screens.md).

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

- Fecha: 2026-08-14
- Commit: HEAD
- `settings/`, `profile/`, `layout/`, `ui/`, `providers/`, `workspaces/` y
  `tools/shared/` verificados archivo por archivo vía `list_directory`/
  `search_code`/`Grep` del MCP, incluyendo Tipo (`'use client'`) y Endpoint
  para las filas con esas columnas. No verificado prop por prop —
  eso sigue pendiente si se necesita ese nivel de detalle.

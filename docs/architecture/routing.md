---
title: App Router map
audience: all
status: stable
updated: 2026-08-13
owner: TBD
---

# App Router map

Inventario de rutas Next.js App Router bajo `src/app/`. Ver
[`estructura-optimizada.md`](estructura-optimizada.md) para las reglas de capa.

## Páginas (`src/app/**/page.tsx`)

| Ruta | Auth | Notas |
|---|---|---|
| `/` | público | Landing + feed para autenticados |
| `/login` | guest | Form credentials |
| `/register` | guest | `POST /api/auth/register` |
| `/gallery` | público | Grid global de obras |
| `/explore` | público | Búsqueda + filtros |
| `/upload` | requerida | Form de subida de obra |
| `/profile` | requerida | Perfil propio |
| `/profile/[id]` | público | Perfil de cualquier usuario |
| `/settings` | requerida | 6 secciones de ajustes |
| `/collections/[id]` | público | Detalle de colección |
| `/dashboard/tools` | requerida | Índice herramientas |
| `/dashboard/tools/canon` | requerida | Proporciones |
| `/dashboard/tools/cuadricula` | requerida | Grid overlay |
| `/dashboard/tools/gesture` | requerida | Gesture timer |
| `/dashboard/tools/mezcla` | requerida | Mezcla de color |
| `/dashboard/tools/notan` | requerida | Notan / posterize |
| `/dashboard/tools/papel-milimetrado` | requerida | Graph paper |
| `/dashboard/workspaces` | requerida | Selección de proyectos Libre/Carnaval |
| `/dashboard/workspaces/[id]` | requerida | Entorno del tablero / canvas |
| `/dashboard/workspaces/[id]/expediente` | requerida | Resumen y snapshot Carnaval |
| `/dashboard/workspaces/[id]/recursos` | requerida | Biblioteca Cultural Carnaval |

`src/app/layout.tsx` es el root layout con `<Providers>` (NextAuth +
AppPreferencesProvider).

## API (`src/app/api/**/route.ts`)

34 archivos `route.ts` (un método puede exportar más de un handler). Detalle por dominio:

### Auth (`/api/auth/*`)

| Método | Ruta | Notas |
|---|---|---|
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handlers (signIn, signOut, csrf, callback) |
| POST | `/api/auth/register` | Registro custom |

### Settings (`/api/settings/*`)

9 `route.ts` / 10 métodos. Ver [`../api/settings.md`](../api/settings.md) —
incluye aviso sobre 2 endpoints documentados que no se encontraron en el código.

### Users (`/api/users/*`)

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/users/[username]` | Perfil público + obras (param es ID) |
| POST/DELETE | `/api/users/[username]/follow` | Toggle follow |
| GET | `/api/users/[username]/followers` | Lista seguidores |
| GET | `/api/users/[username]/following` | Lista seguidos |

Ver [`../api/users.md`](../api/users.md).

### Artworks (`/api/artworks/*`)

| Método | Ruta | Notas |
|---|---|---|
| GET/POST | `/api/artworks` | List / create |
| GET/PATCH/DELETE | `/api/artworks/[id]` | CRUD individual |
| POST | `/api/artworks/[id]/interact` | Like / save / view |
| GET | `/api/artworks/search` | Búsqueda |

Ver [`../api/artworks.md`](../api/artworks.md).

### Collections (`/api/collections/*`)

| Método | Ruta | Notas |
|---|---|---|
| GET/POST | `/api/collections` | List / create |
| GET/PATCH/DELETE | `/api/collections/[id]` | CRUD |
| POST/DELETE | `/api/collections/[id]/artworks` | Añadir / quitar obra |

Ver [`../api/collections.md`](../api/collections.md).

### Notifications (`/api/notifications/*`)

| Método | Ruta | Notas |
|---|---|---|
| GET | `/api/notifications` | List del usuario actual |
| POST | `/api/notifications/[id]/read` | Marcar leída |
| POST | `/api/notifications/read-all` | Marcar todas |

Ver [`../api/notifications.md`](../api/notifications.md).

### Workspaces & Carnaval (`/api/carnaval-projects/*`, `/api/boards/*`)

| Método | Ruta | Notas |
|---|---|---|
| GET/POST | `/api/carnaval-projects` | List / create proyectos |
| GET/PATCH/DELETE | `/api/carnaval-projects/[id]` | CRUD proyecto |
| GET/POST | `/api/carnaval-projects/[id]/versions` | Historial / crear snapshot |
| GET | `/api/carnaval-projects/[id]/versions/[vid]` | Ver snapshot inmutable |
| GET/POST | `/api/boards` | Tableros individuales |
| GET/PATCH/DELETE | `/api/boards/[id]` | CRUD tablero |

Ver [`../api/carnaval-projects.md`](../api/carnaval-projects.md).

### Otros

| Método | Ruta | Notas |
|---|---|---|
| PATCH | `/api/preferences` | Theme/locale. Único endpoint de preferencias existente hoy — `/api/settings/preferences` no está implementado |
| POST | `/api/upload` | Upload de obra (no avatar) |
| GET | `/api/explore/trending` | Trending feed |

## Layout / loading / error

- `src/app/layout.tsx` — root layout único.
- Sin `loading.tsx` / `error.tsx` global. Páginas sensibles añadir por feature.

## Convenciones

- **Página**: `page.tsx` server component default. Async OK.
- **Layout**: `layout.tsx` para wrap persistente entre routes hijas.
- **Dynamic segments**: `[id]`, `[username]`.
- **Route handlers**: `route.ts`, exporta `GET/POST/PATCH/DELETE` funciones.
- **runtime**: default Node. Solo `/api/settings/avatar` declara explícito
  `export const runtime = 'nodejs'` (usa `fs/promises`).

## Naming

- `/profile/[id]` no `/users/[id]` — feature visible al usuario.
- `/dashboard/tools/*` no `/tools/*` — agrupa bajo "dashboard" personal.
- `/api/users/[username]/*` — segmento nombrado `username` pero recibe ID.
  Mantener por compatibilidad con FollowButton existente. Ver
  [`../api/users.md`](../api/users.md#naming-quirk).

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD
- Endpoints API: 34 archivos `route.ts`, verificado con `list_directory` del
  MCP sobre `src/app/api/`
- Páginas: sin re-verificar en esta pasada, número previo (21) no confirmado

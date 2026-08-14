---
title: ArtSanctuary — Documentación técnica
audience: all
status: stable
updated: 2026-08-13
owner: TBD
---

# ArtSanctuary — Documentación técnica

> Plataforma social artística. Prototipo. Pasto, Nariño, Colombia.

## Stack real

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| UI | React | 19.x |
| Lenguaje | TypeScript | 5.x |
| Auth | NextAuth.js (Auth.js) | 5.x beta |
| ORM | Mongoose | 9.x |
| DB | MongoDB | Atlas / local |
| Estilos | Tailwind CSS | 4.x (CSS-first config) |
| Hash | bcryptjs | 3.x |

## Índice

### Arquitectura
- [`architecture/estructura-optimizada.md`](architecture/estructura-optimizada.md) — **estructura de carpetas vigente** (`src/app`, `src/backend`, `src/frontend`, `src/shared`). Leer primero.
- [`architecture/overview.md`](architecture/overview.md) — capas y flujo de request. ⚠️ Rutas de archivo desactualizadas (pre-refactor a `src/`) — el contenido conceptual sigue siendo válido.
- [`architecture/data-model.md`](architecture/data-model.md) — modelos Mongoose. ⚠️ Mismo aviso de rutas.
- [`architecture/auth.md`](architecture/auth.md) — NextAuth JWT, `tokenVersion`, logout-all. ⚠️ Mismo aviso de rutas.
- [`architecture/routing.md`](architecture/routing.md) — mapa App Router. ⚠️ Mismo aviso de rutas.
- [`architecture/auditoria-estructura.md`](architecture/auditoria-estructura.md) — auditoría de higiene del repo (2026-06-02).

**Diagramas (Mermaid, `architecture/diagramas/`)** — verificados y vigentes,
el mejor material de onboarding visual del repo:
- [`c4-contexto-sistema.md`](architecture/diagramas/c4-contexto-sistema.md) — C4 nivel 1, contexto del sistema.
- [`c4-contenedores.md`](architecture/diagramas/c4-contenedores.md) — C4 nivel 2, contenedores.
- [`arquitectura-macro.md`](architecture/diagramas/arquitectura-macro.md) — capas del sistema, vista de 10,000 pies.
- [`entidad-relacion-bd.md`](architecture/diagramas/entidad-relacion-bd.md) — ERD de MongoDB/Mongoose.
- [`diagrama-de-clases-dominio.md`](architecture/diagramas/diagrama-de-clases-dominio.md) — modelos de dominio y servicios.
- [`flujo-datos-rsc.md`](architecture/diagramas/flujo-datos-rsc.md) — RSC vs. mutaciones del cliente.
- [`flujo-handoff-herramientas.md`](architecture/diagramas/flujo-handoff-herramientas.md) — handoff entre herramientas de estudio.
- [`maquina-estados-auth.md`](architecture/diagramas/maquina-estados-auth.md) — ciclo de vida de sesión/usuario.
- [`jerarquia-board-editor.md`](architecture/diagramas/jerarquia-board-editor.md) — jerarquía y estado de `BoardEditor`.
- [`limites-dependencias-arquitectura.md`](architecture/diagramas/limites-dependencias-arquitectura.md) — qué capa puede importar qué.

### API
- [`api/conventions.md`](api/conventions.md) — `apiError`/`apiOk`, validators, helpers.
- [`api/settings.md`](api/settings.md) — `/api/settings/*` (9 route.ts / 10 métodos).
- [`api/users.md`](api/users.md) — follow, followers, following, perfil público.
- [`api/artworks.md`](api/artworks.md) — obras y búsqueda.
- [`api/collections.md`](api/collections.md) — colecciones.
- [`api/notifications.md`](api/notifications.md) — notificaciones.
- [`api/carnaval-projects.md`](api/carnaval-projects.md) — proyectos, planos y versiones del Carnaval.

### Frontend
- [`frontend/components-map.md`](frontend/components-map.md) — inventario.
- [`frontend/design-system.md`](frontend/design-system.md) — tokens, tipografía.
- [`frontend/animations.md`](frontend/animations.md) — animación con `motion` (norma + patrones).
- [`frontend/i18n.md`](frontend/i18n.md) — `createTranslator`, claves.
- [`frontend/theming.md`](frontend/theming.md) — dark/light/system.
- [`frontend/accessibility.md`](frontend/accessibility.md) — patrones a11y.

### Features
- [`features/profile.md`](features/profile.md) — perfil propio y público.
- [`features/settings.md`](features/settings.md) — 6 secciones de ajustes.
- [`features/follow.md`](features/follow.md) — seguir + listas.
- [`features/upload.md`](features/upload.md) — subida de obras.
- **Workspaces**:
  - [`features/workspaces/libre.md`](features/workspaces/libre.md) — espacios creativos estándar.
  - [`features/workspaces/carnaval.md`](features/workspaces/carnaval.md) — módulo de acreditación Corpocarnaval (Fases 1-11).
- **Herramientas de Estudio**:
  - [`features/tools/boards.md`](features/tools/boards.md) — tableros infinitos Konva.
  - [`features/tools/grid.md`](features/tools/grid.md) — cuadrícula de referencia.
  - [`features/tools/crop.md`](features/tools/crop.md) — recorte y extracción.
  - [`features/tools/escala-medicion.md`](features/tools/escala-medicion.md) — escala global de medidas.
  - ~~[`features/tools/artist-microtools.md`](features/tools/artist-microtools.md)~~ (obsoleto).
- **Propuestas futuras, no implementadas** (sin código correspondiente, verificado 2026-08-13):
  - [`features/tools/pencil-geometric.md`](features/tools/pencil-geometric.md) — lápiz con reconocimiento geométrico asistido.
  - [`features/tools/pencil-magnetic.md`](features/tools/pencil-magnetic.md) — lápiz magnético a bordes de imagen.
  - [`features/tools/pencil-polyline.md`](features/tools/pencil-polyline.md) — modo pluma / polilíneas punto a punto.

### Operaciones
- [`ops/env.md`](ops/env.md) — variables de entorno.
- [`ops/deployment.md`](ops/deployment.md) — despliegue.
- [`ops/security.md`](ops/security.md) — amenazas.

### Rendimiento
- [`performance/01-optimizacion-servidor-rsc.md`](performance/01-optimizacion-servidor-rsc.md)
- [`performance/02-estrategia-carga-cliente.md`](performance/02-estrategia-carga-cliente.md)
- [`performance/03-optimizacion-diccionarios-i18n.md`](performance/03-optimizacion-diccionarios-i18n.md)

### ADRs
Decisiones 0001-0022, más `_template.md`. Todas tienen frontmatter
(`status`/`supersedes`) desde 2026-08-13 — 0005-0015 son narrativas de
resolución de bugs, más largas que el resto, pero ya con metadata estándar.

- [`adr/0001-jwt-tokenversion.md`](adr/0001-jwt-tokenversion.md)
- [`adr/0002-local-avatar-uploads.md`](adr/0002-local-avatar-uploads.md) — `superseded` por 0021.
- [`adr/0003-system-theme-resolution.md`](adr/0003-system-theme-resolution.md)
- [`adr/0004-hard-delete-sin-tx.md`](adr/0004-hard-delete-sin-tx.md)
- [`adr/0005-konva-grid-snap-resize.md`](adr/0005-konva-grid-snap-resize.md)
- [`adr/0006-vercel-blob-konva-transformer.md`](adr/0006-vercel-blob-konva-transformer.md)
- [`adr/0007-server-components-data-fetching.md`](adr/0007-server-components-data-fetching.md)
- [`adr/0008-client-bundle-konva-lazy-loading.md`](adr/0008-client-bundle-konva-lazy-loading.md)
- [`adr/0009-i18n-server-dictionaries.md`](adr/0009-i18n-server-dictionaries.md)
- [`adr/0010-canon-muscle-mapping-strategy.md`](adr/0010-canon-muscle-mapping-strategy.md)
- [`adr/0011-tailwind-v4-text-utility-collision.md`](adr/0011-tailwind-v4-text-utility-collision.md)
- [`adr/0012-canon-purity-and-scaling.md`](adr/0012-canon-purity-and-scaling.md)
- [`adr/0013-canon-vector-vs-raster.md`](adr/0013-canon-vector-vs-raster.md)
- [`adr/0014-appbar-shared-styles.md`](adr/0014-appbar-shared-styles.md)
- [`adr/0015-motion-tokens-single-source.md`](adr/0015-motion-tokens-single-source.md)
- [`adr/0016-client-side-image-processing.md`](adr/0016-client-side-image-processing.md)
- [`adr/0017-mongoose-lean-rsc-serialization.md`](adr/0017-mongoose-lean-rsc-serialization.md)
- [`adr/0018-zero-global-state-libraries.md`](adr/0018-zero-global-state-libraries.md)
- [`adr/0019-native-form-data-react-19.md`](adr/0019-native-form-data-react-19.md)
- [`adr/0020-canon-frontal-asymmetry-zindex.md`](adr/0020-canon-frontal-asymmetry-zindex.md)
- [`adr/0021-vercel-blob-image-storage.md`](adr/0021-vercel-blob-image-storage.md) — supersede a 0002.
- [`adr/0022-docs-agents-tracked-in-git.md`](adr/0022-docs-agents-tracked-in-git.md) — `docs/`+`.agents/` en git.
- [`adr/_template.md`](adr/_template.md) — plantilla.

### Contribuir
- [`contributing/setup.md`](contributing/setup.md)
- [`contributing/conventions.md`](contributing/conventions.md)
- [`contributing/testing.md`](contributing/testing.md) — qué corre `npm test`, qué está cubierto y qué no.
- [`contributing/changelog.md`](contributing/changelog.md)

### Negocio
No técnico — ignorar para tareas de código.
- [`business/contexto.md`](business/contexto.md) — contexto y modelo de negocio.
- [`business/ArtSanctuaryCarnavalSuite.md`](business/ArtSanctuaryCarnavalSuite.md) — visión del producto Carnaval.
- [`business/comunicados/`](business/comunicados/) — comunicados oficiales de Corpocarnaval (movido desde `comunicado_full/` el 2026-08-13).

### Otros
- [`glossary.md`](glossary.md)
- [`helps/`](helps/) — prompts de generación de imagen para las láminas de Canon. No técnico — ignorar para tareas de código.

## Onboarding rápido (5 min)

```bash
git clone <repo>
cd ArtSanctuary
npm install
cp .env.example .env.local   # MONGODB_URI, AUTH_SECRET
npm run seed                 # opcional
npm run dev                  # http://localhost:3000
```

## MCP

Servidor MCP en `mcp/` (v3.0.0) expone tools genéricos de exploración/edición
sobre el repo: `list_directory`, `read_file`, `get_outline`, `search_code`,
`replace_in_file`, `write_file`. Ver `mcp/README.md` para el detalle de cada
una.

Para navegación rápida por un agente IA, ver también
[`INDEX.md`](INDEX.md) (router acotado a ADRs, frontend, ops, performance y
planes activos).

## Estado documentación

| Estado | Significado |
|---|---|
| `stable` | Vigente y actual. |
| `wip` | Borrador. |
| `deprecated` | No usar. |

Cada doc lleva frontmatter con `status`, `updated`, `owner`.

## Histórico

Documentación inicial reescrita y reestructurada (2026-05-18). Archivos antiguos:

- `backend_y_database.md` → migrado a `architecture/data-model.md` + `api/*`
- `frontend_react_tailwind.md` → migrado a `frontend/components-map.md`
- `obsidian_gallery_design.md` → consolidado en `frontend/design-system.md`
- `DESIGN.md` → consolidado en `frontend/design-system.md`
- `contexto_y_negocio.md` → movido a `business/contexto.md`
- `systems/artist-microtools.md` → movido a `features/tools/artist-microtools.md`
- Scripts de ejecución, output de React Doctor y planes temporales → archivados en `historical/`

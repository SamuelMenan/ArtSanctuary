---
title: Changelog
audience: all
status: stable
updated: 2026-08-14
owner: TBD
---

# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/). Versiones
semantic-ish — prototipo, sin releases formales todavía.

## [Unreleased]

### Added
- Documentación estructurada `docs/` (28 archivos: README hub, architecture,
  api, frontend, features, ops, adr, contributing, glossary).
- 4 ADRs iniciales: jwt-tokenversion, local-avatar-uploads,
  system-theme-resolution, hard-delete-sin-tx.
- MCP server `mcp/` con tools `read_doc`, `list_docs`, `write_doc`,
  `list_components`, `inspect_component`, `inspect_app_routing`,
  `list_api_endpoints`, `inspect_endpoint`, `inspect_data_model`,
  `inspect_seed`, `get_design_tokens`.
- MCP smoke test (`mcp/scripts/smoke.ts`).
- Settings page completa con 6 secciones (profile, account, appearance,
  notifications, privacy, danger zone) — 11 endpoints, 10 client components.
- Avatar upload local con preview + delete.
- Cambio email/password con `tokenVersion` rotation.
- Logout-all endpoint.
- Soft delete (deactivate) + hard delete con cascada.
- Sistema de theme `dark`/`light`/`system` con `matchMedia`.
- Followers/following endpoints + `FollowListModal` accesible.
- Perfil propio + público rediseñados con `ProfileHero` editorial compacto.
- `ProfileMetaBlock`, `EmptyPortfolio`, `SocialLinks`, `FollowStats`.

### Changed
- `models/User.ts` extendido: `website`, `socials`, `notificationSettings`,
  `privacySettings`, `tokenVersion`, `status`, `lastLoginAt`,
  `emailPendingChange`. `theme` enum ahora incluye `system`.
- `auth.ts` valida `tokenVersion` + `status` en cada request.
- `AppPreferencesProvider` resuelve `system` theme vía `matchMedia`.

### Deprecated
- Docs antiguos en raíz (`backend_y_database.md`, `frontend_react_tailwind.md`,
  `obsidian_gallery_design.md`, `DESIGN.md`) marcados para migración. Mantenidos
  hasta migración completa.
- `/api/preferences` legacy — equivalente a `/api/settings/preferences`, ambos
  funcionan.

### Security
- Validación cliente + servidor en endpoints sensibles.
- `bcrypt` salt rounds = 12 estándar.
- Cookie `HttpOnly` + `SameSite=Lax` para JWT.
- `safeResolve` en MCP bloquea path traversal.

### Pendiente

> Revisado 2026-08-14. Las entradas de arriba son el registro de mayo/junio y
> se dejan congeladas (para eso es un changelog); esta sección sí pretendía
> describir el presente y estaba desfasada.

Sigue pendiente:
- Rate-limit en endpoints sensibles (login, register, password change, avatar).
- CSRF middleware explícito.
- Verificación email real (SMTP).
- Cascada delete atómica (requiere replica set).

Ya no pendiente:
- ~~Tests (Vitest + supertest)~~ → hay 19 archivos `*.test.ts` con Vitest (sin
  supertest; no hay tests de API). Ver [`testing.md`](testing.md).
- ~~Migración avatares a Cloudinary/S3~~ → se migró a **Vercel Blob**, no a
  Cloudinary. Ver [ADR-0021](../adr/0021-vercel-blob-image-storage.md).

Correcciones a entradas de arriba, que quedaron desactualizadas por refactors
posteriores (no se reescriben porque son registro histórico):
- `auth.ts` ya no está en la raíz (`src/backend/auth/index.ts`) y **no** valida
  `tokenVersion` en cada request: lo hace con throttle de 5 min.
- `/api/settings/preferences` nunca llegó a existir; el único endpoint de
  preferencias es `/api/preferences`.

Bugs conocidos sin resolver: [`../ops/known-issues.md`](../ops/known-issues.md).

## Historial de commits relevantes

```
205bd6b feat(mcp): expandir endpoints para ui, db, rutas y autodocs correctamente
ec61f29 feat(mcp): expandir endpoints para ui, db, rutas y autodocs
cba7274 feat(mcp): crear servidor Model Context Protocol integrado para acceder a docs
4e5c9d8 feat(app): implementar paginas principales y estilos
c8a08a9 feat(api): construir rutas api de backend
```

(Cambios post-MCP iniciales no reflejados aún en git history — pendiente commit
de la sesión de Settings + Profile + Docs.)

## Convenciones de versionado

Mientras sea prototipo: solo `Unreleased`. Cuando estabilice:

- `MAJOR.MINOR.PATCH`
- `MAJOR` — breaking changes en API o data model.
- `MINOR` — nueva funcionalidad backward-compatible.
- `PATCH` — bug fixes.

## Generación

Cuando crezca, considerar:

```bash
# Generar CHANGELOG desde commits convencionales
npx conventional-changelog -p angular -i CHANGELOG.md -s
```

## Última verificación

- Fecha: 2026-05-18
- Commit: HEAD

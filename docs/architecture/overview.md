---
title: Architecture overview
audience: all
status: stable
updated: 2026-08-13
owner: TBD
---

# Architecture overview

> [!NOTE]
> Para una representación visual moderna de la arquitectura, revisa los archivos dentro de la carpeta **[`diagramas/`](./diagramas/)**. Encontrarás desgloses del Flujo de Datos, ERD de Base de Datos y Arquitectura Macro con sus respectivas explicaciones.

## Capas

```
┌──────────────────────────────────────────────────────────────┐
│                      Cliente (browser)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  React 19 — Server Components + Client Components   │    │
│  │  AppPreferencesProvider (theme / locale)            │    │
│  │  next-auth/react  · fetch('/api/...')               │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTP (cookies, multipart, JSON)
┌──────────────────────▼───────────────────────────────────────┐
│            Next.js 16 (App Router) — Node runtime            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  src/app/**/page.tsx      · Server Components (RSC) │    │
│  │  src/app/api/**/route.ts  · Route Handlers (REST)   │    │
│  │  src/backend/auth/        · NextAuth v5 (JWT)       │    │
│  │  src/backend/auth/requireUser.ts, http/errors.ts    │    │
│  │  src/shared/lib/validation/* · Validators puros TS  │    │
│  │  src/backend/upload/avatar.ts· Blob / FS fallback   │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────┬───────────────────────────────────────┘
                       │ Mongoose
┌──────────────────────▼───────────────────────────────────────┐
│                   MongoDB (Atlas o local)                    │
│  Collections: users · artworks · collections · notifications │
└──────────────────────────────────────────────────────────────┘
```

## Decisiones clave

| Tema | Decisión | Ref |
|---|---|---|
| Auth strategy | NextAuth JWT con `tokenVersion` | [ADR-0001](../adr/0001-jwt-tokenversion.md) |
| Avatares | FS local `public/uploads/avatars/` | [ADR-0002](../adr/0002-local-avatar-uploads.md) |
| Theme `system` | matchMedia cliente | [ADR-0003](../adr/0003-system-theme-resolution.md) |
| Delete cuenta | Cascada secuencial sin tx | [ADR-0004](../adr/0004-hard-delete-sin-tx.md) |
| Validación | Validators puros TS | [`../api/conventions.md`](../api/conventions.md) |
| Estilos | Tailwind 4 CSS-first (no `tailwind.config.ts`) | `src/app/globals.css` |
| i18n | `createTranslator(getDictionary(locale))` | [`../frontend/i18n.md`](../frontend/i18n.md) |

## Flujo de request — ejemplo: PATCH /api/settings/profile

```
[Cliente]
  ProfileForm.tsx → diff state → fetch PATCH /api/settings/profile
                                  body: { displayName?, username?, bio?, ... }

[Servidor]
  src/app/api/settings/profile/route.ts
    1. requireUser()                    → src/backend/auth/requireUser.ts
         ├ auth() (NextAuth)            → valida JWT + tokenVersion
         ├ connectDB()                  → src/backend/db/mongoose.ts (cache singleton)
         └ User.findById(session.user.id)
    2. validateProfile(body)            → src/shared/lib/validation/settings.ts
         └ { ok: true, value } | { ok: false, fields }
    3. (si username cambió) check duplicado
    4. user.<field> = value
    5. await user.save()
    6. apiOk({ profile })               → 200 JSON

[Cliente]
  ProfileForm.tsx
    ├ res.ok           → setStatus('success'), savedInitial = state
    └ !res.ok          → setFieldErrors(error.fields), setStatus('error')
```

## Flujo de auth

```
[Login form] /login
     │
     ▼
signIn('credentials', { email, password })
     │
     ▼
authorize() — src/backend/auth/index.ts
     ├ User.findOne({ email }).select('+passwordHash')
     ├ status === 'deleted'      → throw
     ├ bcrypt.compare()          → throw si mismatch
     ├ status = 'active' (reactivar si deactivated)
     ├ lastLoginAt = new Date()
     └ return { id, name, email, image }
     │
     ▼
jwt callback (primer login)
     ├ token.id = user.id
     └ token.tv = User.findById(id).tokenVersion
     │
     ▼
cookie de sesión firmada (HttpOnly)
     │
     ▼ (cada request autenticado, con throttle de 5 min — ver auth.md)
jwt callback
     ├ User.findById(token.id).select('tokenVersion status')
     ├ status === 'deleted' OR token.tv !== user.tokenVersion → null (sesión expira)
     └ token continúa
```

## Carpetas y responsabilidades

Ver también [`estructura-optimizada.md`](estructura-optimizada.md) para las
reglas por capa (qué puede importar qué).

| Path | Responsabilidad |
|---|---|
| `src/app/<route>/page.tsx` | Server Components (RSC) |
| `src/app/api/**/route.ts` | Route Handlers |
| `src/backend/auth/index.ts` | NextAuth config + callbacks |
| `src/backend/auth/requireUser.ts` | `requireUser({ withPassword })` |
| `src/backend/db/mongoose.ts` | Conexión Mongoose cached |
| `src/backend/http/errors.ts` | `apiError`, `apiOk`, códigos tipados |
| `src/shared/lib/validation/*.ts` | Validators puros TS |
| `src/backend/upload/avatar.ts`, `storage.ts` | Blob save/delete avatar, fallback FS local |
| `src/shared/i18n/*` | Diccionarios + `createTranslator` + `resolveTheme` |
| `src/backend/requestPreferences.ts` | Cookie reader (locale/theme) SSR |
| `src/backend/models/*.ts` | Mongoose schemas |
| `src/frontend/features/<dominio>/*` | UI agrupada por dominio |
| `src/frontend/shared/{layouts,ui,providers}/*` | UI y providers compartidos |
| `mcp/` | MCP server (introspección) |

## Runtime targets

| Tipo | Runtime |
|---|---|
| Server Components | Node |
| Route handlers default | Node |
| `/api/settings/avatar` | Node (`export const runtime = 'nodejs'` — usa `fs/promises`) |

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD

---
title: Feature — Settings
audience: all
status: stable
updated: 2026-08-13
owner: TBD
---

# Feature — Settings

Página `/settings`. Centro de control del usuario: perfil, cuenta, apariencia,
notificaciones, privacidad, danger zone.

## Anatomy

```
/settings  (Server Component — src/app/settings/page.tsx)
  │
  ├── requireUser via auth() + redirect /login si no hay sesión
  ├── User.findById(session.user.id) — hidrata initial data
  │
  ├── <ProfileHero / nav lateral>      (sidebar sticky desktop)
  │
  └── Sections (anclas + scroll-mt-24):
       ├── #profile        → <AvatarUploader /> + <ProfileForm />
       ├── #account        → <AccountForm />
       ├── #appearance     → <AppearanceForm />
       ├── #notifications  → <NotificationsForm />
       ├── #privacy        → <PrivacyForm />
       └── #danger         → <DangerZone />
```

## Componentes (`src/frontend/features/settings/`)

| Componente | Tipo | Endpoint(s) | Notas |
|---|---|---|---|
| `useStatus` | hook | — | Estado `idle\|loading\|success\|error` con auto-reset 3.5s |
| `StatusBanner` | client | — | Banner `role=alert/status` |
| `Toggle` | client | — | Switch `role=switch`, `aria-checked` |
| `AvatarUploader` | client | `POST/DELETE /api/settings/avatar` | Preview blob local, MIME+size cliente, rollback en error |
| `ProfileForm` | client | `PATCH /api/settings/profile` | Diff dirty detection, mapeo `fields` server→input |
| `AccountForm` | client | `PATCH /api/settings/account/{email,password}`, `DELETE .../sessions` | 3 sub-forms + bloque info (createdAt, lastLoginAt). `signOut` auto tras éxito |
| `AppearanceForm` | client | (usa `usePreferences()`, hits `/api/preferences`) | Segmented controls theme + locale |
| `NotificationsForm` | client | `PATCH /api/settings/notifications` | 5 toggles optimistas + rollback |
| `PrivacyForm` | client | `PATCH /api/settings/privacy` | 4 toggles, mismo patrón |
| `DangerZone` | client | `POST .../deactivate`, `DELETE /api/settings/account` | Colapsado por default. Confirm typed `ELIMINAR` |

## Flujos

### Cambio de perfil

1. `ProfileForm` mantiene `state` + `savedInitial`. Diff calculado por `useMemo`.
2. Submit bloqueado si `!changed` o validación cliente falla.
3. PATCH solo envía campos cambiados.
4. Si servidor 409 (username dup) → `setFieldErrors({ username: ... })`.
5. Éxito → `savedInitial = state`, banner `saved`.

### Cambio password / email

1. Form requiere `currentPassword` siempre.
2. Submit → servidor verifica `bcrypt.compare`, valida new value, rota `tokenVersion`.
3. Cliente espera 1.2s + `signOut({ callbackUrl: '/login' })`. Esto porque el token
   actual ya está invalidado por el `tokenVersion++`.

### Logout-all

1. Click → `DELETE /api/settings/account/sessions`.
2. Servidor solo rota `tokenVersion`.
3. Cliente espera 1s + `signOut`.
4. **Cualquier otro dispositivo logueado** será deslogueado en su próximo
   request, sujeto al throttle de 5 min del callback `jwt` en
   `src/backend/auth/index.ts` — no es inmediato en todos los casos. Ver
   [`../architecture/auth.md`](../architecture/auth.md).

### Theme / locale

`AppearanceForm` usa `usePreferences()` del provider, que internamente:

1. Set state local.
2. Aplica DOM (class `dark`/`light` en `<html>`).
3. Escribe cookie + localStorage.
4. Fire-and-forget `PATCH /api/preferences` — único endpoint de
   preferencias que existe hoy (`/api/settings/preferences` no está
   implementado, ver [`../api/settings.md`](../api/settings.md)).

Theme `system` → `matchMedia` listener. Ver [ADR-0003](../adr/0003-system-theme-resolution.md).

### Toggles notificaciones / privacidad

Patrón optimista:

```ts
const next = { ...state, [key]: !state[key] }
setState(next)                          // optimista
const res = await fetch(..., { body: JSON.stringify({ [key]: next[key] }) })
if (!res.ok) setState(state)            // rollback
```

### Deactivate

1. Form colapsado. Click → expande.
2. Pide `currentPassword`. Submit → `POST /api/settings/account/deactivate`.
3. Servidor: `status = 'deactivated'`, `tokenVersion++`.
4. Cliente: `signOut({ callbackUrl: '/login' })`.
5. **Reactivación**: próximo login válido en `src/backend/auth/index.ts` (`authorize`) vuelve a `active`.

### Hard delete

1. Form colapsado. Click → expande.
2. Pide `currentPassword` + typed `ELIMINAR` literal.
3. Submit deshabilitado hasta match.
4. `DELETE /api/settings/account` ejecuta cascada (ver [`../api/settings.md`](../api/settings.md)).
5. Cliente: `signOut({ callbackUrl: '/' })` (no `/login`, ya no hay cuenta).

## Estados UI

Todos los forms exponen 4 estados via `useStatus()`:

| Estado | Visual |
|---|---|
| `idle` | sin banner |
| `loading` | botón disabled + texto "Guardando..." |
| `success` | banner verde, auto-reset 3.5s |
| `error` | banner rojo, `role=alert`, `fields` mapeados a inputs |

## Accesibilidad

- `Toggle`: `role=switch`, `aria-checked`, focus ring visible.
- `StatusBanner`: `role=alert` (error) o `role=status` (success), `aria-live="polite"`.
- Forms: `<label htmlFor>` ligado a cada input.
- DangerZone: confirmación typed + password evita activación accidental.
- Email password fields: `autoComplete="current-password"` / `new-password`.

## i18n

Claves bajo `settings.*` en `src/shared/i18n/` (es + en). Ver
[`../frontend/i18n.md`](../frontend/i18n.md).

## Validación

Cliente + servidor (servidor autoritativo). Mapeo `error.fields` → inputs en cada form.

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD
- Endpoints cubiertos: 9/9 `route.ts` reales (ver aviso en `../api/settings.md`
  sobre 2 endpoints documentados sin implementación encontrada)
- Componentes cubiertos: 10/10

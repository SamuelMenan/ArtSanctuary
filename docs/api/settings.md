---
title: API /api/settings
audience: backend
status: stable
updated: 2026-08-13
owner: TBD
---

# API `/api/settings`

10 endpoints en 9 `route.ts`. Todos requieren sesión vía `requireUser`. Convenciones generales en
[`conventions.md`](conventions.md).

> ⚠️ **Endpoints documentados sin implementación verificada:** `GET /api/settings`
> y `PATCH /api/settings/preferences` no tienen `route.ts` correspondiente en
> `src/app/api/settings/` a fecha 2026-08-13. El snapshot completo de usuario y
> la actualización de theme/locale hoy solo existen como `PATCH /api/preferences`
> (legacy, ver `architecture/routing.md`). Confirmar con el equipo si son
> endpoints planeados y no implementados, o documentación residual de un
> estado anterior — mientras tanto, no asumir que existen.

## Resumen

| Método | Ruta | Propósito | Side effects |
|---|---|---|---|
| PATCH | `/api/settings/profile` | Editar displayName, username, bio, location, website, socials | `user.save()` |
| PATCH | `/api/settings/account/email` | Cambiar email | `tokenVersion++`, `user.save()` |
| PATCH | `/api/settings/account/password` | Cambiar password | `tokenVersion++`, `user.save()` |
| DELETE | `/api/settings/account/sessions` | Logout-all | `tokenVersion++` |
| POST | `/api/settings/account/deactivate` | Soft delete | `tokenVersion++`, `status='deactivated'` |
| DELETE | `/api/settings/account` | Hard delete + cascada | Delete masivo |
| PATCH | `/api/settings/notifications` | Toggles notif | `user.save()` |
| PATCH | `/api/settings/privacy` | Toggles privacy | `user.save()` |
| POST/DELETE | `/api/settings/avatar` | Upload/remove avatar | Blob o FS local (dev) write/unlink, `user.save()` |

---

## PATCH `/api/settings/profile`

Editar perfil público. Acepta cualquier subconjunto de campos (partial update).

**Body:**

```ts
{
  displayName?: string   // max 60
  username?: string      // 3-30, [a-z0-9_]+ ; debe ser único
  bio?: string           // max 300
  location?: string      // max 80
  website?: string       // URL válida
  socials?: {
    twitter?: string     // URL válida o vacío
    instagram?: string
    behance?: string
    artstation?: string
    tiktok?: string
  }
}
```

**Validación:** `validateProfile` en `src/shared/lib/validation/settings.ts`.

**Side effects:** `user.save()`.

**Response 200:** `{ ok: true, profile: { ... } }`.

**Errores:**
- `VALIDATION_ERROR` (400) — campo inválido. `fields` mapea input → mensaje.
- `CONFLICT` (409) — username duplicado.
- `UNAUTHORIZED` (401).

---

## PATCH `/api/settings/account/email`

Cambiar email. Requiere password actual.

> Sin servicio SMTP integrado, el cambio aplica directo. Campo
> `emailPendingChange` reservado para flujo de verificación doble paso.

**Body:**

```ts
{ newEmail: string, currentPassword: string }
```

**Validación:** `validateEmail`. Password validada por `bcrypt.compare`.

**Side effects:**
- `user.email = newEmail`
- `user.tokenVersion += 1`  → invalida sesión
- `user.save()`

**Response 200:** `{ ok: true, email, changed: boolean }`.

**Errores:**
- `VALIDATION_ERROR` (400) — email inválido o sin password.
- `FORBIDDEN` (403) — `currentPassword` incorrecta.
- `CONFLICT` (409) — email en uso.

**Cliente:** tras éxito, esperar 1.2s + `signOut({ callbackUrl: '/login' })` porque
el token ya está invalidado por `tokenVersion++`.

---

## PATCH `/api/settings/account/password`

Cambiar password. Triple verificación: password actual + nueva válida + confirm.

**Body:**

```ts
{ currentPassword: string, newPassword: string, confirmPassword: string }
```

**Validación:** `validatePassword` — mínimo 8, letras + números.

**Side effects:**
- `user.passwordHash = bcrypt.hash(newPassword, 12)`
- `user.tokenVersion += 1`
- `user.save()`

**Response 200:** `{ ok: true, changed: true }`.

**Errores:**
- `VALIDATION_ERROR` (400) — `newPassword` débil o `confirmPassword` no coincide.
- `FORBIDDEN` (403) — `currentPassword` incorrecta.

**Cliente:** `signOut` tras éxito.

---

## DELETE `/api/settings/account/sessions`

Logout-all. Invalida todos los tokens existentes incluyendo el actual.

**Body:** N/A.

**Side effects:** `user.tokenVersion += 1`, `user.save()`.

**Response 200:** `{ ok: true, tokenVersion }`.

**Cliente:** `signOut` inmediatamente.

---

## POST `/api/settings/account/deactivate`

Soft delete. Mantiene datos, marca cuenta como `deactivated`. Reactivación
automática en el próximo login válido.

**Body:** `{ currentPassword: string }`.

**Side effects:**
- `user.status = 'deactivated'`
- `user.tokenVersion += 1`
- `user.save()`

**Response 200:** `{ ok: true, status: 'deactivated' }`.

**Errores:** `VALIDATION_ERROR`, `FORBIDDEN`.

---

## DELETE `/api/settings/account`

Hard delete con cascada. Irreversible.

**Body:**

```ts
{ currentPassword: string, confirm: 'ELIMINAR' }
```

Constante `CONFIRM_WORD = 'ELIMINAR'` literal. Cliente bloquea submit hasta match;
servidor revalida.

**Cascada (orden):**

1. `Artwork.deleteMany({ artistId: userId })`
2. `Collection.deleteMany({ owner: userId })`
3. `Notification.deleteMany({ $or: [{ recipientId }, { actorId }] })`
4. `User.updateMany(..., { $pull: { following: userId, followers: userId } })`
5. `User.deleteOne({ _id: userId })`
6. `deleteAvatarFile(prevAvatar)` (FS)

Sin transacción. Ver [ADR-0004](../adr/0004-hard-delete-sin-tx.md).

**Response 200:** `{ ok: true, deleted: true }`.

**Errores:** `VALIDATION_ERROR` (sin password o confirm ≠ ELIMINAR), `FORBIDDEN`.

---

## PATCH `/api/settings/notifications`

Toggles partial. Acepta cualquier subconjunto de keys.

**Body:**

```ts
{
  likes?: boolean
  comments?: boolean
  follows?: boolean
  saves?: boolean
  weeklyDigest?: boolean
}
```

**Side effects:** merge sobre `user.notificationSettings`, `user.save()`.

**Response 200:** `{ ok: true, notificationSettings: {...} }`.

---

## PATCH `/api/settings/privacy`

Toggles partial.

**Body:**

```ts
{
  profilePublic?: boolean
  showEmail?: boolean
  allowMessages?: boolean
  allowFollow?: boolean
}
```

**Side effects:** merge sobre `user.privacySettings`, `user.save()`.

**Response 200:** `{ ok: true, privacySettings: {...} }`.

---

## POST `/api/settings/avatar`

Upload avatar. Multipart. `runtime = 'nodejs'` (usa `fs/promises`).

**Headers:** `content-type: multipart/form-data`.

**Body:** form field `file` con archivo.

**Validación servidor:**
- MIME ∈ `{ image/jpeg, image/png, image/webp }`.
- Size ≤ 3 MB.

**Side effects:**
- Guarda vía `saveImage()` (`src/backend/upload/storage.ts`): Vercel Blob si
  `NODE_ENV=production` y `BLOB_READ_WRITE_TOKEN` está presente; sin token en
  producción, lanza error (no hay fallback silencioso); fuera de producción,
  escribe a `public/uploads/...`. Ver [`../ops/env.md`](../ops/env.md).
- `user.avatarUrl = <url devuelta por saveImage>`.
- `user.save()`.
- Borra archivo anterior (best-effort).

**Response 200:** `{ ok: true, avatarUrl }`.

**Errores:**
- `UNSUPPORTED_MEDIA_TYPE` (415) — MIME inválido o no multipart.
- `PAYLOAD_TOO_LARGE` (413).
- `VALIDATION_ERROR` (400) — falta field `file`.

Ver [ADR-0002](../adr/0002-local-avatar-uploads.md) — su plan de migración a
Cloudinary no se ejecutó; el proyecto adoptó Vercel Blob en su lugar.

---

## DELETE `/api/settings/avatar`

Elimina avatar actual. Vuelve a estado vacío (cliente muestra inicial).

**Body:** N/A.

**Side effects:** `user.avatarUrl = ''`, `user.save()`, `deleteAvatarFile(prev)`.

**Response 200:** `{ ok: true, avatarUrl: '' }`.

---

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD
- Endpoints: 9 `route.ts` / 10 métodos, verificado con `list_directory` del MCP
  sobre `src/app/api/settings/`. Ver aviso al inicio del doc sobre los 2
  endpoints que no se encontraron en el código.

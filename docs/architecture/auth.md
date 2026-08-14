---
title: Auth & sessions
audience: backend
status: stable
updated: 2026-08-13
owner: TBD
---

# Auth & sessions

NextAuth v5 (Auth.js) con strategy **`jwt`**. Sin tabla de sesiones. Sin Redis.
Invalidación selectiva vía `tokenVersion`, con throttle de 5 min (no en cada
request — ver "Callbacks" abajo). Ver
[ADR-0001](../adr/0001-jwt-tokenversion.md).

## Source

- `src/backend/auth/index.ts` — config + callbacks.
- `src/app/api/auth/[...nextauth]/route.ts` — handler exportado.
- `src/app/api/auth/register/route.ts` — endpoint custom de registro.

## Provider

Solo `Credentials`:

```ts
Credentials({
  name: 'Credenciales',
  credentials: { email, password },
  authorize: async (credentials) => {
    // 1. Validación de presencia
    // 2. await connectDB()
    // 3. User.findOne({ email }).select('+passwordHash')
    // 4. if (status === 'deleted') throw
    // 5. bcrypt.compare(password, passwordHash)
    // 6. Reactivación: if (status === 'deactivated') status = 'active'
    // 7. lastLoginAt = new Date(); await user.save()
    // 8. return { id, name, email, image }
  }
})
```

## Callbacks

### `jwt`

```ts
const TV_RECHECK_MS = 5 * 60 * 1000 // 5 min

async jwt({ token, user, trigger }) {
  if (user) {
    // Primer login
    token.id = user.id
    await connectDB()
    const u = await User.findById(user.id).select('tokenVersion')
    token.tv = u?.tokenVersion ?? 0
    token.tvCheckedAt = Date.now()
  } else if (token.id && trigger !== 'update') {
    // Validación perezosa CON THROTTLE: revalida tokenVersion/status contra
    // DB como máximo cada TV_RECHECK_MS, no en cada request.
    const last = token.tvCheckedAt ?? 0
    if (Date.now() - last > TV_RECHECK_MS) {
      await connectDB()
      const u = await User.findById(token.id).select('tokenVersion status')
      if (!u || u.status === 'deleted' || u.tokenVersion !== token.tv) {
        return null as never                    // sesión expira
      }
      token.tvCheckedAt = Date.now()
    }
  }
  return token
}
```

**Coste:** 1 `findById` ligero como máximo cada 5 minutos por sesión activa,
no por request. Antes (pre-2026-06) sí era 1 `findById` por request; se
cambió a throttle por costo a escala.

**Trade-off de seguridad:** una sesión revocada (cambio de password/email,
logout-all, desactivación, borrado de cuenta) **sigue siendo válida hasta 5
minutos** después de la rotación de `tokenVersion`, no inmediatamente. Ver
[`../ops/security.md`](../ops/security.md) si esto cambia el threat model
para algún endpoint sensible.

**Recovery:** devolver `null` desde `jwt` fuerza re-login. Cliente recibe
`session === null`.

### `session`

```ts
async session({ session, token }) {
  if (session.user && token?.id) {
    session.user.id = token.id as string
  }
  return session
}
```

Sin esto, `session.user.id` sería `undefined` en server components.

## `tokenVersion` rotation

| Endpoint | Razón |
|---|---|
| `PATCH /api/settings/account/email` | Cambio email → sesión sospechosa |
| `PATCH /api/settings/account/password` | Estándar de seguridad |
| `DELETE /api/settings/account/sessions` | Logout-all explícito |
| `POST /api/settings/account/deactivate` | Cuenta inactiva |
| `DELETE /api/settings/account` | Cuenta eliminada |

Patrón:

```ts
r.user.tokenVersion += 1
await r.user.save()
// Cliente debe llamar signOut() tras éxito.
```

## Estados de cuenta

```
┌──────────┐  deactivate   ┌──────────────┐
│  active  ├──────────────▶│ deactivated  │
└────┬─────┘               └──────┬───────┘
     │                            │
     │  next valid login          │
     │◀───────────────────────────┘
     │
     │ delete
     ▼
┌──────────┐
│ deleted  │   (irrecuperable)
└──────────┘
```

- `active` — operación normal.
- `deactivated` — invisible públicamente. Reactiva en login.
- `deleted` — cascada ejecutada. Login rechazado.

## `requireUser` helper

`src/backend/auth/requireUser.ts`:

```ts
export async function requireUser(opts?: { withPassword?: boolean }): Promise<AuthResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, response: apiError('UNAUTHORIZED', 'No autenticado') }
  }
  await connectDB()
  const query = User.findById(session.user.id)
  if (opts?.withPassword) query.select('+passwordHash')
  const user = await query
  if (!user || user.status === 'deleted') {
    return { ok: false, response: apiError('UNAUTHORIZED', 'Sesión inválida') }
  }
  return { ok: true, user }
}
```

Discriminated union fuerza al caller a manejar error.

## Registro

`POST /api/auth/register` (envuelto en `withErrorHandler`) delega en
`registerUser()` de `src/backend/services/auth.service.ts`:

1. Validación campos (`username`, `email`, `password`; password ≥ 8 +
   **mayúscula + número** — política reforzada, no solo longitud. Duplicada
   en el cliente en `src/frontend/features/auth/components/validation.ts`
   con el comentario explícito de mantenerla sincronizada).
2. Check duplicado `{ $or: [{ email }, { username }] }` (dentro del servicio).
3. `bcrypt.hash(password, 12)` (dentro del servicio).
4. `User.create({ username, email, passwordHash, displayName: username })`.
5. `{ user: { id, username, email, plan } }` status 201.

**No inicia sesión auto.** Cliente llama `signIn` después.

## Cookies

| Cookie | Atributos |
|---|---|
| `authjs.session-token` | `HttpOnly`, `SameSite=Lax`, `Secure` en prod |
| `artsanctuary-locale` | set por `AppPreferencesProvider` |
| `artsanctuary-theme` | idem |

Lectura SSR vía `src/backend/requestPreferences.ts`.

## Limitaciones conocidas

- **Sin rate-limit** en `/api/auth/register` ni en endpoints sensibles. Vulnerable
  a bruteforce de `currentPassword`.
- **Sin CSRF tokens** custom (Same-origin + cookie SameSite mitiga).
- **Sin verificación email real**. `emailPendingChange` reservado.
- **Race condition trivial**: rotación `tokenVersion` no es atómica con request
  paralelo. Aceptable.

Pendiente: rate-limit con Upstash. Ver [`../ops/security.md`](../ops/security.md).

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD

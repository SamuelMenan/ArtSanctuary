---
title: API conventions
audience: backend
status: stable
updated: 2026-08-13
owner: TBD
---

# API conventions

Convenciones obligatorias para endpoints bajo `src/app/api/`. Garantizan que el cliente
trate cualquier respuesta de error con el mismo handler genérico.

## Auth

Endpoints autenticados:

```ts
import { requireUser } from '@backend/auth/requireUser'

export async function PATCH(req: NextRequest) {
  const r = await requireUser()            // { withPassword: true } para password ops
  if (!r.ok) return r.response             // 401 ya estructurado
  const user = r.user                      // IUser cargado
  // ...
}
```

`requireUser`:
1. `auth()` valida JWT + `tokenVersion`.
2. `connectDB()`.
3. `User.findById(session.user.id)` (con `+passwordHash` si flag).
4. 401 si `status === 'deleted'` o no existe.

Source: `src/backend/auth/requireUser.ts`.

## Response — éxito

```ts
import { apiOk } from '@backend/http/errors'

return apiOk({ profile: { /* ... */ } })
// → { ok: true, profile: {...} }   status 200
```

`apiOk<T>(data, status = 200)`. El `ok: true` discrimina del shape de error.

## Response — error

```ts
import { apiError } from '@backend/http/errors'

return apiError('VALIDATION_ERROR', 'Datos inválidos', { username: 'No disponible' })
```

Devuelve:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos inválidos",
    "fields": { "username": "No disponible" }
  }
}
```

con status HTTP derivado. Source: `src/backend/http/errors.ts`.

### Códigos tipados

| Código | HTTP | Uso |
|---|---|---|
| `UNAUTHORIZED` | 401 | Sin sesión o sesión inválida |
| `FORBIDDEN` | 403 | Sesión válida, acción denegada (ej. password incorrecta) |
| `NOT_FOUND` | 404 | Recurso no existe |
| `VALIDATION_ERROR` | 400 | Body inválido o validador falla |
| `CONFLICT` | 409 | Duplicado (username, email) |
| `PAYLOAD_TOO_LARGE` | 413 | Upload > límite |
| `UNSUPPORTED_MEDIA_TYPE` | 415 | MIME no soportado |
| `INTERNAL_ERROR` | 500 | Fallo no esperado |

## Cliente — handler genérico

```ts
const res = await fetch('/api/settings/profile', {
  method: 'PATCH',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(payload),
})
const data = await res.json()

if (!res.ok) {
  // data.error.code   → string tipado
  // data.error.message → human-readable
  // data.error.fields  → Record<string, string> por input
  setFieldErrors(data.error?.fields ?? {})
  setBanner(data.error?.message ?? t('settings.saveError'))
  return
}
// data.ok === true
```

## Validación

**Servidor es autoritativo.** Cliente puede validar de forma optimista, servidor
siempre revalida.

Validators en `src/shared/lib/validation/settings.ts` son **funciones puras TS** sin
dependencias externas:

```ts
export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; fields: Record<string, string> }

export function validateProfile(raw: unknown): ValidationResult<ProfileInput>
export function validateEmail(value: unknown): ValidationResult<string>
export function validatePassword(value: unknown): ValidationResult<string>
export function validatePreferences(raw: unknown): ValidationResult<PreferencesInput>
export function validateNotifications(raw: unknown): ValidationResult<NotificationInput>
export function validatePrivacy(raw: unknown): ValidationResult<PrivacyInput>
```

Uso:

```ts
const result = validateProfile(body)
if (!result.ok) return apiError('VALIDATION_ERROR', 'Datos inválidos', result.fields)
const v = result.value
```

Si en el futuro adoptamos `zod`, el shape `{ ok, value | fields }` se preserva
detrás de un adaptador.

### Reglas de Dominio Complejas (Workspaces)

Para lógica muy específica de negocio (ej. validación del Carnaval), las reglas viven en `src/shared/lib/workspaces/`. Estas se consumen tanto en el cliente (para los warnings in-canvas del Inspector) como en la API (para rechazar la creación de snapshots inválidos).

Ejemplo de uso de validadores compartidos (`src/shared/lib/workspaces/carnaval/validate.ts`):
```ts
import { validateCarnavalConfig } from '@/shared/lib/workspaces/carnaval/validate'

const rules = getCarnavalRules(projectKind)
const result = validateCarnavalConfig(rules, planes)
if (!result.isValid) return apiError('VALIDATION_ERROR', 'No cumple el reglamento de Corpocarnaval')
```

## Side effects sensibles

Endpoints que cambian estado de sesión (password, email, deactivate, delete,
logout-all) **deben rotar** `tokenVersion`:

```ts
r.user.tokenVersion += 1
await r.user.save()
```

Invalida tokens existentes. La sesión se corta en el callback `jwt` de
`src/backend/auth/index.ts` — revalidado contra DB con throttle de 5 min, no
en cada request. Ver [`../architecture/auth.md`](../architecture/auth.md) y
[ADR-0001](../adr/0001-jwt-tokenversion.md).

## Multipart / uploads

```ts
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const ct = req.headers.get('content-type') || ''
  if (!ct.startsWith('multipart/form-data')) {
    return apiError('UNSUPPORTED_MEDIA_TYPE', 'Se espera multipart/form-data')
  }
  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) {
    return apiError('VALIDATION_ERROR', '...', { file: 'Archivo requerido' })
  }
  // Revalidar MIME + size SIEMPRE
}
```

## Cascada y atomicidad

MongoDB standalone no soporta tx multi-doc. Cascadas (delete cuenta) ejecutan en
orden y aceptan posible inconsistencia parcial. Ver
[ADR-0004](../adr/0004-hard-delete-sin-tx.md).

## Naming y estructura

- Un `route.ts` por endpoint (no agrupar múltiples recursos en uno).
- Methods exportados: `GET`, `POST`, `PATCH`, `DELETE`.
- Sub-recurso → subdirectorio (`/api/settings/account/email/route.ts`).
- Body parsing con `.catch(() => null)` + null check (evita crash por JSON malformado).

## Anti-patterns

```ts
// ❌ Formato ad-hoc
return NextResponse.json({ success: false, error: '...' })

// ❌ Throw sin capturar → 500 sin código tipado
throw new Error('something')

// ❌ Confiar en validación cliente
// (faltar validateX en server)

// ❌ Autorizar por session.user.email/name
if (session.user.email === 'admin@...') { ... }

// ❌ findById sin connectDB
const u = await User.findById(id)

// ❌ Cambiar password sin revalidar currentPassword
user.passwordHash = await bcrypt.hash(newPwd, 12)
```

## Inventario actual

Detalle por dominio:

- [`settings.md`](settings.md) — 11 endpoints
- [`users.md`](users.md) — perfil público, follow, listas
- [`artworks.md`](artworks.md) — CRUD obras
- [`carnaval-projects.md`](carnaval-projects.md) — proyectos, planos y snapshots
- [`collections.md`](collections.md) — colecciones
- [`notifications.md`](notifications.md) — notificaciones

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD

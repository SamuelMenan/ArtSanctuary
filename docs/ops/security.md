---
title: Security & threat model
audience: ops
status: stable
updated: 2026-08-14
owner: TBD
---

# Security & threat model

Estado actual del prototipo. Honesto sobre lo que está cubierto y lo que falta.

## Cubierto

| Amenaza | Mitigación |
|---|---|
| Password leak en logs | `passwordHash` con `select: false`. `bcrypt.hash(pwd, 12)` siempre |
| Session hijacking básico | JWT firmado con `AUTH_SECRET`. Cookie `HttpOnly` + `SameSite=Lax` |
| Token replay tras rotación | `tokenVersion` revalidado **cada 5 min** (throttle, no en cada request — corregido 2026-08-14, ver [`../architecture/auth.md`](../architecture/auth.md#callbacks)). Ver [ADR-0001](../adr/0001-jwt-tokenversion.md) |
| Login con cuenta eliminada | `status='deleted'` rechazado en `authorize()` |
| Path traversal en MCP `write_file` | `safeResolve` bloquea `..`, paths absolutos |
| Path traversal en avatar | UUID-like filename generado, no usa input usuario |
| MIME spoofing en upload | Validación servidor: `file.type` ∈ whitelist + `file.size ≤ 3MB` |
| Mass assignment — Boards, Collections, Carnaval Projects, Artworks | Ruta construye un `update` **allowlisted** campo a campo antes de llamar al servicio (verificado en `PATCH /api/boards/[id]`, `PATCH /api/carnaval-projects/[id]`, y `PUT /api/artworks/[id]` — este último arreglado 2026-08-14, ver nota abajo) |
| Username enum | Mensaje genérico "Email o contraseña incorrectos" en login |
| XSS desde DB | React escapa por default; no `dangerouslySetInnerHTML` con user input |
| User enum por avatar URL | Filename incluye userId — acepta el trade-off (avatar ya es público) |

## NO cubierto — pendiente

### Rate limiting

**Riesgo**: bruteforce de `currentPassword` en endpoints sensibles, abuso de
`/api/auth/register`, abuso de upload de avatar.

**Endpoints afectados** (sin rate-limit):
- `POST /api/auth/register`
- `signIn` (NextAuth credentials)
- `PATCH /api/settings/account/email`
- `PATCH /api/settings/account/password`
- `POST /api/settings/account/deactivate`
- `DELETE /api/settings/account`
- `POST /api/settings/avatar`

**Mitigación pendiente**: Upstash Ratelimit o middleware Redis. Limites
sugeridos:
- Login: 5/min/IP, 10/h/IP
- Register: 3/h/IP
- Password change: 3/h/user
- Avatar upload: 10/h/user

### CSRF

**Riesgo**: bajo (same-origin + cookie `SameSite=Lax`), pero endpoints
state-changing no validan origin/referer header explícitamente.

**Mitigación pendiente**: middleware que valide `Origin` o `Sec-Fetch-Site` en
métodos no-GET.

### Verificación email real

`PATCH /api/settings/account/email` aplica directo. Atacante con acceso
temporal a sesión podría cambiar email + recuperar password después.

**Mitigación pendiente**: SMTP provider + flujo `emailPendingChange` + token
por email. Estructura DB ya preparada.

### Cascada delete no atómica

`DELETE /api/settings/account` ejecuta secuencial. Fallo a mitad → estado
parcial. Ver [ADR-0004](../adr/0004-hard-delete-sin-tx.md).

**Mitigación pendiente**: replica set + `session.withTransaction` o soft delete
con purge worker.

### Logs estructurados

`console.error` plano. En producción puede leakear:
- IDs de usuario
- Email (en errores de Mongoose validation)
- Stack traces con paths del filesystem

**Mitigación pendiente**: pino/winston con redaction de campos sensibles.

### Headers de seguridad

Sin CSP, HSTS, X-Frame-Options custom. Next.js + Vercel aportan defaults
moderados pero no estrictos. Verificado 2026-08-14: `next.config.ts` **sí**
tiene un `headers()`, pero es COOP/COEP acotado a `/dashboard/tools/crop`
(necesario para `SharedArrayBuffer` en la IA de recorte de fondo) — no
headers de seguridad generales. No confundir uno con el otro.

**Mitigación pendiente**: `next.config.ts` con `headers()`:

```ts
{
  source: '/(.*)',
  headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    // CSP cuando se estabilicen los assets
  ],
}
```

### Backup / disaster recovery

Sin estrategia documentada. Atlas tiene backups automáticos en M10+. Local
mongod sin backup.

### Audit log

Acciones sensibles (delete cuenta, cambio email, logout-all) no se registran
para auditoría posterior.

**Mitigación pendiente**: colección `audit_log` con `{ userId, action, timestamp, ip, ua }`.

### Mass assignment en Carnaval Projects (`accreditationStatus`) — sin arreglar

`PATCH /api/carnaval-projects/[id]` filtra en la ruta, pero permite setear
`accreditationStatus: 'ready'` directamente con solo una validación de
enum — sin verificar que exista una versión/snapshot final real detrás. No
se profundizó si esto importa de verdad para el flujo de acreditación ante
Corpocarnaval (puede que la validación real viva en otro punto del
proceso de jurados, fuera de la app). Pendiente de decisión, no de código —
no se tocó.

## Threats explícitamente fuera de scope

- **DDoS a nivel red**: responsabilidad del proveedor (Vercel/Cloudflare).
- **Compromiso de Atlas**: depende del proveedor + IAM correcto.
- **Side-channel attacks** sobre `bcrypt.compare`: `bcryptjs` ya es constant-time.
- **Vulnerabilidades de dependencias**: gestionado vía `npm audit` periódico.

## Procedimiento de incidente

1. Identificar vector. Detener si está en vivo.
2. Rotar `AUTH_SECRET` → invalida todas las sesiones.
3. Si DB comprometida: rotar credenciales Atlas + restaurar backup.
4. Forzar reset password masivo: incrementar `tokenVersion` de afectados via
   script (queda sesión inválida).
5. Notificar usuarios afectados (cuando exista flujo de email).
6. Post-mortem documentado en `docs/incidents/YYYY-MM-DD.md`.

## Auditoría manual

```bash
npm audit                                 # vulnerabilidades en deps
git log --all -p | grep -i "password\|secret\|token"   # secrets leakados
grep -r "console.log" src/                # debug residual
```

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Reverificado contra código real (no solo contra lo que el doc ya decía):
  `tokenVersion` throttle corregido, mass assignment revisado en Boards/
  Collections/Carnaval Projects/Artworks (1 hallazgo real en Artwork, ver
  arriba). No reverificado en esta pasada: rate-limiting (se asume que la
  lista de endpoints sigue vigente), CSRF, headers de seguridad, backup.

---
title: Deployment
audience: ops
status: stable
updated: 2026-08-13
owner: TBD
---

# Deployment

Prototipo. Sin pipeline CI/CD oficial todavía. Esta guía documenta opciones
viables y los bloqueantes conocidos.

## Targets

| Target | Estado | Bloqueantes |
|---|---|---|
| Vercel | ✅ funcional | Requiere `BLOB_READ_WRITE_TOKEN` configurado (Storage → Blob en el dashboard) — sin él, el upload falla con error explícito, no falla en silencio |
| Self-hosted Node (`NODE_ENV=production`) | ✅ funcional | Mismo requisito: `BLOB_READ_WRITE_TOKEN` — el fallback local **no aplica** en producción, esté self-hosted o no |
| Docker | 🚧 sin Dockerfile | Pendiente crear |

## Almacenamiento de imágenes

`POST /api/settings/avatar` y el upload de obras usan `saveImage()`
(`src/backend/upload/storage.ts`). La regla es por `NODE_ENV`, no por
plataforma de hosting:

- **`NODE_ENV=production` + `BLOB_READ_WRITE_TOKEN` presente** → sube a Vercel Blob.
- **`NODE_ENV=production` sin token** → **lanza un error** al subir (fail-fast:
  el FS serverless es de solo lectura salvo `/tmp`, así que un fallback
  silencioso guardaría una URL muerta en la DB).
- **`NODE_ENV` distinto de `production`** (dev) → escribe a `public/uploads/...`
  en el filesystem local, sin necesitar el token.

**Requisito pre-prod**: `BLOB_READ_WRITE_TOKEN` configurado en cualquier
target que corra con `NODE_ENV=production` — Vercel o self-hosted por igual.
Ver [`env.md`](env.md) y [ADR-0021](../adr/0021-vercel-blob-image-storage.md).

> `ADR-0002` (avatares en `/public/uploads`) documentaba un plan de migración
> a Cloudinary que no se ejecutó — el proyecto adoptó Vercel Blob en su lugar.
> Ver ADR-0021 para la decisión vigente.

## Build local

```bash
npm install
npm run build        # next build
npm run start        # next start, default :3000
```

Verifica:
- `npx tsc --noEmit` → 0 errores
- `npm run lint` → 0 errores
- `npm run build` → completa sin warnings críticos

## Deploy en Vercel (con limitación de uploads)

1. Crear proyecto Vercel apuntando al repo.
2. Configurar env vars en Vercel dashboard:
   - `MONGODB_URI` (Atlas recomendado, no localhost)
   - `AUTH_SECRET`
   - `AUTH_URL=https://<deployment>.vercel.app`
   - `BLOB_READ_WRITE_TOKEN` — se inyecta automáticamente al crear un Blob
     store en Storage → Blob del dashboard del proyecto
3. Deploy automático en push a `main`.

**Limitaciones**:
- Cold starts en planes free (~500ms primer hit).

## Deploy self-hosted

```bash
# En el servidor
git pull
npm ci --omit=dev
npm run build
NODE_ENV=production node .next/standalone/server.js   # o pm2/systemd
```

Recomendaciones:
- Reverse proxy (nginx/Caddy) con TLS.
- `pm2` o `systemd` para mantenerlo arriba.
- `BLOB_READ_WRITE_TOKEN` configurado — con `NODE_ENV=production` (como en
  el comando de arriba) el fallback local **no está disponible**, falla
  explícito sin el token.

## MongoDB

- **Dev**: local `mongod` o Atlas free tier.
- **Prod**: Atlas M10+ recomendado (replica set permite transacciones, IP allowlist, backups automáticos).

Sin replica set:
- `DELETE /api/settings/account` no es atómico (ver [ADR-0004](../adr/0004-hard-delete-sin-tx.md)).
- Sin point-in-time recovery.

## Pre-deploy checklist

- [ ] `npm run build` verde local.
- [ ] `npx tsc --noEmit` verde.
- [ ] Env vars seteadas en target.
- [ ] `AUTH_SECRET` distinto de dev.
- [ ] MongoDB URI apunta a instancia prod (no localhost).
- [ ] `BLOB_READ_WRITE_TOKEN` configurado en el target — sin él, el upload de avatares/obras falla en producción (no hace fallback silencioso).
- [ ] Rate-limit configurado en endpoints sensibles (pendiente — ver [`security.md`](security.md)).
- [ ] CORS / cookies: `Secure` flag activo en prod (NextAuth maneja).
- [ ] Logs estructurados: revisar `console.error` para no leakear PII.
- [ ] Backup plan para MongoDB.

## Post-deploy smoke

```bash
curl -I https://<url>/                          # 200
curl -I https://<url>/login                     # 200
curl https://<url>/api/auth/csrf                # token JSON
```

UI manual:
- [ ] Login funciona
- [ ] Settings page carga
- [ ] Cambio password rota sesión
- [ ] Avatar upload (si habilitado)
- [ ] Profile público accesible

## Rollback

Vercel: usar "Promote to Production" sobre el deployment anterior.

Self-hosted:
```bash
git revert <commit>
npm ci && npm run build
pm2 reload server
```

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD

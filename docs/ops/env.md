---
title: Env vars & secrets
audience: ops
status: stable
updated: 2026-08-13
owner: TBD
---

# Env vars & secrets

Variables consumidas por la app. Plantilla en `.env.example`. Local: `.env.local`
(gitignored).

## Requeridas

| Variable | Donde se usa | Ejemplo |
|---|---|---|
| `MONGODB_URI` | `src/backend/db/mongoose.ts` | `mongodb://localhost:27017/artsanctuary` o `mongodb+srv://...` |
| `AUTH_SECRET` | NextAuth firma JWT | string aleatorio ≥ 32 chars (`npx auth secret`) |

Sin estas dos la app **no arranca**.

## Almacenamiento de imágenes

| Variable | Estado | Notas |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | **Requerida en producción** | Token de Vercel Blob (`@vercel/blob`, dependencia real). `saveImage()` (`src/backend/upload/storage.ts`) solo usa Blob si `NODE_ENV === 'production'` **y** este token está presente. En producción sin token, **lanza un error** (no hace fallback silencioso — el FS serverless de Vercel es de solo lectura). Fuera de producción, sin token, escribe a `public/uploads/...` como fallback de dev. En Vercel se inyecta automáticamente al crear el Blob store; en local, `vercel env pull .env.local` o pegar el token manualmente. Ver [ADR-0021](../adr/0021-vercel-blob-image-storage.md). |

`CLOUDINARY_*` — **no aplica**. `ADR-0002` planeaba migrar avatares a
Cloudinary; el proyecto adoptó Vercel Blob en su lugar (ver ADR-0021).
Cloudinary no es dependencia del proyecto.

## Opcionales

| Variable | Estado | Notas |
|---|---|---|
| `AUTH_URL` | Solo prod | URL canónica del deployment |
| `NODE_ENV` | Standard | `development` \| `production` |

## Generar `AUTH_SECRET`

```bash
npx auth secret
```

Imprime un valor seguro y opcionalmente lo escribe a `.env.local`.

## MongoDB URIs

```bash
# Local mongod
MONGODB_URI=mongodb://localhost:27017/artsanctuary

# Atlas
MONGODB_URI=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/artsanctuary?retryWrites=true&w=majority
```

> URL-encodear `USER:PASSWORD` si contienen caracteres especiales.

## Anti-patterns

❌ Commitear `.env.local`. Verificar `.gitignore`:
```
.env*.local
.env.production
```

❌ Hardcode de URIs / secrets en código. Siempre `process.env.X`.

❌ Loggear el valor de `AUTH_SECRET` o `MONGODB_URI` con credenciales.

❌ Reusar `AUTH_SECRET` entre dev y prod.

## Rotación

| Secret | Cuando rotar | Impacto |
|---|---|---|
| `AUTH_SECRET` | Sospecha de leak | **Todos** los JWTs existentes se invalidan, usuarios deben re-login |
| `MONGODB_URI` (password) | Periódicamente / leak | Atlas: crear user nuevo + deprecar viejo |

## Validación

`src/backend/db/mongoose.ts` falla en startup si `MONGODB_URI` no está:

```ts
throw new Error('Define la variable MONGODB_URI en .env.local...')
```

NextAuth falla con mensaje claro si `AUTH_SECRET` no está en producción.

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD

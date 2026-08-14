---
id: 0021
title: Vercel Blob como almacenamiento de imágenes (reemplaza plan de Cloudinary)
status: accepted
date: 2026-08-13
deciders: [equipo-core]
supersedes: [0002]
superseded-by: []
---

# 0021 — Vercel Blob como almacenamiento de imágenes

## Contexto

`ADR-0002` fijó `/public/uploads` como almacenamiento de avatares para el
prototipo, con un plan de migración explícito a Cloudinary o S3 antes de
producción, dado que el filesystem de Vercel es efímero por invocación.

Ese plan no se ejecutó. En su lugar, el proyecto adoptó **Vercel Blob**:
`@vercel/blob` es dependencia de producción en `package.json`, y
`src/backend/upload/storage.ts` implementa el almacenamiento híbrido
descrito abajo. Esta ADR se escribe **retroactivamente**, durante una
auditoría de documentación (2026-08-13), para formalizar una decisión que
ya estaba implementada en código pero nunca quedó registrada — no hay
fecha ni discusión original disponibles más allá de lo que el propio código
revela.

## Decisión

Usar **Vercel Blob** (`put`/`del` de `@vercel/blob`) como almacenamiento de
imágenes (avatares y obras) en producción, vía la función `saveImage()` /
`deleteImage()` en `src/backend/upload/storage.ts`. La selección de backend
es automática y depende de `NODE_ENV`, no de una bandera manual:

- `NODE_ENV=production` + `BLOB_READ_WRITE_TOKEN` presente → Vercel Blob (URL pública, CDN).
- `NODE_ENV=production` sin token → lanza error explícito al guardar (fail-fast).
- Cualquier otro `NODE_ENV` (dev) → escribe a `public/uploads/...` en filesystem local, sin requerir el token.

`saveAvatar()` (`src/backend/upload/avatar.ts`) y el flujo de upload de obras
consumen esta misma función — la interfaz `saveImage`/`deleteImage` que
`ADR-0002` ya había dejado preparada para un swap de backend cumplió su
propósito.

## Consecuencias

- ✅ Persistente y compatible con el filesystem efímero de Vercel — resuelve
  el bloqueante que `ADR-0002` dejó abierto.
- ✅ CDN incluido, sin configurar servidor de assets aparte.
- ✅ Mismo código sirve self-hosted y Vercel — la condición es `NODE_ENV`, no
  la plataforma.
- ✅ Fallo explícito (no silencioso) si falta el token en producción — evita
  guardar URLs muertas en la DB.
- ❌ Dependencia de un proveedor externo (vendor lock-in), el mismo trade-off
  que `ADR-0002` había descartado sobre Cloudinary — se aceptó de todas
  formas, probablemente por integración nativa con Vercel (no verificado,
  ver "Contexto").
- ❌ Sin `BLOB_READ_WRITE_TOKEN`, dev local sigue escribiendo a
  `public/uploads/...` — mismo trade-off de `ADR-0002` (sin optimización de
  imagen) se mantiene para ese caso.

## Notas

- Implementación: `src/backend/upload/storage.ts` (`saveImage`, `deleteImage`),
  consumida por `src/backend/upload/avatar.ts`.
- Variable de entorno: `BLOB_READ_WRITE_TOKEN`, documentada en
  [`../ops/env.md`](../ops/env.md).
- Ver también [`../ops/deployment.md`](../ops/deployment.md) para el
  requisito de configuración por target de deploy.
- Esta ADR no cubre el upload de obras (`/api/upload`) en detalle — usa la
  misma función `saveImage()`, no verificado línea por línea en esta pasada.

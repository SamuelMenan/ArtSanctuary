---
title: Compresión de imágenes (Upload)
audience: frontend, architecture, ops
status: stable
updated: 2026-08-14
owner: TBD
---

# Compresión de imágenes (Upload)

> **Ubicación del núcleo:** `src/shared/lib/image/canvas.ts`

Toda imagen que se sube a `/api/upload` (referencias, recortes, cutouts, grid
enviado a boards, artworks) pasa por una compresión **del lado cliente** antes
de viajar al servidor.

## Por qué existe

El edge de Vercel rechaza cualquier cuerpo de petición mayor a **~4.5 MB** con
un **HTTP 413** *antes* de que la función se ejecute. Por eso la compresión
**tiene que ocurrir en el cliente**: un `sharp` en el servidor no evitaría el
413 (la plataforma corta el body en el borde). Además reduce el storage de
Vercel Blob.

Causa original del bug: la cuadrícula (`renderGridBlob`) se exportaba como PNG
crudo a 120 px/celda; con muchos cuadros el canvas llegaba a ~16000 px → PNG de
decenas de MB → 413 al mandar a boards.

## Pipeline

Centralizado en `src/shared/lib/image/canvas.ts`:

| Función | Qué hace |
|---|---|
| `compressImage(blob)` | Reescala a ≤4096px (Pica/lanczos) + re-encoda WebP. Detecta alpha. Devuelve `{ blob, originalSize, compressedSize }`. |
| `uploadCompressedBlob(blob, name)` | Sube a `/api/upload` **sin** recomprimir. Deriva extensión del `type`. |
| `uploadBlob(blob, name)` | `compressImage` + `uploadCompressedBlob`. Atajo para callers que no necesitan métricas. |

El módulo exporta además 6 helpers de canvas que no son parte del pipeline de
compresión pero se usan en todo el resto de herramientas de imagen:
`loadImage`, `imageToCanvas`, `cropCanvas`, `buildTransformedCanvas`,
`canvasToBlob`, `downloadBlob`.

⚠️ **`loadImage` fuerza `img.crossOrigin = 'anonymous'`** — invariante crítico:
sin eso el canvas queda *tainted* y `getImageData`/`toBlob` lanzan. Es la causa
raíz del bug relatado en [ADR-0006](../adr/0006-vercel-blob-konva-transformer.md).

### Parámetros de calidad

| Caso | Formato / calidad | Razón |
|---|---|---|
| Foto / referencia (sin alpha) | WebP **q0.75** | Indistinguible a ojo, ~70% menos peso |
| Recorte / cutout (con alpha) | WebP **q0.95** | Protege bordes del recorte (evita fringing) |
| GIF | **passthrough** | No aplanar a 1 frame (perdería la animación) |
| < 500 KB | **passthrough** | Ya es chico; evita recomprimir con pérdida |
| Lado largo > 4096 px | reescala a 4096 | Suficiente para trazado/referencia |

Garantía: `compressImage` **nunca** devuelve un blob mayor que el original (si
el WebP sale más grande, conserva el original).

### Rutas cubiertas

- `ImageSourceModal` (subida desde disco)
- `CropTool` y `useCutoutEditor` (vía `uploadBlob`)
- `ReferenceGridScreen` → boards (`renderGridBlob` ya emite WebP capado + `uploadCompressedBlob`)
- `useUploadArtwork` (vía `uploadBlob`)

**Corregido 2026-08-14:** este doc afirmaba que `useBoardExport` "solo descarga
(`toDataURL`), no sube → no interviene". **Es falso**: importa `uploadBlob` y lo
llama al hacer handoff de una imagen volteada hacia otra herramienta. Sí pasa
por el pipeline.

Nota aparte: `CropTool.tsx` define su **propia copia local** de
`buildTransformedCanvas` en vez de importar la compartida — ver
[`../ops/known-issues.md`](../ops/known-issues.md#11).

---

## ⚠️ Comportamiento en local (IMPORTANTE)

**En desarrollo (`npm run dev`, `NODE_ENV !== 'production'`) la compresión y el
límite de tamaño están DESACTIVADOS.**

| | Local (`npm run dev`) | Producción |
|---|---|---|
| `compressImage` | passthrough (original íntegro) | WebP + reescala |
| `renderGridBlob` | **PNG** lossless | **WebP** q0.82 |
| Límite de tamaño en `/api/upload` | **sin límite** | 10 MB (`MAX_SIZE`) |

Motivo: en local no existe el edge de Vercel (no hay 413) y conviene trabajar
con el original a máxima calidad. El gate vive en tres sitios y todos miran
`process.env.NODE_ENV`:

- `src/shared/lib/image/canvas.ts` → `compressImage` (early return)
- `src/app/api/upload/route.ts` → check de `MAX_SIZE`
- `src/frontend/features/tools/grid/lib/renderGridBlob.ts` → formato de salida

### Consecuencias a tener en cuenta

- Una imagen que sube bien en local **puede dar 413 en producción** si supera
  ~4.5 MB tras comprimir (caso raro: GIF animado pesado, o cutout plano grande
  cuyo WebP no baja del original).
- El peso/formato de los archivos guardados **difiere** entre local y prod
  (local guarda PNG/original; prod guarda WebP). No te fíes del tamaño local.

### Cómo probar la compresión real localmente

`process.env.NODE_ENV` se fija al iniciar; para ejercitar el camino de
producción hay que correr un build de prod:

```bash
npm run build && npm run start   # NODE_ENV=production → compresión activa
```

(En ese modo la subida sí exige `BLOB_READ_WRITE_TOKEN`; ver
`src/backend/upload/storage.ts`.)

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Constantes (`MAX_UPLOAD_DIM=4096`, `WEBP_QUALITY=0.75`,
  `WEBP_ALPHA_QUALITY=0.95`, `COMPRESS_SKIP_BELOW=500KB`), el passthrough de GIF
  y el gate de `NODE_ENV` verificados uno por uno contra `canvas.ts`. Todo
  correcto salvo la afirmación sobre `useBoardExport`, ya corregida arriba.

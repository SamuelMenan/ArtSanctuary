---
title: "Feature: Upload"
audience: all
status: stable
updated: 2026-08-13
owner: TBD
---

# Feature: Upload

No es un feature aparte — es la compresión + persistencia de imagen que corre
detrás de subir una obra. Redirect:

- Compresión del lado cliente antes de subir (por qué existe, parámetros de
  calidad, diferencia dev/prod): [`image-compression.md`](image-compression.md).
- Contrato de API (`POST /api/artworks`, `POST /api/upload`):
  [`../api/artworks.md`](../api/artworks.md) y
  [`../architecture/routing.md`](../architecture/routing.md).
- Almacenamiento final (Vercel Blob vs. fallback local):
  [`../ops/env.md`](../ops/env.md).

## Última verificación

- Fecha: 2026-08-13
- Commit: HEAD

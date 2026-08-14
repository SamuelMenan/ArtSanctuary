---
id: 0002
title: Avatares en /public/uploads para prototipo
status: superseded
date: 2026-05-18
deciders: [equipo-core]
superseded-by: [0021]
---

# 0002 — Avatares en /public/uploads para prototipo

> **Superseded por [ADR-0021](0021-vercel-blob-image-storage.md).** El
> plan de migración a Cloudinary descrito abajo no se ejecutó; el proyecto
> adoptó Vercel Blob en su lugar. Esta ADR se conserva como contexto
> histórico de por qué se empezó con `/public/uploads`.

## Contexto

Settings exige avatar upload/replace/delete real. Cloudinary/S3 requiere credenciales
y vendor lock-in. Prototipo aún no tiene presupuesto ni infra externa.

## Decisión

Guardar avatares en `public/uploads/avatars/{userId}-{ts}-{rand}.{ext}` durante
prototipo. Validar MIME + size cliente y servidor. Borrar archivo anterior al
reemplazar. Servir vía Next static.

`/public/uploads` en `.gitignore`.

## Consecuencias

- ✅ Cero dependencias externas; funciona offline.
- ✅ Same-origin, sin CORS ni firmas.
- ❌ **No escala en serverless** (Vercel filesystem efímero). Bloqueante para deploy
  en Vercel salvo migración a storage externo.
- ❌ Sin redimensionado/optimización (no `sharp`).
- ❌ Filename incluye `userId` → pequeña fuga de enumeración. Aceptable: ya es público
  por naturaleza el avatar.

## Alternativas consideradas

1. **Cloudinary** — pendiente, ruta clara para v1.0.
2. **MongoDB GridFS / base64** — degrada DB, malas prácticas con assets binarios.
3. **S3 + presigned URL** — costo de implementación para prototipo.

## Plan de migración

Capa de abstracción `src/backend/upload/avatar.ts` ya separa `saveAvatar`/`deleteAvatarFile`.
Sustituir las dos funciones por SDK Cloudinary/S3 sin tocar endpoints.

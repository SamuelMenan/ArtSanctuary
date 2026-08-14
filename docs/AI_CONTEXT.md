---
title: "ArtSanctuary — AI Context (resumen ejecutivo)"
audience: ai-agent
status: stable
updated: 2026-08-14
owner: TBD
---

# ArtSanctuary - AI Context (Resumen Ejecutivo)

> ⚠️ **ATENCIÓN AGENTES IA:** Este es el contexto maestro de ArtSanctuary. NO leas toda la carpeta `docs`. Después de leer esto, dirígete a `docs/INDEX.md` para encontrar lo que necesites.

## Proyecto
ArtSanctuary es una aplicación orientada al aprendizaje, estructuración y generación de estudios de dibujo (tableros, referencias de anatomía, recorte, cuadrículas y más). 

## Stack Tecnológico Principal
- **Frontend:** Next.js 16.2 (App Router), React 19, Tailwind CSS v4, Motion (Animaciones).
- **Herramientas de Dibujo / Canvas:** Konva y React-Konva.
- **Backend/DB:** Mongoose (MongoDB).
- **Autenticación:** Next-Auth v5.
- **Almacenamiento:** Vercel Blob.

## Reglas Inquebrantables de Arquitectura
1. **Tipado Estricto (TypeScript):** Está terminantemente prohibido usar `any`. Toda entidad debe tener su interfaz — hoy viven colocadas junto a su dominio (ej. `src/shared/lib/boards/types.ts`), no en un directorio central de tipos. `types/` en la raíz es solo para augmentation de librerías externas (`next-auth.d.ts`).
2. **Separación de Lógica:** No inyectar lógica de negocio compleja ni fetchers directamente en los componentes de UI. Usa hooks (`useBoard`, `useTool`) o los servicios de `src/backend/services/` invocados desde Server Components — el proyecto no usa Server Actions (`"use server"`), usa el patrón Controlador-Servicio (ver `architecture/estructura-optimizada.md`).
3. **Konva & React-Konva:** Para cualquier elemento dibujable en el canvas, usa primitivas de React-Konva y controla la gestión de memoria evitando instanciar imágenes en ciclos infinitos.
4. **Diseño Visual:** Todo diseño debe usar las variables de color del `design-system.md` (ej. `var(--color-primary)`) y seguir el esquema de Dark Mode.

## Antes de tocar código — lo que no se deduce leyendo el repo

- **Hay bugs conocidos sin resolver**, documentados con su ubicación exacta en
  `docs/ops/known-issues.md`. Uno es crítico (la galería de todo perfil público
  devuelve vacío). Consúltalo antes de trabajar en servicios o Carnaval, para
  no "descubrir" un bug ya registrado ni construir encima de él.
- **Workspaces tiene 3 registros independientes** (dominio, UI, extensión de
  lienzo) e invariantes que rompen en silencio: `docs/architecture/workspaces-plugins.md`.
- **Verificación automática**: `npm run docs:verify` compara la documentación
  contra el código (campos de modelo, métodos HTTP, existencia de ficheros,
  `'use client'`). Si cambias un modelo o una ruta, córrelo — falla con exit 1
  si dejaste la doc desincronizada.
- **`npm test` pasa limpio** (19 archivos, 141 tests) y `tsc --noEmit` da 0
  errores. Si algo falla tras tu cambio, lo rompiste tú. Ojo: el gate corre
  `i18n:scan` **antes** que los tests, así que un string hardcodeado aborta
  todo sin que veas ningún test rojo — ver `docs/contributing/testing.md`.

## Enrutamiento Siguiente
👉 **Para cualquier tarea, ve inmediatamente a `docs/INDEX.md` y busca la ruta exacta del dominio a modificar.**

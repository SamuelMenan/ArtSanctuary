---
title: Router de documentación para agentes IA (INDEX)
audience: ai-agent
status: stable
updated: 2026-08-13
owner: TBD
---

# ArtSanctuary - Router de Documentación (INDEX)

> Cobertura acotada: ADRs, frontend, ops y performance. Para API, arquitectura,
> features, contributing y business, ver el índice completo en
> [`README.md`](README.md).

> ⚠️ **ATENCIÓN AGENTES IA:** 
> Usa la herramienta MCP `read_file` EXCLUSIVAMENTE para los archivos listados aquí que estén relacionados con tu tarea actual. 

## 🏗 Arquitectura y Decisiones (ADRs)
Si modificas lógica base de librerías externas o canvas, lee los ADRs pertinentes para no romper soluciones históricas:
- Versión de tokens JWT: `docs/adr/0001-jwt-tokenversion.md`
- Subida de avatares locales: `docs/adr/0002-local-avatar-uploads.md`
- Resolución de temas del sistema (dark/light): `docs/adr/0003-system-theme-resolution.md`
- Borrado duro sin transacciones: `docs/adr/0004-hard-delete-sin-tx.md`
- Decisiones sobre Konva y Redimensionamiento: `docs/adr/0005-konva-grid-snap-resize.md`
- Decisiones sobre subida a Vercel Blob en el Canvas: `docs/adr/0006-vercel-blob-konva-transformer.md`
- Peticiones de datos (RSC vs HTTP): `docs/adr/0007-server-components-data-fetching.md`
- Reglas estables sobre Lazy Loading y "use client": `docs/adr/0008-client-bundle-konva-lazy-loading.md`
- Internacionalización en el Servidor: `docs/adr/0009-i18n-server-dictionaries.md`
- Estrategia de Mapeo de Músculos Canon (Clasificación vs Generación): `docs/adr/0010-canon-muscle-mapping-strategy.md`
- Resolución de conflictos en Tailwind v4 (El bug del texto negro): `docs/adr/0011-tailwind-v4-text-utility-collision.md`
- Canon: Motor puro sin dependencias (Separación estricta): `docs/adr/0012-canon-purity-and-scaling.md`
- Canon: Vector para UI vs Raster para Render (Decisión P9): `docs/adr/0013-canon-vector-vs-raster.md`
- Unificación del diseño UI (AppBar Styles): `docs/adr/0014-appbar-shared-styles.md`
- Tokens de Animación (Single Source of Truth): `docs/adr/0015-motion-tokens-single-source.md`
- Procesamiento Pesado de Imágenes en Cliente: `docs/adr/0016-client-side-image-processing.md`
- Serialización Estricta Mongoose (.lean) en RSC: `docs/adr/0017-mongoose-lean-rsc-serialization.md`
- Prohibición de Gestores de Estado Global (Zero Zustand): `docs/adr/0018-zero-global-state-libraries.md`
- Formularios Nativos React 19 (Zero Zod Client): `docs/adr/0019-native-form-data-react-19.md`
- Canon Frontal (Geometría Asimétrica y Z-Index): `docs/adr/0020-canon-frontal-asymmetry-zindex.md`
- Vercel Blob para almacenamiento de imágenes (supersede a 0002): `docs/adr/0021-vercel-blob-image-storage.md`
- `docs/` y `.agents/` trackeados en git: `docs/adr/0022-docs-agents-tracked-in-git.md`

## 🎨 UI, Frontend y Diseño
Para desarrollar componentes, maquetación visual y flujos del cliente:
- Sistema de diseño (Color/Tema): `docs/frontend/design-system.md`
- Temas y accesibilidad: `docs/frontend/theming.md` / `docs/frontend/accessibility.md`
- Internacionalización: `docs/frontend/i18n.md`
- Mapa de Componentes: `docs/frontend/components-map.md`
- Animaciones: `docs/frontend/animations.md`
- Solución de errores comunes con Tailwind: `docs/frontend/tailwind-errores-comunes.md`

## 🧪 Testing
Antes de asumir que algo tiene cobertura automática:
- Qué corre `npm test`, qué está cubierto (lógica pura) y qué no (routes, componentes, E2E): `docs/contributing/testing.md`

## 🚀 Despliegue, Infraestructura y Seguridad (Ops)
Para configuraciones del entorno de producción:
- Entornos y Variables: `docs/ops/env.md`
- Proceso de Despliegue: `docs/ops/deployment.md`
- Seguridad: `docs/ops/security.md`

## ⚡ Rendimiento (Performance)
Si la tarea implica mejorar los tiempos de carga:
- Optimización RSC: `docs/performance/01-optimizacion-servidor-rsc.md`
- Estrategia Cliente: `docs/performance/02-estrategia-carga-cliente.md`
- Diccionarios i18n: `docs/performance/03-optimizacion-diccionarios-i18n.md`

## 📝 Planes de Features y PRs Activos
- Planes en curso: `docs/pr/incompletos/` (ej. `docs/pr/incompletos/plan-rediseno-tools-imagen.md`) y `docs/pr/importantes/`.
- Planes cerrados/ejecutados: archivados en `docs/historical/` (ya no en `docs/pr/completos/`, movido el 2026-08-13). El 2026-08-13 también se movieron 5 planes de `pr/incompletos/` cuyo trabajo ya estaba implementado en código pese a la etiqueta.
- Herramientas visuales y canon de anatomía: `docs/pr/importantes/canon/` y `docs/helps/`.

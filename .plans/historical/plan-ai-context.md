# Plan — Migración de Documentación a Arquitectura JIT (Just-In-Time) / MCP

> ✅ **Implementado.** `docs/AI_CONTEXT.md`, `docs/INDEX.md` y `docs/adr/`
> existen y cumplen lo descrito abajo. Verificado y movido a
> `docs/historical/` el 2026-08-13 — no se revisó cada sub-punto del plan
> original línea por línea, solo los 3 entregables principales.
>
> Estado original: 📝 PLANEADO · Alcance: global (docs)

## 1. Problema Actual
La carpeta `/docs` tiene mucha información dividida en subcarpetas (`frontend`, `historical`, `helps`, `ops`, etc.). Cuando un agente de IA intenta resolver una tarea, no sabe por dónde empezar y a menudo lee demasiados archivos, o el desarrollador tiene que copiar y pegar archivos gigantes, gastando cientos de miles de tokens de contexto innecesariamente.

## 2. Objetivo
Implementar la arquitectura centrada en MCP y enrutamiento explícito, usando `AI_CONTEXT.md` (resumen ejecutivo), `INDEX.md` (router) y migrar decisiones arquitectónicas a un registro `adr/`. Esto reducirá el gasto de tokens, mejorará la precisión de la IA y ordenará el repositorio.

## 3. Tareas a Ejecutar

### Paso 1: Crear `docs/AI_CONTEXT.md` (Resumen Ejecutivo)
- **Acción:** Escribir un documento corto (máx 2 páginas) que describa el stack principal (React, Next.js, Node, Konva, etc.).
- **Contenido:** 
  - Reglas maestras inflexibles (ej. "No usar ANY en TS", "Siempre priorizar estilos con Tailwind").
  - Mención explícita a qué es el proyecto ArtSanctuary.
  - Al final del documento, un enlace mandatorio hacia `INDEX.md`.

### Paso 2: Crear `docs/INDEX.md` (El Router)
- **Acción:** Mapear todas las carpetas actuales en un solo archivo.
- **Contenido:**
  - Sección de Frontend: Enlaces a `frontend/design-system.md`, `frontend/components-map.md`, etc.
  - Sección de Herramientas (Canvas): Enlaces a `historical/` o notas específicas sobre Konva.
  - Sección de Despliegue: Enlaces a `ops/deployment.md`.
  - Instrucciones para la IA: "Si vas a tocar el sistema de login, dirígete al archivo X. No leas nada más".

### Paso 3: Reorganizar Decisiones en `docs/adr/`
- **Acción:** Crear la carpeta `docs/adr/` (Architecture Decision Records).
- **Migración:** Algunos documentos que están en `historical/` (ej. `2026-06-04-konva-grid-snap-resize-nan.md`) deberían documentarse como una decisión técnica (ADR) si implican una limitación o regla que la IA no debe revertir bajo ninguna circunstancia.

### Paso 4: Implementar la Regla de Agente Global
- **Acción:** ✔️ **HECHO**. Ya se ha creado el archivo `.agents/AGENTS.md` en la raíz del proyecto. Este archivo contiene la **REGLA PRINCIPAL DE DOCUMENTACIÓN**, la cual obligará a cualquier agente (Gemini, Cline, Roo, Continue) a leer primero `AI_CONTEXT.md` e `INDEX.md` antes de explorar cualquier otro documento.

## 4. Criterios de Éxito
- Al enviar a la IA el prompt: *"Revisa las reglas del proyecto"*, la IA automáticamente busca y lee `AI_CONTEXT.md` usando sus herramientas.
- La IA nunca más intenta indexar toda la carpeta `/docs` de golpe.
- Los consumos de contexto (tokens enviados por request) se reducen drásticamente.

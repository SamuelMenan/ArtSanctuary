---
id: 0022
title: Trackear docs/ y .agents/ en git (revierte plan-limpieza-git)
status: accepted
date: 2026-08-13
deciders: [equipo-core]
supersedes: []
superseded-by: []
---

# 0022 — Trackear `docs/` y `.agents/` en git

## Contexto

`docs/`, `mcp/` y `.agents/` estaban excluidos de git (`.gitignore`), etiquetados
como "tooling y docs: solo local, fuera del repo" — decisión formalizada en
`historical/plan-limpieza-git.md`. En la práctica esto causó dos problemas
concretos, encontrados durante una auditoría de documentación (2026-08-13):

1. El `README.md` raíz le promete a cualquiera que clone el repo que la
   documentación está en `/docs` — pero `/docs` no viaja con el clon.
2. `.agents/AGENTS.md`, el archivo que le dicta a **cualquier agente IA**
   cómo comportarse en este repo (incluyendo qué tool usar para leer
   archivos), tampoco viaja con el repo. Un agente IA en un checkout limpio
   no tiene reglas que seguir.

Además, sin git, ningún cambio a la documentación pasa por review, tiene
historial real, o puede diferenciarse — lo cual chocaba directamente con el
objetivo de tener "documentación profesional".

## Decisión

`docs/` y `.agents/` **se trackean en git** a partir de ahora. `mcp/` sigue
excluido — arrastra su propio `node_modules` pesado y es una herramienta de
desarrollo separada, no documentación ni reglas de comportamiento.

## Consecuencias

- ✅ El `README.md` raíz deja de prometer algo que no existe en el clon.
- ✅ `.agents/AGENTS.md` y las skills en `.agents/skills/` viajan con el
  repo — cualquier agente IA en cualquier checkout tiene las mismas reglas.
- ✅ Cambios a la documentación pueden revisarse por PR, tienen historial,
  se pueden auditar con `git blame`/`git log`.
- ❌ El repo crece en tamaño (~157 archivos adicionales trackeados,
  mayormente markdown — impacto de peso real bajo, no son binarios salvo
  unas pocas imágenes <200KB).
- ❌ Contenido de negocio/anuncios (`.plans/business/`, `.plans/business/comunicados/`)
  y prompts de generación de imagen (`.plans/helps/`) quedan públicos si el
  repo lo es — revisar visibilidad del repo si esto importa.

## Notas

- Revierte la recomendación de `historical/plan-limpieza-git.md` (que
  proponía sacar `docs/` del repo). Ese plan resolvía un problema real
  (`mcp/node_modules` commiteado por error, ~92% del peso del repo) que
  sigue vigente — `mcp/` permanece ignorado por esa razón, independiente de
  esta decisión sobre `docs/`.
- `.gitignore` actualizado: se quitaron las líneas `/docs` y `.agents/`.

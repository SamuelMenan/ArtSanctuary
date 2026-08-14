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
- ❌ **Rompió el build de CSS, y hubo que acotar el escaneo de Tailwind.** La
  detección automática de contenido de Tailwind v4 excluye lo que ignore
  `.gitignore`; al dejar de ignorar `docs/`, Tailwind empezó a escanear los
  `.md` y a tomar por clases reales los ejemplos citados en prosa. El propio
  ADR-0011 cita un comodín con asterisco para prohibirlo, y eso generaba
  `color: var(--text-*)` — CSS inválido, build caído. Resuelto en
  `src/app/globals.css` con `source(none)` + un `@source` explícito a `src/`.

## Trampa: el `@source` de `globals.css` es load-bearing

`src/app/globals.css` abre con `@import "tailwindcss" source(none);` seguido de
`@source "../../src";`. **No es redundante y no se puede simplificar a un
`@import` normal**: sin ello Tailwind vuelve a escanear todo el repo excepto lo
ignorado, la documentación incluida, y basta con que un `.md` mencione una
clase malformada para tumbar el build. La restricción a `src/` es válida porque
todo el JSX del proyecto vive ahí (verificado: `git ls-files '*.tsx' '*.jsx'`
no devuelve nada fuera de `src/`). Si algún día se añaden componentes fuera de
`src/`, hay que registrar esa ruta con otro `@source` o dejarán de generarse
sus clases — un fallo silencioso, sin error de build.

## Notas

- Revierte la recomendación de `historical/plan-limpieza-git.md` (que
  proponía sacar `docs/` del repo). Ese plan resolvía un problema real
  (`mcp/node_modules` commiteado por error, ~92% del peso del repo) que
  sigue vigente — `mcp/` permanece ignorado por esa razón, independiente de
  esta decisión sobre `docs/`.
- `.gitignore` actualizado: se quitaron las líneas `/docs` y `.agents/`.

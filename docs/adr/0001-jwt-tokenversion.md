---
id: 0001
title: JWT con tokenVersion para invalidación selectiva
status: accepted
date: 2026-05-18
deciders: [equipo-core]
---

# 0001 — JWT con tokenVersion para invalidación selectiva

## Contexto

Settings introduce flujos de seguridad que requieren invalidar sesiones existentes:
cambio de contraseña, cambio de email, logout-all, desactivación, eliminación. NextAuth
v5 con strategy `jwt` no provee revocación por defecto. La alternativa es strategy
`database` con tabla de sesiones (Redis o Mongo), que añade infraestructura.

## Decisión

Mantener strategy `jwt`. Añadir campo `tokenVersion: number` en `User`. Embeber `tv`
en el token. En cada request, callback `jwt` consulta `User.findById(token.id)` y
compara `tv === user.tokenVersion`. Si difiere → token nulo, sesión termina.

Acciones que rotan `tokenVersion`:
- Cambio password
- Cambio email
- Logout-all explícito
- Desactivación
- Eliminación

## Consecuencias

- ✅ Sin servicio externo (Redis) ni colección extra.
- ✅ Invalidación instantánea en el próximo request.
- ✅ Logout-all sin coste extra de UI.
- ❌ Un `findById(userId)` extra por request autenticado. Aceptable a escala media.
- ❌ Race condition trivial: si rotamos en t y request paralelo en t-1 ya pasó callback,
  ese request termina. Aceptable.

## Alternativas consideradas

1. **Sessions en Mongo/Redis** — más correcto, más infra. Deferido hasta scale need.
2. **JWT corto + refresh** — complica UX y manejo de cookies. Overkill aquí.
3. **Solo `iat` + denylist** — mantiene infra extra (denylist).

## Notas

- Implementación: `src/backend/auth/index.ts`, callback `jwt` (con throttle de 5 min, ver `architecture/auth.md`).
- Rotación: `src/app/api/settings/account/{email,password,sessions,deactivate}/route.ts`.

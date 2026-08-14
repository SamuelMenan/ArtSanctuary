---
id: 0003
title: Resolución de tema 'system' en cliente vía matchMedia
status: accepted
date: 2026-05-18
deciders: [equipo-core]
---

# 0003 — Resolución de tema 'system' en cliente vía matchMedia

## Contexto

Settings añade opción `system` para tema. El servidor no puede conocer
`prefers-color-scheme` del navegador antes del primer paint.

## Decisión

Persistir preferencia raw (`dark|light|system`) en cookie + DB. En cliente
`AppPreferencesProvider` usa `window.matchMedia('(prefers-color-scheme: dark)')` y
expone `resolvedTheme: 'dark'|'light'`. Listener de cambios del SO actualiza el
DOM cuando `theme === 'system'`.

SSR renderiza con `defaultTheme = 'dark'` cuando la cookie es `system`. Posible
flash si OS está en light; se acepta para prototipo.

## Consecuencias

- ✅ Persistencia clara entre dispositivos vía DB.
- ✅ Cliente reactivo a cambios del SO en vivo.
- ❌ Flash entre `dark` (SSR) y `light` (post-hydrate) si OS=light + cookie=system.
- ❌ Cookie `system` distinta de cookie `dark|light` añade caso a SSR.

## Alternativas consideradas

1. **Script inline en `<head>`** que lee cookie + matchMedia antes de hydrate.
   Pendiente para v1.0; elimina el flash a costo de un blocking script.
2. **No soportar `system`** — peor UX, contradice prácticas modernas.
3. **CSS-only `prefers-color-scheme`** sin override → pierde tema explícito del usuario.

## Notas

- `src/shared/i18n/index.ts:resolveTheme(theme, systemPrefersDark)`.
- `src/frontend/shared/providers/AppPreferencesProvider.tsx`.

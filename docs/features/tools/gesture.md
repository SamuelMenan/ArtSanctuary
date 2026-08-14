---
title: "Gesture (temporizador de dibujo de gesto)"
audience: frontend, product
status: wip
updated: 2026-08-14
owner: TBD
---

# Gesture

> **Ubicación:** `src/frontend/features/tools/gesture/screens/GestureScreen.tsx`.
> **Ruta:** `/dashboard/tools/gesture`.

## ⚠️ Estado real: prototipo visual, no funcional

Verificado leyendo el archivo completo (único archivo de la feature, 111
líneas) — esto **no es una herramienta funcional**, es un mockup de UI
estático:

- El "tiempo restante" (`{Math.round(duration * 0.8)}`) es una **fórmula
  fija**, no un cronómetro — no hay `useEffect`/`setInterval` contando
  hacia atrás. Mover el slider de duración no inicia nada.
- Las dos "imágenes de referencia" son URLs externas hardcodeadas
  (`lh3.googleusercontent.com/aida-public/...`) — assets de una herramienta
  de diseño IA, no imágenes reales del usuario ni del backend. No hay
  rotación de imágenes, no hay "siguiente pose".
- El botón "SIGN IN" / "INICIAR SESIÓN" no tiene handler.
- El copy está **hardcodeado inline** en un objeto `copy` dentro del
  componente (bypasea por completo el sistema i18n real del proyecto —
  contradicto con [`../../frontend/i18n.md`](../../frontend/i18n.md), que
  documenta `createTranslator`/diccionarios como el único mecanismo).

**Lo único con estado real es el slider de duración** (`useState`, 15-120s)
— no conectado a ninguna lógica.

## Qué haría falta para que sea real

No verificado/diseñado en esta pasada — solo constatado que falta. Como
mínimo: un cronómetro real, una fuente de imágenes (¿biblioteca propia?
¿upload del usuario? ¿banco externo con licencia?), y migrar el copy a
`src/shared/i18n/`.

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Verificado: archivo completo leído. `grep` sin resultados para lógica de
  timer o fetch de imágenes en el resto de `tools/gesture/`.

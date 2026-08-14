---
title: "Plan: Animaciones del modal reutilizable (ImageSourceModal)"
audience: frontend
status: proposed
updated: 2026-06-04
owner: TBD
---

# Plan: Animaciones del modal reutilizable

> `ImageSourceModal` (selector de imagen: subir / colecciones) se reutiliza en ~5
> pantallas. Hoy aparece con `animate-in fade-in` (clase **prohibida** por
> [`../frontend/animations.md`](../../../docs/frontend/animations.md)) y **no anima al cerrar**.
> Objetivo: entrada y salida suaves con `motion` y tokens, sin tocar los 5 padres.

## Diseño

- **Backdrop**: fade (opacity 0↔1).
- **Panel**: `scaleIn` (opacity + scale 0.96→1 + leve `y`), origen centrado.
- **Salida auto-contenida**: el modal gestiona su propia animación de cierre con
  `AnimatePresence`, sin requerir que cada padre lo envuelva.
  - Estado interno `visible` (arranca `true`). Cerrar = `setVisible(false)` →
    `AnimatePresence` reproduce el `exit` → `onExitComplete` llama al callback real.
  - Cierre normal (X / Escape / clic en backdrop) → `onExitComplete` → `onClose()`.
  - Selección de imagen → guarda la url en un ref, `setVisible(false)` →
    `onExitComplete` → `onSelect(url)`. Así también anima al elegir.
- **Mejora de UX** (necesaria para los disparadores de cierre): cerrar con **Escape**
  y con **clic en el backdrop** (hoy no existen).
- `reducedMotion`: respetado por el `<MotionConfig reducedMotion="user">` ya montado
  en `AppShell` (todas las páginas cuelgan de él).
- Quitar `animate-in fade-in`.

## Archivos
- editar `src/frontend/features/tools/shared/ImageSourceModal.tsx`.
- (sin cambios en los 5 consumidores).

## Verificación
1. `tsc`/`eslint` limpios; sin `animate-in`.
2. Abrir el modal en una tool → entra (backdrop fade + panel scaleIn).
3. Cerrar con X, Escape y clic fuera → anima la salida y luego se desmonta.
4. Elegir imagen (subir o de colección) → anima salida y aplica la selección.
5. `prefers-reduced-motion: reduce` → reduce el movimiento, usable.

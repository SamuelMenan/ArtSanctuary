---
title: "Plan: Boards — animaciones con Motion (post-UI)"
audience: frontend
status: proposed
updated: 2026-06-04
owner: TBD
---

# Plan: Boards — animaciones con Motion

> **Depende de** [`plan-boards-ui-review.md`](plan-boards-ui-review.md): se ejecuta
> **una vez completado** el plan de UI (cuando ya existan `IconButton`, `Popover`,
> `RightRail`, los chips del empty state y el segmented de modos). Este plan **solo**
> añade movimiento; no cambia layout.
>
> Objetivo: que el editor de tableros tenga animaciones **suaves y presentes** —ni pocas
> ni saturadas— que aclaren cambios de estado y den sensación de calidad. **Toda**
> animación con `motion` (`motion/react`), siguiendo la norma y los tokens de
> [`../frontend/animations.md`](../frontend/animations.md)
> (`src/frontend/shared/motion/tokens.ts`). Prohibido `@keyframes` CSS nuevos.

## Principios para esta sección

- Movimientos cortos (≤0.32s) y desplazamientos pequeños (≤16px); sin rebotes exagerados.
- Animar **entradas y salidas** de lo condicional con `AnimatePresence`.
- Respetar `prefers-reduced-motion` con `<MotionConfig reducedMotion="user">` (envolver el
  contenedor del editor en `BoardEditor`) o `useReducedMotion` puntual.
- No animar lo que se redibuja a 60fps en el `Stage` de Konva (objetos del lienzo): el
  movimiento va en la **capa de UI HTML** (islas, rail, popovers, overlays), no en los
  nodos Konva.

## Animaciones a añadir (presentes, sin saturar)

### 1. Islas al montar
`ToolIsland`, `RightRail`, `ZoomIsland`, `TopBar`: entrada sutil al cargar el editor
(`fadeSlide` con leve desplazamiento desde su borde; stagger ligero entre islas).
Da sensación de que la interfaz "se arma" sin distraer.

### 2. Popover de escala (B del plan UI)
`Popover` abre/cierra con `AnimatePresence` (opacity + scale 0.96→1 + pequeño `y`),
origen en el botón "Escala". Es el caso más visible: debe sentirse instantáneo pero suave.

### 3. Rail derecho — secciones contextuales
La sección "objeto seleccionado" aparece/desaparece según haya selección: animar con
`fadeSlide` + `layout` para que el reflujo del rail (cambio de alto) sea suave, no salto.

### 4. Barras de formato contextuales
`TextFormatBar` / `ShapeStyleBar` (aparecen al seleccionar texto/figura): entrada/salida
con `fadeSlide` en vez de aparición seca. Hoy aparecen de golpe.

### 5. Estado activo de herramienta (segmented modos)
Transición del indicador activo entre select/hand/measure con `layoutId` (pastilla que se
desliza) o transición de color suave. Refuerza la jerarquía del plan UI con movimiento.

### 6. Empty state con chips (F del plan UI)
Entrada del bloque (icono + texto + chips) con `fadeSlide` y stagger corto de los chips.
Salida al crear el primer objeto.

### 7. Menú contextual y ayuda de atajos
`ContextMenu` (clic derecho) y `ShortcutsHelp` (tecla `?`): abrir con `AnimatePresence`
(fade + scale/`y`). El modal de ayuda con fade del backdrop + leve `y` del panel.

### 8. Feedback de zoom
Al cambiar el % en `ZoomIsland`, micro "tick" del número (scale 1→1.08→1, muy breve) para
confirmar el cambio sin distraer. Botón de reset/fit con `whileTap`.

### 9. Botones e iconos
`IconButton`: `whileHover`/`whileTap` sutiles (scale ~1.02/0.98), desactivados en
`disabled`. Cambio de icono (p. ej. ojo, lock/lock_open, grid) con cross-fade.

### 10. Overlays de Carnaval
Inspector de Acreditación (`CarnavalInspector`) y alertas (`CarnavalAlerts`): panel entra
con `fadeSlide` lateral; alertas aparecen/desaparecen con `AnimatePresence` (que el
usuario note cuándo una validación cambia).

### 11. Píldora de vista (Carnaval)
Cambio de vista (frontal/lateral/superior…): transición de la selección activa en la
píldora con `layoutId` o color, coherente con el segmented de modos (punto 5).

## Qué NO animar (evitar saturar)

- Nodos del lienzo (imágenes/figuras) durante drag/resize/zoom — lo maneja Konva.
- Las líneas de la cuadrícula ni la guía reglamentaria.
- Nada en bucle infinito ni "para llamar la atención".

## Archivos probables

| Acción | Ruta |
|---|---|
| editar | `…/boards/BoardEditor.tsx` (envolver en `MotionConfig`; montar empty state animado) |
| editar | `…/toolbars/IconButton.tsx` (whileHover/whileTap, cross-fade de icono) |
| editar | `…/toolbars/Popover.tsx` (AnimatePresence) |
| editar | `…/toolbars/RightRail.tsx` (layout + secciones contextuales) |
| editar | `…/toolbars/ToolIsland.tsx` (segmented con `layoutId`) |
| editar | `…/toolbars/ZoomIsland.tsx` (tick del %, whileTap) |
| editar | `…/toolbars/{TextFormatBar,ShapeStyleBar}.tsx` (entrada/salida) |
| editar | `…/boards/components/{ContextMenu,ShortcutsHelp}.tsx` (AnimatePresence) |
| editar | `…/workspaces/carnaval/board/{CarnavalOverlays,CarnavalInspector,CarnavalAlerts}.tsx` |
| usar | `src/frontend/shared/motion/tokens.ts` (DURATION/EASE/fadeSlide/popIn) |

## Verificación

1. `tsc`/`eslint` limpios; `npm run dev`.
2. Cada interacción tiene su animación: abrir popover, seleccionar objeto (rail/format
   bars), cambiar herramienta (pastilla desliza), empty state, menú contextual, ayuda,
   cambio de %, inspector/alertas de Carnaval.
3. Ninguna animación supera ~0.32s ni produce layout shift brusco.
4. DevTools → `prefers-reduced-motion: reduce` → animaciones reducidas, UI usable.
5. Revisar que NO se añadieron `@keyframes` CSS ni clases `animate-[...]` (todo `motion`).
6. Rendimiento: el `Stage` de Konva no se ralentiza (las animaciones viven en la capa HTML).

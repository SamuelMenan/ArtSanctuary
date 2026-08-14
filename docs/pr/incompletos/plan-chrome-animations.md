---
title: "Plan: Animaciones de barras retráctiles + revelado por proximidad (boards)"
audience: frontend
status: proposed
updated: 2026-06-04
owner: TBD
---

# Plan: Animaciones de chrome retráctil + revelado por proximidad

> Objetivo: animar **todas** las barras que se retraen (navbar global, sidebar
> global, mini-sidebar de herramientas) — **no** las estáticas — con movimiento
> útil para accesibilidad y comodidad. Y resolver el "apretado" de boards con un
> **revelado por proximidad**: los controles de reapertura están ocultos por
> defecto (lienzo amplio) y aparecen, con animación, cuando el ratón/foco se
> acerca a los bordes.
>
> **Toda** animación con `motion` (`motion/react`) y los tokens de
> [`../frontend/animations.md`](../frontend/animations.md)
> (`src/frontend/shared/motion/tokens.ts`). **Prohibido** `@keyframes` y clases
> `animate-[...]`/`animate-in`. Continúa la línea de
> [`plan-boards-animaciones.md`](plan-boards-animaciones.md) pero a nivel de chrome.

## Contexto (mecánica actual)

- **`ChromeProvider`**: estado global `sidebarOpen` / `navbarOpen` (+ toggles).
- **`Navbar`** (top): se esconde con `-translate-y-full` + `transition-all`.
- **`Sidebar`** (izq global): se esconde con `-translate-x-full` + `transition`.
- **`ToolActiveLayout`** (mini-sidebar de tools): colapsa por `width` (`w-[260px] ↔ w-0`),
  con un **botón flotante de reapertura** (`chevron_right`) en el borde izquierdo.
- **`AppShell`**: botón flotante de reapertura del **navbar** (`expand_more`, top-center).

Dos de esos botones flotantes usan animaciones **prohibidas** (`animate-in fade-in
slide-in-from-*`) — hay que migrarlas a `motion`:
- `AppShell.tsx` (reabrir navbar).
- `ToolActiveLayout.tsx` (reabrir mini-sidebar).

### El problema de boards (a resolver)
Para que la flecha de reapertura (28px) no quedara enterrada bajo la paleta, las
islas se empujaron a 48px del borde (`left-12`, `right-12`, `bottom-12`). Eso dejó
sitio a la flecha **pero** boards se siente apretado (menos lienzo). Queremos que
ese empuje **solo ocurra cuando hace falta** (cuando la flecha va a aparecer).

## Objetivo de interacción (boards)

- **Reposo** (ratón lejos de los bordes top/izq): flechas de reapertura **ocultas**;
  islas en posición **cómoda** (`left-4`, `bottom-4`) → más lienzo, sin sensación de
  apretado. La zona de detección ("caja invisible") es **grande**.
- **Proximidad** (ratón cerca del borde top o izq, o foco por teclado, o touch): la
  flecha correspondiente **entra con animación** desde el borde **y** las islas
  adyacentes se **desplazan hacia el centro** (`left-4 → left-12`) para dejarle sitio.
- Al alejar el ratón: la flecha sale (AnimatePresence) y las islas vuelven a la
  posición cómoda. Todo `motion`, sin salto de layout.

> Solo aplica a los controles **pegados a boards** (borde top = reabrir navbar;
> borde izq = reabrir mini-sidebar de tools). Las demás páginas conservan el
> comportamiento actual.

## Fundamentos

### Tokens
Reutilizar `transition.{fast,base,slow}`, `fadeSlide`. Añadir si hace falta una
variante direccional de barra lateral (`slideX`) y de barra superior (`slideY`) en
`tokens.ts` (≤16px, ≤0.32s).

### Accesibilidad (requisito)
Nunca esconder un control sin alternativa:
- **Teclado**: las flechas siguen en el orden de tabulación; revelar también con
  `focus-within` de la zona / `:focus-visible` de la flecha.
- **Touch** (sin hover): en `@media (hover: none)` las flechas se muestran siempre
  (no dependen del ratón). Usar `useReducedMotion`/`MotionConfig reducedMotion="user"`.
- Mantener `aria-label` (i18n) en todas las flechas.

### Coordinación de estado
La zona de detección vive en el lienzo (`BoardEditor`), pero las flechas viven en
`ToolActiveLayout`/`AppShell` y las islas en `BoardEditor`. Para coordinar sin
prop-drilling, **extender `ChromeProvider`** con estado de revelado:
```ts
edgeReveal: { top: boolean; left: boolean }
setEdgeReveal: (e: Partial<{top:boolean; left:boolean}>) => void
```
- `BoardEditor` (lienzo) lo **setea** por proximidad.
- Flechas de reapertura y posición de islas lo **leen**.

## Cambios por área

### A. Animar barras retráctiles (motion)
1. **`Navbar`**: sustituir `transition-all`/translate por `motion` (slide vertical
   con `animate` según `navbarOpen`); respetar `reducedMotion`.
2. **`Sidebar`** (global): translate-x → `motion` slide. (Opcional: stagger sutil de
   los ítems al abrir.)
3. **`ToolActiveLayout`** mini-sidebar: animar `width` con `motion` (o `layout`) sin
   romper el contenido; quitar la transición CSS manual.

### B. Migrar botones flotantes a `motion` + AnimatePresence
- `AppShell` (reabrir navbar) y `ToolActiveLayout` (reabrir mini-sidebar): envolver
  en `AnimatePresence`, entrada `fadeSlide`/slide desde el borde. **Eliminar**
  `animate-in fade-in slide-in-from-*` (prohibidas).

### C. Revelado por proximidad (la obligatoria)
- En `BoardEditor`, añadir **zonas de detección** invisibles y anchas en el borde
  **top** y **left** del contenedor del lienzo (p. ej. tiras de ~64px con
  `onMouseEnter/Leave`; alternativa: `pointermove` con distancia al borde, throttled).
  La tira y la flecha comparten la zona "activa" (no se cierra al pasar a la flecha).
- Esas zonas actualizan `edgeReveal` en `ChromeProvider`.
- Las flechas de reapertura (top/left) se muestran con `AnimatePresence` **solo si**
  la barra está colapsada **y** (`edgeReveal` || focus || touch).

### D. Reflow reactivo de islas (boards)
- Parametrizar la posición de `ToolIsland`, `ZoomIsland` (y opcionalmente
  `RightRail`) según `edgeReveal`:
  - Reposo: `left-4` / `bottom-4` (cómodo).
  - Borde izq revelado + mini-sidebar colapsado: `left-12` (deja sitio a la flecha).
- Animar el desplazamiento con `motion` (`animate` de `x`/posición), sin salto.
- Quita el `left-12`/`bottom-12`/`right-12` **fijo** actual: pasa a ser **condicional**.

### E. Otras animaciones útiles (sutiles, sin saturar)
- Flecha de reapertura: `whileHover` scale ~1.05, `whileTap` ~0.95.
- Estado activo de toggles del navbar (chevron sidebar): cross-fade de icono (ya
  cubierto por `AppBarButton` si se le añade el patrón de icono animado).
- Nada en bucle infinito ni para "llamar la atención".

## Archivos probables

| Acción | Ruta |
|---|---|
| editar | `src/frontend/shared/layouts/ChromeProvider.tsx` (estado `edgeReveal`) |
| editar | `src/frontend/shared/layouts/Navbar.tsx` (slide motion) |
| editar | `src/frontend/shared/layouts/Sidebar.tsx` (slide motion) |
| editar | `src/frontend/shared/layouts/AppShell.tsx` (reopen navbar → motion/AnimatePresence + reveal) |
| editar | `src/frontend/features/tools/shared/ToolActiveLayout.tsx` (width motion; reopen → motion/AnimatePresence + reveal) |
| editar | `src/frontend/features/tools/boards/BoardEditor.tsx` (zonas de proximidad → `edgeReveal`) |
| editar | `…/boards/toolbars/ToolIsland.tsx`, `ZoomIsland.tsx`, `RightRail.tsx` (posición reactiva) |
| editar (si hace falta) | `src/frontend/shared/motion/tokens.ts` (variantes `slideX/slideY`) |

## Orden sugerido
1. `ChromeProvider`: estado `edgeReveal`.
2. B: migrar los dos botones flotantes a `motion` (quita `animate-in`).
3. A: animar navbar/sidebar/tool-sidebar.
4. C: zonas de proximidad en `BoardEditor` → `edgeReveal`.
5. D: reflow reactivo de islas (default cómodo `left-4`; revelado `left-12`).
6. E: micro-feedback.

## Verificación
1. `tsc`/`eslint` limpios; `npm run dev`.
2. **Boards**: en reposo no hay flechas y las islas están a `left-4`/`bottom-4` (no se
   siente apretado). Al acercar el ratón al borde izq/top, la flecha entra animada y
   las islas se desplazan al centro sin solaparse; al alejar, vuelven.
3. Barras retráctiles (navbar/sidebar/tool-sidebar) abren/cierran con `motion` suave.
4. **Accesibilidad**: con teclado, las flechas se revelan al enfocar y son usables;
   en touch (DevTools → `hover: none`) están siempre visibles; `prefers-reduced-motion:
   reduce` reduce el movimiento y todo sigue usable.
5. **Sin** `@keyframes`/`animate-[...]`/`animate-in` nuevos (todo `motion`).
6. Sin layout shift brusco; el `Stage` de Konva no se ralentiza (animación en capa HTML).

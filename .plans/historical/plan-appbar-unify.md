---
title: "Plan: Unificar barras superiores (Navbar + TopBars) — tamaños, colores, botones"
audience: frontend
status: proposed
updated: 2026-06-04
owner: TBD
---

# Plan: Unificar barras superiores (appbar)

> Origen: la barra de navegación global (`Navbar`) y la barra superior del editor de
> tableros (`TopBar`) **no comparten** altura, fondo, padding ni estilo de botón →
> incoherencia visual. El problema se extiende a las barras superiores de otras
> herramientas (Canon, Mezcla, Gesto, Notan), que repiten un patrón `h-16` con
> valores distintos.
>
> **Decisión canónica (elegida): híbrido nuevo** con tokens compartidos.
> Cambios **solo de UI** (tamaños, colores, primitivos); sin tocar lógica de sesión,
> navegación ni datos. Sigue la estética "galería oscura" de
> [`../frontend/design-system.md`](../../docs/frontend/design-system.md) y la norma de
> animación de [`../frontend/animations.md`](../../docs/frontend/animations.md).

## Principio de coherencia (aclaración del usuario)

> **Iconos y textos: idénticos en todas las barras (OBLIGATORIO).** El color/fondo
> **puede variar** por contexto (chrome global vs barra de herramienta sobre lienzo).

Es decir, la coherencia dura NO es el color: es que para la **misma acción** se use
**el mismo glifo, el mismo tamaño de icono, la misma tipografía y el mismo label
(i18n)**. El color/fondo se admite distinto donde el contexto lo justifique, siempre
vía tokens (no valores sueltos).

| Propiedad | Regla |
|---|---|
| Glifo de icono (mismo significado) | **Igual** (un solo set, mismo nombre por acción) |
| Tamaño de icono | **Igual** → 20px en todas las barras |
| Tipografía de textos (título/label/estado) | **Igual** (misma familia/tamaño/tracking/caja) |
| Label accesible / tooltip | **Igual** y **siempre i18n** (`t(...)`), nunca hardcode |
| Forma/tamaño del botón | **Igual** (cuadrado `rounded-xl`, `w-10 h-10`) |
| Color de fondo / superficie | **Puede variar** por contexto (vía tokens) |
| Estado activo / hover (color) | Puede variar de tono, mismo comportamiento |

## Diagnóstico (incoherencias actuales)

| Propiedad | `Navbar` (global) | `TopBar` (boards) | Otras barras de tool |
|---|---|---|---|
| Altura | `h-16` (64px) | `py-2` (~56px) | `h-16` |
| Fondo | `surface/60` + `backdrop-blur-md` | `surface-container` sólido | `surface-container` sólido |
| Borde inferior | `outline-variant` ✓ | `outline-variant` ✓ | `outline-variant` ✓ |
| Padding-x | `grid-gutter` (24px) | `px-4` (16px) | `px-6` / `px-4` / `grid-gutter` (mezcla) |
| Botón icono | redondo `p-2`, sin borde, hover=bg | cuadrado `w-10 h-10 rounded-xl`, **con borde**, hover=borde | varía |
| Tamaño de icono | 24px (default) | 20px | 18–20px |
| Hover idle | `text → primary` | `text/borde → primary` | varía |

## Auditoría de iconos y textos (lo que hay que igualar)

Divergencias concretas detectadas (esto es lo prioritario, no el color):

- **Tamaño de icono inconsistente**: Navbar usa el default (~24px, sin clase de
  tamaño); `TopBar` 20px; `CanonScreen`/`NotanScreen` 18px; badge Notan 14px.
  → **Unificar a 20px** en todas las barras.
- **Labels hardcodeados vs i18n**: `Navbar` tiene `aria-label="Ocultar barra superior"`,
  `"Mostrar/Ocultar menú lateral"` en texto plano; `TopBar` ya usa `t(...)`.
  → **Todos a i18n** (`t(...)`), y el **mismo** label para la **misma** acción.
- **Tipografía de textos dispar**: marca Navbar `font-display font-bold text-xl`;
  nombre de board `font-sans font-semibold`; títulos de tool `font-mono text-label-sm
  uppercase`. → definir `appBarTitle`/`appBarLabel` y aplicarlos según rol (marca vs
  título de sección vs estado), iguales entre barras del mismo rol.
- **Mismo glifo por acción**: verificar que colapsar/expandir, buscar, descargar,
  deshacer/rehacer, volver, etc. usan **siempre el mismo nombre de icono** en todas las
  barras (no `chevron_left` en una y otra cosa en otra para la misma acción).

## Decisión canónica — "appbar híbrido"

Estructura e iconos/textos iguales; fondo flexible:

- **Altura única**: `56px` → token `--spacing-appbar-height`. *(igual)*
- **Borde**: `border-b border-[var(--color-outline-variant)]`. *(igual)*
- **Padding-x**: `var(--spacing-grid-gutter)` (24px). *(igual)*
- **Botón icono**: cuadrado `w-10 h-10 rounded-xl`, **sin borde**, `hover:text-primary`
  + hover bg, icono **20px**, `focus-visible` ring. Variante `active`. *(forma/tamaño iguales;
  el tono de hover/active puede ajustarse al fondo de cada barra)*
- **Iconografía**: un solo set material-symbols, **20px**, `aria-hidden` en el glifo,
  `aria-label` (i18n) en el botón. Mismo glifo por acción. *(igual — obligatorio)*
- **Textos**: misma tipografía para título/estado/label en todas las barras. *(igual)*
- **Fondo / superficie**: por defecto `var(--color-surface)/60` + `backdrop-blur-md`,
  pero **puede variar** por contexto (p. ej. una barra de herramienta sobre lienzo puede
  usar `surface-container` sólido para más contraste). Siempre vía token. *(flexible)*

## Fundamentos compartidos

### 1. Tokens (en `src/app/globals.css`)
Añadir en `:root` (y heredado por temas):
```css
--spacing-appbar-height: 56px;
```
(El padding-x reutiliza `--spacing-grid-gutter`; no se crea token nuevo.)

### 2. Primitivos compartidos (nueva carpeta `src/frontend/shared/layouts/appbar/`)
Espejo del patrón ya usado en boards (`islandStyles.ts` + `IconButton.tsx`):

- **`appBarStyles.ts`** — fuente única de clases:
  - `appBarShell`: estructura **sin fondo** → `h-[var(--spacing-appbar-height)] border-b border-[var(--color-outline-variant)] px-[var(--spacing-grid-gutter)] flex items-center` (igual en todas).
  - `appBarBg.glass` y `appBarBg.solid`: las dos superficies admitidas (`surface/60 + blur`
    y `surface-container` sólido). Cada barra elige una; el resto es idéntico.
  - `appBarIconBtnIdle` / `appBarIconBtnActive(on)` (cuadrado rounded-xl, sin borde, hover bg, focus-ring, icono 20px).
  - `appBarTitle` / `appBarLabel`: tipografía única de título y de estado/label.
- **`AppBarButton.tsx`** — primitivo botón-icono de chrome. Props `icon`, `label`
  (aria obligatorio), `onClick`, `active?`, `disabled?`, `href?` (si hay `href`
  renderiza `next/link`, si no `button`). Encapsula radio/tamaño/hover/foco.

> Nota: este `AppBarButton` es para **chrome** (navbar/topbars). El `IconButton` de
> `boards/toolbars` es para **islas flotantes sobre el lienzo**: contextos distintos,
> no se fusionan (uno glass/island, otro chrome de barra).

## Cambios por archivo

### A. `src/frontend/shared/layouts/Navbar.tsx`
- Aplicar `appBarSurface` (sustituye `h-16`, fondo y padding actuales); conservar
  posicionamiento propio (`fixed`, offset `left`, `translate-y` del toggle, `z-40`,
  `justify-between`).
- Sustituir los botones redondos (toggle sidebar, toggle navbar, buscar) por
  `AppBarButton`; iconos a **20px**.
- **Pasar a i18n** los `aria-label`/`title` hoy hardcodeados ("Ocultar barra superior",
  "Mostrar/Ocultar menú lateral"); reutilizar la misma clave i18n que use TopBar para la
  acción equivalente.
- Marca "ArtSanctuary" se mantiene (`appBarTitle`), revisada para centrar en 56px.

### B. `src/frontend/shared/layouts/navbar/{ProfileMenu,NotificationsMenu,MobileMenu}.tsx`
- Alinear los **triggers** (avatar/campana/hamburguesa) al tamaño/forma de
  `AppBarButton` para coherencia (los popovers internos quedan igual).

### C. `src/frontend/features/tools/boards/toolbars/TopBar.tsx`
- Reemplazar `iconBtn` bordeado por `AppBarButton` (back con `href`, undo/redo/download).
- Aplicar `appBarSurface` (altura/fondo/blur/padding canónicos); conservar input de
  nombre, estado "Guardado" y divisores verticales ya añadidos.
- El `vsep` se mantiene; revisar contraste sobre fondo translúcido.

### D. Barras superiores de otras herramientas (mismo patrón)
`…/tools/canon/screens/CanonScreen.tsx`, `…/tools/color-mixing/components/MixControls.tsx`,
`…/tools/gesture/screens/GestureScreen.tsx`, `…/tools/notan/screens/NotanScreen.tsx`:
- Sustituir el shell `h-16 bg-surface-container px-…` por `appBarSurface`.
- Botones-icono → `AppBarButton`; los controles propios (sliders/selects) se mantienen.

### E. Acoplamientos de altura (obligatorio al cambiar 64→56)
La altura del navbar está cableada en varios sitios; migrarlos al token:
- `src/frontend/shared/layouts/AppShell.tsx`: `md:pt-16` → `md:pt-[var(--spacing-appbar-height)]`.
- `src/frontend/features/tools/shared/ToolActiveLayout.tsx`: `h-[calc(100vh-64px)]`
  → `h-[calc(100vh-var(--spacing-appbar-height))]`.
- `src/frontend/features/explore/screens/ExploreScreen.tsx`: `top-16`
  → `top-[var(--spacing-appbar-height)]`.

### F. (opcional) `docs/frontend/design-system.md`
Documentar el token `--spacing-appbar-height` y el primitivo `AppBarButton` como
estándar de barras superiores.

## Archivos a tocar

| Acción | Ruta |
|---|---|
| editar | `src/app/globals.css` (token `--spacing-appbar-height`) |
| crear | `src/frontend/shared/layouts/appbar/appBarStyles.ts` |
| crear | `src/frontend/shared/layouts/appbar/AppBarButton.tsx` |
| editar | `src/frontend/shared/layouts/Navbar.tsx` |
| editar | `src/frontend/shared/layouts/navbar/ProfileMenu.tsx` |
| editar | `src/frontend/shared/layouts/navbar/NotificationsMenu.tsx` |
| editar | `src/frontend/shared/layouts/navbar/MobileMenu.tsx` |
| editar | `src/frontend/features/tools/boards/toolbars/TopBar.tsx` |
| editar | `src/frontend/shared/layouts/AppShell.tsx` (pt → token) |
| editar | `src/frontend/features/tools/shared/ToolActiveLayout.tsx` (calc → token) |
| editar | `src/frontend/features/explore/screens/ExploreScreen.tsx` (top → token) |
| editar | `…/tools/canon/screens/CanonScreen.tsx` |
| editar | `…/tools/color-mixing/components/MixControls.tsx` |
| editar | `…/tools/gesture/screens/GestureScreen.tsx` |
| editar | `…/tools/notan/screens/NotanScreen.tsx` |
| editar (opc.) | `docs/frontend/design-system.md` |

## Orden sugerido

1. **Fundamentos**: token en `globals.css` + `appBarStyles.ts` + `AppBarButton.tsx`.
2. **Acoplamientos de altura** (E): mover los 64px al token *antes* de cambiar el navbar,
   para que el cambio de 64→56 no rompa el layout.
3. **A + B**: Navbar y sus menús.
4. **C**: TopBar de boards (las dos barras nombradas ya coherentes aquí).
5. **D**: resto de barras de herramientas.
6. **F**: documentar.

## Verificación

1. `npx tsc --noEmit` y `npx eslint` de los archivos tocados sin errores.
2. **Iconos y textos idénticos (lo prioritario)**: mismo glifo por acción, **todos los
   iconos a 20px**, misma tipografía por rol, **todos los labels en i18n** y el mismo
   label para la misma acción. Sin tamaños 24/18/14px sueltos ni `aria-label` hardcodeado.
3. `npm run dev`:
   - Navbar y TopBar de boards: **misma altura (56px), mismo padding, mismos botones**
     (cuadrados sin borde, icono 20px, hover bg). El **fondo puede diferir** por contexto
     (glass vs sólido), pero siempre vía token.
   - Sin salto de layout bajo el navbar (contenido empieza justo a 56px en
     dashboard, tools y explore).
   - El editor de boards ocupa `100vh - 56px` sin recortes ni scroll extra.
   - Otras barras (Canon/Mezcla/Gesto/Notan) comparten el mismo shell.
3. Responsive: navbar móvil (`MobileMenu`) coherente; sin desbordes.
4. Tema claro y oscuro: el fondo `surface/60 + blur` se ve bien en ambos.
5. Foco por teclado y contraste en todos los botones de barra (incl. back con `href`).
6. Comparar contra el estado previo: desaparece la diferencia de altura/fondo/botón
   entre navbar y top bar.

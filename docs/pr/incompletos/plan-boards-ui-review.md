---
title: "Plan: Boards UI — densidad, agrupación, consistencia y jerarquía"
audience: frontend
status: proposed
updated: 2026-06-04
owner: TBD
---

# Plan: Boards UI

> Origen: revisión visual del editor de tableros (captura
> `docs/Captura de pantalla 2026-06-04 142111.png`, plano Carnaval "Frontal").
> Plan **único** que fusiona los 8 hallazgos reportados por el usuario con las mejoras
> de criterio de producto (Miro/Figma). Donde ambos enfoques chocaban se elige la
> solución estructural (la "de criterio"), que resuelve los hallazgos de raíz.
> Cambios **solo de UI** (layout, agrupación, jerarquía, consistencia); sin tocar lógica.
> **Las animaciones NO entran aquí**: van en
> [`plan-boards-animaciones.md`](plan-boards-animaciones.md), que se ejecuta **después**
> de completar este plan.

## Contexto

El editor (`BoardEditor`) compone islas flotantes sobre un `Stage` de Konva. Estilos
base en `src/frontend/features/tools/boards/toolbars/islandStyles.ts`. La estética
"galería oscura" (tokens, radios, tipografía) está en
[`../frontend/design-system.md`](../frontend/design-system.md).

Islas actuales: `ToolIsland` (izq), `InspectorIsland` (der), `ZoomIsland` (inf-izq),
`TopBar` (sup), `DimensionsFooter` (inf) y overlays de Carnaval (`CarnavalOverlays`).

## Bugs de layout detectados en la captura (prioridad alta)

1. **Desborde de los controles de cm/escala.** `InspectorIsland.tsx` es `w-[52px]`, pero
   en estado sin selección el bloque de cuadrícula es una **fila horizontal**
   (`<div className="flex items-center gap-1">` con input `w-10` + presets "2 cm"/"50 cm").
   Esa fila es más ancha que 52px → se sale de la isla y **se corta contra el borde
   derecho** (lo que se ve como "5" y "2 cm" sueltos y recortados).
2. **Colisión ACREDITAR ↔ Inspector.** El botón de acreditación
   (`CarnavalOverlays.tsx`, `absolute top-3 right-3 z-20`) y la `InspectorIsland`
   (`absolute right-3 top-3`, z-30) ocupan **la misma esquina** → se superponen.

Ambos amplifican la sensación de "amontonamiento" del reporte (puntos 1 y 6) y se
resuelven de raíz con el rail unificado (sección A) y el popover de escala (sección B).

## Fundamentos compartidos

### Escala de espaciado y radios únicos (hallazgos 3, 5)
En `islandStyles.ts` definir constantes únicas y reutilizarlas en TODAS las islas:
tamaño de botón (`w-10 h-10`), radio de botón (`rounded-xl`), radio de isla (`rounded-2xl`),
píldoras de zoom/vista (`rounded-full`, intencional y documentado), gap entre iconos
(`gap-1`), padding de isla (`p-1.5`), separador estándar (`my-1`). Una sola escala fija
para todo → elimina **Spacing/Layout Inconsistency** y **Design System Inconsistency**.

### Primitivo `IconButton` (hallazgo 5)
Crear `toolbars/IconButton.tsx` que encapsule el patrón botón-icono repetido en
TopBar/ToolIsland/InspectorIsland/ZoomIsland. Variantes `idle | active | danger`,
`aria-label` obligatorio, glifo `aria-hidden`, `focus-visible` (ya añadido). Unifica
radios, tamaños y estado activo en un único lugar → resuelve **Inconsistent Component
Design**.

### Primitivo `Popover` (soporte de B)
Crear `toolbars/Popover.tsx` (contenedor flotante anclado a un botón, cierre por
clic-fuera/Escape, accesible). Sin animación todavía (se anima en el plan 2).

## Cambios por área

### A. Rail derecho unificado con secciones (hallazgos 1, 2, 6, 7 + colisión)
Hoy compiten en la esquina superior derecha: `InspectorIsland` (grid/snap/cm/capas),
el botón ACREDITAR de Carnaval y, al seleccionar, acciones de objeto. **Solución:** un
único **rail derecho** (`toolbars/RightRail.tsx`) en una sola columna con secciones de
orden estable y divisores hairline (`border-[var(--color-outline-variant)]`):
1. **Objeto seleccionado** (contextual): bloquear, duplicar, traer al frente/enviar al
   fondo, editar en (crop/grid), eliminar.
2. **Lienzo**: botón "Escala" que abre el popover (sección B) con grid/snap/cm/presets.
3. **Capas**: toggle del panel.
4. **Workspace**: ACREDITAR (integrado aquí; deja de estar en `top-3 right-3` → fin de la
   colisión).
Ancho fijo cómodo, `gap-2` entre secciones. Resuelve **Crowded Controls / Poor Visual
Grouping / Weak Component Hierarchy / Toolbar Crowding / Attention Competition** y la
colisión.

### B. Controles de escala/cm en popover (hallazgos 1, 2 — desborde y agrupación)
El input cm + presets es lo que desborda. Botón único **"Escala"** en el rail que abre un
`Popover` con: input cm, presets (2/50 cm), toggle cuadrícula, toggle snap, todo
encapsulado con fondo `--color-surface-container-low` + `rounded-lg`. Limpia el rail,
agrupa lo relacionado y **elimina el desborde estructuralmente** (patrón Figma de
propiedades en popover).

### C. Barra izquierda: modos vs crear (hallazgos 3, 7)
`ToolIsland`: separar visualmente **modos** (select/hand/measure) como un pequeño
segmented control con estado activo fuerte, de las acciones de **crear**
(imagen/texto/nota/figuras) como acciones neutras, con un divisor estándar entre ambos
grupos. Espaciado uniforme con la escala fija. Da lectura inmediata de "en qué modo
estoy" vs "qué puedo añadir" y arregla la inconsistencia de separación.

### D. Estado activo destacado (hallazgo 4)
En `IconButton`/`islandOn`, reforzar el activo: fondo `--color-primary` + realce sutil
(anillo) + icono en `--color-on-primary`; el idle baja su peso (icono en
`--color-on-surface-variant`). Resuelve **Weak Active State / Low State Contrast**.

### E. TopBar — densidad esquina superior (hallazgo 6)
Aumentar `gap` entre undo/redo/download y separarlos del estado "Guardado" con un divisor.
Tamaños/radios vía `IconButton`. El selector de vista (chevron centrado) se mantiene pero
con área de clic clara.

### F. Empty state con accesos directos (hallazgo 7 + comodidad)
Además del texto "Añade imagen, texto o nota", añadir chips centrados
"+ Imagen / + Texto / + Nota" que disparan las acciones de `ToolIsland`. Reduce el primer
paso y baja el ruido visual del lienzo vacío.

### G. Aire entre interfaz y lienzo (hallazgo 8)
Subir el margen de las islas respecto al borde (`left-3/right-3/bottom-3` → `…-4`) y
reservar un pequeño gutter para que no se peguen al contenido. Resuelve **Tight Layout /
Insufficient Breathing Room**.

### H. Coherencia del selector de vista (Carnaval)
Unificar el estilo de la píldora inferior central ("FRONTAL" / etiqueta de plano fijo /
selector de vista) y asegurar que no compita con `DimensionsFooter`.

### I. Iconografía y foco
Un solo set (material-symbols) a 20px, `aria-hidden` en el glifo, `aria-label` en el
botón (ya aplicado), `focus-visible` coherente (ya aplicado) — verificar en los controles
nuevos (rail, popover, chips).

## Archivos a tocar

| Acción | Ruta |
|---|---|
| editar | `src/frontend/features/tools/boards/toolbars/islandStyles.ts` (escala, radios, estado activo) |
| crear | `…/toolbars/IconButton.tsx` (primitivo botón-icono) |
| crear | `…/toolbars/Popover.tsx` (contenedor flotante) |
| crear | `…/toolbars/RightRail.tsx` (rail derecho con secciones) |
| editar | `…/toolbars/InspectorIsland.tsx` (migra al rail / queda como sección) |
| editar | `…/toolbars/ToolIsland.tsx` (modos vs crear, espaciado uniforme) |
| editar | `…/toolbars/TopBar.tsx` (gaps + divisor) |
| editar | `…/toolbars/ZoomIsland.tsx` (radios/tamaños coherentes) |
| editar | `…/toolbars/DimensionsFooter.tsx` (consistencia) |
| editar | `…/boards/BoardEditor.tsx` (empty state con chips, montaje del rail) |
| editar | `src/frontend/features/workspaces/carnaval/board/CarnavalOverlays.tsx` (ACREDITAR al rail; fin de colisión) |
| editar (opc.) | `docs/frontend/design-system.md` (documentar escala de islas/radios) |

## Orden sugerido

1. Fundamentos: escala en `islandStyles`, `IconButton`, `Popover`.
2. B (popover de escala) → elimina el desborde y limpia el rail.
3. A (rail derecho con secciones) → resuelve competencia/colisión.
4. C, D, E → modos/crear, estado activo, TopBar.
5. F, G, H, I → empty state, aire, selector de vista, iconografía.

## Verificación

1. `npx tsc --noEmit` y `npx eslint` de los archivos tocados sin errores.
2. `npm run dev` → abrir un plano Carnaval y un board libre:
   - Isla/rail derecho **no se corta**; cm en popover; ACREDITAR **no se superpone**.
   - Estado activo de herramienta claramente distinguible; modos vs crear legibles.
   - Espaciado uniforme en ambas barras; islas con aire respecto al lienzo.
   - Empty state muestra los chips y funcionan.
3. Responsive (ventana angosta): islas/rail no desbordan ni se solapan.
4. Comparar contra la captura original: desaparece el "amontonamiento".
5. Foco por teclado y contraste en todos los controles (incluidos rail, popover, chips).

---
title: "Plan: Rediseño coherente de las herramientas de imagen (Recorte · Quitar fondo · Cuadrícula)"
audience: dev, ai-agent
status: draft
updated: 2026-06-02
owner: TBD
---

# Plan: Diseño coherente de las 3 herramientas de imagen

> Objetivo: que **Recorte**, **Quitar fondo** (hermano de Recorte) y **Cuadrícula de
> referencia** —tres herramientas muy parecidas que comparten flujo y elementos— se
> vean y se usen como **una familia**, con un sistema visual común y mejor UI/UX.
> **Autocontenido** (incluye contexto para ejecutarse en otra IA).

## Contexto

Proyecto **ArtSanctuary** (Next 16 App Router, Tailwind v4 con tokens CSS
`var(--color-*)`, `var(--radius-*)`, `var(--spacing-*)`). i18n vía `t('ns.key')`
(`usePreferences()` en cliente). Las tres superficies:

- `/dashboard/tools/crop` → `CropScreen` con **2 pestañas**: `CropTool` (recorte
  manual) y `CutoutTool` (quitar fondo).
- `/dashboard/tools/grid` → `ReferenceGridScreen`.

Las tres ya viven dentro del **shell compartido** `AppShell` →
`ToolActiveLayout` (mini-sidebar de herramientas + lienzo). **El problema no es el
shell**, son los **toolbars, stages y patrones internos**: cada herramienta los
construyó por su cuenta.

> Relación: las 3 ya están i18n-izadas (planes F2). Los componentes nuevos de este
> rediseño **deben conservar** `t('…')`; añadir claves a un namespace `tools.*`
> compartido cuando proceda.

## Diagnóstico — incoherencias medidas

| Aspecto | Recorte (`CropTool`) | Quitar fondo (`CutoutTool`) | Cuadrícula (`GridControls`) |
|---|---|---|---|
| Contenedor toolbar | `px-4 py-2.5` | `px-4 py-2.5` | `px-[var(--spacing-grid-gutter)] py-2.5` |
| Botón "cambiar foto" | **IMAGEN**, relleno primario | **CAMBIAR FOTO**, outline | **CAMBIAR FOTO**, outline |
| Undo/redo | **No existe** (sin historial) | undo/redo | undo/redo |
| Agrupación de controles | sueltos + divisores | sueltos + divisores | **Clusters** etiquetados (Medidas/Estilo) |
| Medidas Ref/Final | en toolbar (derecha) | en toolbar (derecha) | en **footer** (2 cajas) |
| Acción exportar | **EXPORTAR** | **EXPORTAR PNG** | **EXPORTAR** |
| Enviar a… | Boards + Cuadrícula | Boards + Cuadrícula | solo Boards |
| Empty state | "…para recortar" | damero + "Sube o elige…" | marco + "Sube o elige…" |
| Footer métricas | no | no | sí |

**Resumen**: mismos conceptos (fuente de imagen, historial, herramienta-específico,
medidas, enviar/exportar) presentados con **estilos, posiciones y etiquetas
distintas**, y con **paridad de features rota** (Recorte sin undo/redo).

## ⛔ Requisito duro: CERO scrollbars

**Por nada del mundo** puede aparecer una barra de desplazamiento (horizontal ni
vertical) en estas herramientas. Si aparece un scrollbar, **el diseño está mal** y hay
que rehacerlo. Implicaciones:

- El toolbar **NO** usa `overflow-x-auto` como muleta. Debe **distribuirse** para caber
  siempre: `flex-wrap` (saltar a 2ª fila), **o** un patrón de prioridad con un menú
  "más" (overflow menu) que **no** scrollea, **o** colapsar etiquetas a solo-icono en
  pantallas chicas.
- El lienzo (`ToolStage`) ocupa el alto disponible sin generar scroll: `min-h-0`,
  `overflow-hidden`, contenido `contain`/centrado dentro del marco.
- Nada de `overflow-x-auto`/`overflow-y-auto` en toolbar, footer ni stage. Permitido
  `overflow-hidden` (recortar), nunca `auto`/`scroll`.
- Verificación: a anchos 1280/1024/768 px y con el sidebar de herramientas abierto, las
  3 superficies **no** muestran scrollbar. Es criterio de aceptación.

## Principios de diseño (la familia)

1. **Misma anatomía en las 3**: `[ Fuente + Historial ] · [ Controles de la
   herramienta, en clusters ] · [ Medidas ] · [ Acciones de salida ]`.
2. **Toolbar que SIEMPRE cabe** (ver requisito duro): una fila que envuelve o colapsa,
   nunca scrollea. Mismos paddings/tokens y divisores.
3. **Primitivas compartidas, no copys**: un set de componentes reutilizado por las 3.
4. **Paridad de features**: si una tiene undo/redo, las tres lo tienen (Recorte gana
   historial).
5. **Medidas en un único lugar** (recomendado: **footer compartido** `MeasureBar`,
   liberando el toolbar). Coherente y deja sitio a controles.
6. **Etiquetas y acciones unificadas** (un solo "EXPORTAR", iconografía y orden
   idénticos).
7. **Damero de transparencia** como fondo de lienzo en las que manejan alfa
   (Quitar fondo sí; Recorte/Cuadrícula opcional).

## Sistema de componentes (a crear en `features/tools/shared/workspace/`)

Carpeta nueva con primitivas que las 3 herramientas consumen:

```
features/tools/shared/workspace/
  ToolWorkspace.tsx     # layout: <Toolbar/> + <Stage/> + <MeasureBar/> + modal slot
  ToolToolbar.tsx       # contenedor de la barra (padding/scroll/divisores estándar)
  ToolButton.tsx        # variantes: 'ghost' | 'primary' | 'icon' | 'toggle' | 'action'
  ToolCluster.tsx       # grupo etiquetado (como el Cluster de grid, generalizado)
  ToolSlider.tsx        # icono + range + valor (tolerancia/pincel/opacidad)
  ToolSelect.tsx        # select con estilo unificado (aspecto, modelo IA)
  SourceButton.tsx      # "Cambiar foto" (mismo label/estilo en las 3)
  HistoryButtons.tsx    # undo/redo (atajos Ctrl+Z/Ctrl+Shift+Z, disabled por pilas)
  SendActions.tsx       # Boards / Cuadrícula / Exportar (orden e iconos fijos)
  MeasureBar.tsx        # footer: Referencia + Final (formatCm/formatScaled)
  ToolStage.tsx         # lienzo: damero opcional + empty-state estándar + slot
  EmptyState.tsx        # icono + prompt (un solo patrón; texto por prop)
```

### Especificación clave

- **ToolButton** (un único origen de verdad de estilos):
  - `ghost`: borde outline-variant, hover primary (acciones secundarias).
  - `primary`: relleno primario (acción principal de la herramienta).
  - `icon`: cuadrado 40×40 (undo/redo/reset/recenter).
  - `toggle`: activo = primary/10 + borde primario (varita/borrar/numerar).
  - `action`: relleno secondary-container (exportar / quitar fondo IA).
  - Props: `icon`, `label?`, `title`, `disabled`, `variant`, `active?`.
- **SourceButton**: SIEMPRE el mismo (recomendado **ghost** + label
  `t('tools.changePhoto')`). Elimina el "IMAGEN" relleno de Recorte.
- **HistoryButtons**: añade undo/redo a Recorte (hoy no tiene). Reutiliza la lógica
  de pilas (ver `useCutoutEditor`/`useGridHistory`).
- **MeasureBar** (footer): muestra `Referencia · {ref}` y `Final · {final}` con el
  mismo estilo en las 3. Sustituye las variantes de toolbar/footer.
- **SendActions**: orden fijo `[Volver al board | Boards] [Cuadrícula*] [Exportar]`.
  `Cuadrícula` se oculta en la propia Cuadrícula. Export label único
  `t('tools.export')`.
- **ToolStage**: `checker?: boolean`, `empty: ReactNode` (usa `EmptyState`),
  children = lienzo. Empty-state idéntico (icono grande + `t('tools.uploadPrompt')`).

## Layout objetivo (las 3 iguales)

```
┌──────────────────────────────────────────────────────────────┐
│ ToolToolbar:  [SourceButton] | [Undo][Redo] | <clusters tool> · [SendActions] │
├──────────────────────────────────────────────────────────────┤
│ ToolStage  (damero si alfa; empty-state estándar)            │
├──────────────────────────────────────────────────────────────┤
│ MeasureBar:  Referencia · A×Al      Final · A×Al   (+ extra)  │
└──────────────────────────────────────────────────────────────┘
```

- **Recorte**: clusters = `Proporción` (select) + `Auto-crop` (toggle + tolerancia +
  pad) + `Restablecer` (icon). + historial nuevo.
- **Quitar fondo**: clusters = `IA` (modelo + Res.original + Quitar fondo) +
  `Pincel` (varita/borrar/restaurar + tolerancia/tamaño) + `Ajustar` (icon).
- **Cuadrícula**: clusters = `Medidas` (ancho/cuadro/presets) + `Estilo` (opacidad/
  color/numerar) + `Centrar` (icon). MeasureBar muestra además `cols×rows`, `lienzo`,
  `zoom`.

## Fases (un PR por fase, build + tsc + tests verdes)

- **F0 — Primitivas.** Crear `workspace/*` (ToolButton, ToolToolbar, ToolCluster,
  ToolSlider, ToolSelect, SourceButton, HistoryButtons, SendActions, MeasureBar,
  ToolStage, EmptyState) + namespace i18n `tools.*` con las claves compartidas. Sin
  cambiar aún las herramientas (o migrar **una** como piloto).
- **F1 — Cuadrícula** (la más ordenada hoy): reescribir `GridControls`/footer sobre
  las primitivas. Valida el sistema.
- **F2 — Quitar fondo**: `CutoutToolbar`/`CutoutStage` sobre primitivas + `MeasureBar`.
- **F3 — Recorte**: `CropTool` sobre primitivas; **añadir undo/redo** (paridad);
  unificar empty-state, export label y acciones.
- **F4 — Pulido UI/UX**: estados hover/focus accesibles, `aria-label` en todos los
  icon-buttons, foco visible, responsive (overflow-x con sombra de scroll), tooltips
  consistentes, animaciones sutiles de entrada de paneles, modo damero coherente.

## UI/UX — mejoras concretas

- **Jerarquía**: acción principal de cada herramienta en `primary`; salidas en
  `action`; el resto `ghost`/`icon`. Hoy compiten varios rellenos.
- **Agrupación cognitiva**: clusters etiquetados en las 3 (no controles sueltos).
- **Feedback de estado**: spinner/disabled coherente en export/enviar (ya parcial).
- **Atajos**: Ctrl+Z/Ctrl+Shift+Z en las 3 (Recorte gana historial); documentarlos
  en tooltips.
- **Empty-state**: un solo patrón, mismo icono-acción “subir/elegir”.
- **Accesibilidad**: `aria-label` en icon-only (varios faltan), foco visible,
  contraste AA en chips/badges.
- **Responsive sin scroll** (requisito duro): el toolbar **envuelve** (`flex-wrap`) o
  **colapsa** etiquetas a icono / mueve clusters de baja prioridad a un menú "más" que
  no scrollea. Prohibido `overflow-x-auto`.

## Métrica de éxito

- Las 3 superficies comparten **toolbar, stage, empty-state, medidas y acciones**
  (mismos componentes `workspace/*`).
- **Paridad de features** (las 3 con historial, mismas salidas, mismo export).
- 0 estilos duplicados de botón/toolbar entre las herramientas (un solo `ToolButton`).
- i18n intacto (`t('…')`), `tsc` + tests verdes, comportamiento preservado.
- Revisión visual: un usuario percibe las 3 como la misma familia.

## Fuera de alcance

- No cambia la **lógica** de cada herramienta (canvas, IA, geometría) — solo su
  **presentación** y la **paridad de features** (historial en Recorte).
- No toca el shell `ToolActiveLayout` ni el routing.
- No migra copy nuevo a i18n más allá del namespace `tools.*` que introduzcan las
  primitivas (coordinar con planes i18n F3–F5).

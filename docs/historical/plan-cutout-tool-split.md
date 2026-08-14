> ✅ **Implementado.** `src/app/dashboard/tools/cutout/page.tsx` existe como
> ruta propia, separada de `crop/page.tsx`. Verificado y movido a
> `docs/historical/` el 2026-08-13.

# Plan — Separar "Quitar fondo" como herramienta propia

**Fecha:** 2026-06-08
**Relacionado:** `docs/pr/incompletos/plan-rediseno-tools-imagen.md` (ya trata Recorte / Quitar fondo / Cuadrícula como 3 tools hermanas; esto lo realiza).

> **Objetivo:** hoy **Recortar** y **Quitar fondo** viven en la MISMA ventana (`CropScreen` con 2 pestañas). Sacar **Quitar fondo (Cutout)** a su **propia herramienta**: entrada en el sidebar de herramientas + ruta propia. Recorte queda solo con recorte (sin pestañas).

---

## 1. Estado actual

- `CropScreen` (`crop/screens/CropScreen.tsx`) = pestañas **Crop** / **Cutout** → renderiza `CropTool` o `CutoutTool` (ambos ya existen, independientes).
- Ruta única `app/dashboard/tools/crop/page.tsx` → `CropScreen`.
- Sidebar: lista `tools` en `ToolActiveLayout.tsx` (1 entrada `crop`).
- Workspace: `app/dashboard/workspaces/[id]/tools/[tool]/page.tsx` mapea slug→Screen en `SCREENS` (sin `cutout`).
- Index de tools: `tools/screens/ToolsScreen.tsx` (tarjetas).
- i18n: `crop.tabCrop`/`tabCutout`; labels de tool en `ToolActiveLayout` (es/en) + `toolsDashboard.*`.

`CutoutTool` ya es autónomo (su propio editor `useCutoutEditor`, stage, toolbar, handoff a boards con `source`). Solo falta **darle puerta propia**.

---

## 2. Cambios

1. **Pantalla propia** `cutout/screens/CutoutScreen.tsx` (o reusar carpeta `crop/`): envuelve `CutoutTool` con el layout de tool (sin pestañas). Mínima — solo monta `CutoutTool`.
2. **Ruta** `app/dashboard/tools/cutout/page.tsx` → `export { default } from '…/CutoutScreen'`.
3. **`CropScreen` → solo recorte:** quitar la barra de pestañas y `CutoutTool`; renderizar solo `CropTool`. (O dejar `CropScreen` = `CropTool` directo.)
4. **Sidebar** (`ToolActiveLayout.tsx`): añadir a `tools` la entrada `{ title: toolLabels.cutout, href: '/dashboard/tools/cutout', icon: 'background_replace' }` (o `auto_fix_high`). Junto a `crop`.
5. **i18n labels de tool:** `toolLabels.cutout` en los mapas es/en del `ToolActiveLayout`.
6. **Workspace dynamic** (`[tool]/page.tsx`): `SCREENS.cutout = CutoutScreen` para que `/workspaces/<id>/tools/cutout` funcione scoped.
7. **Index de tools** (`ToolsScreen.tsx`): nueva tarjeta "Quitar fondo" → `/dashboard/tools/cutout`. i18n `toolsDashboard.cutoutTitle/cutoutDesc` es/en.
8. **i18n limpieza:** `crop.tabCrop`/`tabCutout` quedan sin uso (quitar) o reusar `tabCutout` como nombre de la nueva tool.
9. **Handoff/source:** verificar que `CutoutTool` envía a boards/grid con su `source` y que el round-trip (volver al board) sigue; la lógica de `ToolActiveLayout` para `/tools/<slug>` scoped ya cubre `cutout` genéricamente.

---

## 3. Compatibilidad / cuidados

- **Deep links viejos** a `/dashboard/tools/crop` con la pestaña Cutout: ya no existe la pestaña → caen en Recorte. Aceptable (no hay query de pestaña persistida). Si se quisiera, un redirect `?tab=cutout` → `/tools/cutout` (opcional, probablemente innecesario).
- **Active-state del sidebar:** `crop` y `cutout` son rutas distintas → el match exacto (`pathname === href`) ya las distingue. Sin colisión.
- **No romper handoff:** Crop y Cutout comparten patrón de envío (uploadCompressedBlob + handoff). Separar pantallas no toca esa lógica; solo cambia el contenedor.
- **Iconos:** Recorte `crop`, Quitar fondo `background_replace` (o `auto_fix_high`, el que usa hoy la pestaña).

---

## 4. Fases

- **C1 — Pantalla + ruta:** `CutoutScreen` + `app/.../cutout/page.tsx`. (Cutout accesible por URL directa.)
- **C2 — Sidebar + workspace:** entrada en `tools` (`ToolActiveLayout`) + `SCREENS.cutout` (workspace dynamic) + labels i18n.
- **C3 — Limpiar Crop:** quitar pestañas de `CropScreen` (solo `CropTool`); retirar claves `crop.tabCrop/tabCutout` si quedan huérfanas.
- **C4 — Index de tools:** tarjeta en `ToolsScreen` + `toolsDashboard.cutout*` es/en.

Cada fase: tsc + tests + i18n (es/en) + doctor. Verificar: abrir Quitar fondo desde el sidebar (global y dentro de workspace), enviar a boards, volver.

---

Relacionado: `src/frontend/features/tools/crop/{CutoutTool,CropTool}.tsx`, `crop/screens/CropScreen.tsx`, `ToolActiveLayout.tsx`, `app/dashboard/tools/`, `tools/screens/ToolsScreen.tsx`.

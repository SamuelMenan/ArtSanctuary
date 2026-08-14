# Plan — Hoist de la chrome a layouts + navegación ultra-suave

**Estado: ✅ EJECUTADO (2026-06-06).** `dashboard/layout.tsx` = `AppShell` +
`ToolActiveLayout` (chrome persistente para todo `/dashboard/*`). `ToolActiveLayout`
deduce `wsId` del pathname (`/dashboard/workspaces/<id>`) o `?ws`. Se quitó
`AppShell`/`ToolActiveLayout` de las ~14 screens (tools + workspaces + page del
board) → solo contenido. `template.tsx` queda dentro del layout → fade SOLO del
contenido. `ToolsScreen` y `ExpedienteScreen` envueltos en contenedor scrollable;
chrome con `print:hidden` (Sidebar/Navbar/rail) para no romper la impresión del
expediente. `next build` OK, 0 errores de lint.

**Fecha:** 2026-06-06
**Objetivo:** Que cambiar de herramienta/vista dentro de `/dashboard/*` se sienta
continuo — "casi ni parece que cambia". Hoy la chrome (sidebars + navbar) sigue
**re-montándose en cada navegación** y por eso parpadea (ej. el `<nav>` del sidebar
global reaparece con `transform:none` un instante antes de colapsar).

## Diagnóstico

- `ChromeProvider` ya está en la raíz (`Providers`) → el ESTADO persiste.
- **Pero** `AppShell` y `ToolActiveLayout` se montan **dentro de cada página**
  (cada screen hace `return <AppShell><ToolActiveLayout>…`). En el App Router, al
  navegar entre páginas hermanas, **la página se desmonta/re-monta** → con ella se
  destruye y recrea todo el DOM de la chrome. Resultado: parpadeo, scrollbar que
  salta, y animaciones que arrancan desde el estado final (no transicionan).
- La regla del App Router que resuelve esto: **un `layout.tsx` NO se re-monta** al
  navegar entre sus rutas hijas; solo cambia `{children}`. Si la chrome vive en un
  layout, queda montada y **solo el contenido cambia**.

## Principio de diseño (2 espacios)

El mini-sidebar de tools (`ToolActiveLayout`) ya muestra sus secciones según
`wsId`:
- **Sin workspace** → `HERRAMIENTAS` (todas las tools).
- **Con workspace** (`wsId`) → `WORKSPACE` + `VISTAS (proyecto)` + `HERRAMIENTAS`.

`wsId` puede deducirse de la propia URL (no hace falta pasar `projectId` por
props): `/dashboard/workspaces/<id>/…` → `id`; o `?ws=<id>` (handoff desde una
tool). Así, **una sola instancia** de `ToolActiveLayout` sirve a los dos espacios
y persiste entre TODA navegación de `/dashboard/*`.

## Arquitectura objetivo

```
src/app/dashboard/
  layout.tsx     ← NUEVO: <AppShell><ToolActiveLayout>{children}</ToolActiveLayout></AppShell>
  template.tsx   ← ya existe: fade del CONTENIDO (queda dentro del layout → no toca la chrome)
  tools/…/page   ← solo CONTENIDO (sin AppShell ni ToolActiveLayout)
  workspaces/…   ← solo CONTENIDO
```

Orden de anidación que da Next: `layout` (chrome, persistente) → `template` (fade,
re-monta por nav) → `page` (contenido). El fade pasa a aplicar **solo al contenido**,
no a los sidebars/navbar (que ya no se desmontan).

`ChromeProvider` (raíz) sigue gobernando visibilidad por ruta (`isImmersive`,
`isBoards`): en boards colapsa todo; en el resto muestra. Como la chrome ya no se
re-monta, esos cambios **transicionan** suaves de verdad.

## Cambios concretos

### 1. Crear `src/app/dashboard/layout.tsx`
```tsx
import AppShell from '@frontend/shared/layouts/AppShell'
import ToolActiveLayout from '@frontend/features/tools/shared/ToolActiveLayout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ToolActiveLayout>{children}</ToolActiveLayout>
    </AppShell>
  )
}
```
(Server component que importa client components — válido.)

### 2. `ToolActiveLayout` — derivar `wsId` de la URL
- Hoy: `wsId = projectId ?? searchParams.get('ws')`.
- Nuevo: además parsear `pathname` → si matchea `/dashboard/workspaces/<id>`,
  usar ese `id`. Prioridad: pathname (workspace real) > `?ws` (handoff) > none.
- `projectId` como prop pasa a ser **opcional/legacy** (el layout no lo pasa).
- El `useEffect` que fetchea el proyecto ya depende de `wsId` → sin cambios.
- Las secciones `WORKSPACE`/`VISTAS` ya dependen de `wsId`/`project` → automáticas.
- El `-m-[var(--spacing-container-padding)]` que cancela el padding de `AppShell`
  se mantiene (sigue dentro de `AppShell main`).

### 3. Quitar `AppShell` + `ToolActiveLayout` de las screens del dashboard
Cada screen pasa a renderizar **solo su contenido** (lo que hoy va dentro de
`ToolActiveLayout`). Lista:

**Tools** (`features/tools/*/screens`):
- `screens/ToolsScreen.tsx` (índice) — quitar `AppShell`. Pasa a vivir dentro del rail.
- `canon/CanonScreen.tsx`, `notan/NotanScreen.tsx`, `gesture/GestureScreen.tsx`,
  `grid/ReferenceGridScreen.tsx`, `crop/CropScreen.tsx`,
  `color-mixing/ColorMixScreen.tsx`, `boards/BoardsListScreen.tsx`,
  `boards/screens/BoardEditorScreen.tsx`.

**Workspaces** (`features/workspaces/*/screens`):
- `shared/WorkspacesScreen.tsx` (lista), `carnaval/WorkspaceProjectScreen.tsx`,
  `carnaval/RecursosCulturalesScreen.tsx`, `carnaval/ExpedienteScreen.tsx`
  (hoy sin chrome → gana consistencia).

**Pages inline:**
- `app/dashboard/workspaces/[id]/boards/[boardId]/page.tsx` — hoy hace
  `<AppShell><ToolActiveLayout projectId={id}><BoardEditor/></…>`. Pasa a solo
  `<BoardEditor boardId={boardId} />` (el layout aporta la chrome; `wsId` sale del
  pathname). Mantener el `dynamic(ssr:false)` de Konva.
- `app/dashboard/tools/boards/[id]/page.tsx` → idem si aplica.

> Nota: las screens que reciben `projectId` por props (workspace) lo siguen usando
> para SU contenido (fetch del proyecto). Solo se quita el wrapper de chrome.

### 4. `BoardEditor.tsx`
Verificar su uso de `ToolActiveLayout`/chrome (aparece en el grep). Si solo lee
`useChrome`, sin cambios. Si renderiza estructura de chrome, ajustar.

### 5. `template.tsx` (ya existe)
Queda igual: al estar **dentro** del nuevo layout, su fade afecta solo al
contenido. Opcional: subir de `transition.fast` a un fade+slide muy corto
(≤6px) para reforzar continuidad, respetando tokens.

### 6. Pulido de transición (opcional, encima del hoist)
- Sidebar global: añadir resaltado activo por sección (hoy `isActive` no se usa)
  y `transition.base` coherente.
- Mantener `ChartCrossfade` (canon) y demás; ahora conviven con chrome estable.
- `scrollbar-gutter: stable` ya aplicado al rail; replicar en el `main` si el
  scroll del contenido provoca salto.

## Qué NO se toca
- Páginas fuera de `/dashboard` (home, gallery, explore, profile, settings,
  collections, upload): siguen con su propio `<AppShell>`. No se hoistean (evita
  refactor global de 22 archivos y mantener login/register sin chrome).
- `ChromeProvider` (ya en raíz). `MotionConfig` (en `AppShell`).

## Riesgos y mitigaciones
- **Índices con rail:** `tools` y `workspaces` (listas) pasan a mostrar el rail de
  iconos. Es consistente con el resto; si molesta, condicionar secciones por ruta.
- **Padding/scroll:** verificar que cada screen, ahora como contenido directo del
  `section` de `ToolActiveLayout`, scrollee bien (varias ya usan
  `flex-1 overflow-y-auto`).
- **Board inmersivo:** `ChromeProvider.isBoards` ya colapsa todo; al no re-montar,
  la entrada/salida del modo boards transiciona (mejor que hoy).
- **`wsId` por pathname:** cubrir exactamente `/dashboard/workspaces/<id>` (y
  subrutas) sin falsos positivos con la lista `/dashboard/workspaces`.
- **SSR/`useSearchParams`:** ya tolerado (rutas dashboard son dinámicas; build OK).

## Pasos de ejecución (orden seguro)
1. `ToolActiveLayout`: añadir derivación de `wsId` por pathname (compatible con
   el `projectId` prop actual). Verificar que nada se rompe aún con wrappers.
2. Crear `dashboard/layout.tsx`.
3. Migrar screens 1 por 1 quitando `AppShell`/`ToolActiveLayout` (empezar por una
   tool simple, p.ej. `grid`, probar; luego el resto; luego workspaces; al final
   boards y la page inline del board de workspace).
4. Ajustar `template.tsx` si se quiere fade+slide.
5. (Opcional) resaltado activo en Sidebar global.
6. Verificar: `tsc`, `eslint`, `npm test` (i18n+vitest), `next build`, y prueba
   manual de navegación tool↔tool, workspace↔vista, y handoff (tool con `?ws`).

## Resultado esperado
- Sidebars y navbar **no se re-montan**: cambiar de herramienta solo intercambia el
  contenido (con fade). Sin parpadeo del `<nav>`, sin salto de scrollbar.
- Los 2 espacios siguen correctos: `HERRAMIENTAS` solo, o `WORKSPACE + VISTAS +
  HERRAMIENTAS` según la URL.
- Sensación de app nativa: las animaciones existentes (slide de chrome, crossfade
  de figura) por fin transicionan sobre una estructura estable.

---
Relacionado: `docs/pr/incompletos/plan-chrome-animations.md`. Implementación previa: ChromeProvider
raíz + rail por defecto + `dashboard/template.tsx` (ya en código).

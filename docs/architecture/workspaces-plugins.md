---
title: "Arquitectura de plugins de Workspaces"
audience: dev, ai-agent
status: stable
updated: 2026-08-14
owner: TBD
---

# Arquitectura de plugins de Workspaces

Cómo un "tipo de workspace" (Libre, Carnaval) extiende el editor de tableros
sin que el motor sepa nada de él.

> **Por qué existe este doc:** hasta 2026-08-14 este subsistema no estaba
> documentado en `docs/` en absoluto. La única referencia era
> `src/frontend/features/workspaces/README.md`, que tenía 5 afirmaciones
> incorrectas (ver §6). Nadie podía deducir el diseño sin leer los 3 registros.

## 1. Lo primero que hay que saber: hay TRES registros, no uno

Es la fuente principal de confusión. No se importan entre sí, no comparten
tipos, y no hay nada que garantice que estén sincronizados.

| | Dominio | UI de la landing | Extensión de lienzo |
|---|---|---|---|
| **Archivo** | `src/shared/lib/workspaces/registry.ts` | `src/frontend/features/workspaces/shared/workspaceRegistry.ts` | `src/frontend/features/tools/boards/extensions/registry.ts` |
| **Entidad** | `WorkspaceDomain` | `WorkspaceUiPlugin` | `BoardExtension` |
| **Clave** | `WorkspaceKind` (`'free'\|'carnaval'`) | `id: string` **sin tipar** | `BoardWorkspaceKind` (`'free'\|'carnaval'`) |
| **Cómo se registra** | eager, editando el propio archivo | array literal con imports directos | side-effect (`registerBoardExtension`) |
| **¿React?** | ❌ prohibido, debe ser puro | ✅ | ✅ |
| **Quién lo consume** | `BoardEditor` (escala) | `WorkspacesScreen`, `ToolActiveLayout` | `BoardEditor` (slots) |

Conceptualmente el dominio es la base pura y la UI compone sobre él, pero **en
código la única conexión es indirecta**: tanto `carnavalPlugin` (UI) como
`carnavalDomain` (dominio) importan de `@shared/lib/workspaces/carnaval`.

## 2. Los 7 slots de `BoardExtension`

Definidos en `src/frontend/features/tools/boards/extensions/boardExtension.ts`.
**Todos opcionales salvo `kind`.** `Host.tsx` los resuelve y degrada a
null/passthrough si faltan — un workspace sin extensión (el caso de Libre) da
un lienzo limpio, sin errores.

| Slot | Qué es | Dónde se renderiza | Si falta |
|---|---|---|---|
| `Provider` | Estado UI compartido | envuelve stage + islas + rail + overlays | passthrough (`<>{children}</>`) |
| `Layers` | Capa **Konva**, dentro del `<Stage>` | `BoardStage` | `null` |
| `Overlays` | Capa **HTML**, sobre el lienzo | `BoardEditor` | `null` |
| `WorkspaceActions` | Sección inferior del rail derecho | `RightRail` vía `workspaceSlot` | la sección no se pinta |
| `snapLines` | Líneas-imán extra al redimensionar | `snapEdge` | `{ x: [], y: [] }` |
| `gridSquareCm` | cm/cuadro que impone el workspace | escribe `background.squareCm` | `0` = sin imposición |
| `suppressBaseGrid` | Apaga el grid uniforme del motor | `GridLayer` | `false` |

**No existe un slot `Inspector`.** El inspector de Carnaval es interno: lo
renderiza `CarnavalOverlays` y su botón lo pone `CarnavalWorkspaceActions`,
comunicándose por el contexto propio de Carnaval. El motor no lo conoce.

## 3. Cómo el motor consume la extensión sin conocer el tipo

1. `BoardEditor` resuelve `getBoardExtension(workspace.kind)` — **único** punto
   de resolución.
2. Construye un `BoardExtSlotProps` con estado y callbacks **genéricos**
   (`objects`, `scale`, `addObject`, `patchSelected`…).
3. Los componentes se renderizan **por referencia**, nunca por import:
   `const Layers = extension?.Layers; return Layers ? <Layers {...slot}/> : null`.
4. Los hooks de datos se invocan como funciones puras:
   `extension?.snapLines?.(extSlot) ?? { x: [], y: [] }`.
5. La extensión solo puede insertar objetos vía `slot.addObject(obj)` con
   `Omit<BoardObject,'id'|'z'>` — el motor asigna `id` y `z`.

No hay ni un `if (kind === 'carnaval')` en el motor. El único acoplamiento de
tipos que queda es un `import type` puro de `CarnavalModality`/`CarnavalPlano`
en `shared/lib/boards/types.ts`, sin dependencia en runtime.

## 4. Invariantes — lo que se rompe en silencio

Ordenados por cuánto cuesta descubrirlos:

1. **El registro es por side-effect.** Si una ruta olvida
   `import '@frontend/features/workspaces'`, el board de Carnaval se abre
   **sin guías, sin errores y sin aviso**. Hoy solo 3 páginas hacen ese import.
   Es exactamente el fallo relatado en
   [ADR-0006](../adr/0006-vercel-blob-konva-transformer.md).
2. **`Provider` es obligatorio si algún otro slot usa el contexto.** `Layers`
   (Konva) y `Overlays` (HTML) viven en árboles de render distintos; solo
   coinciden porque el Provider envuelve ambos. `useCarnavalBoard` lanza fuera
   del Provider.
3. **El orden de anidamiento en `BoardEditor` es load-bearing.**
   `BoardStage`, `ToolIsland`, `RightRail` y los overlays van **dentro** del
   Provider; `ZoomIsland` y el panel de capas van **fuera**. Mover un
   componente entre esas dos zonas rompe el contexto.
4. **`gridSquareCm` debe ser puro y estable.** Su resultado se escribe en
   `background.squareCm`, que vuelve al slot, que alimenta `snapLines`. Una
   función no determinista = bucle de render infinito. El único guard es un
   `Math.abs(diff) > 1e-6`.
5. **`snapLines` y `suppressBaseGrid` se ejecutan en cada render**, sin
   `useMemo`. Deben ser baratas y sin efectos.
6. **`snapLines` devuelve px de MUNDO, no de pantalla.** `x` = verticales,
   `y` = horizontales.
7. **Hay dos unions duplicados que hay que editar a la vez:** `WorkspaceKind`
   (`shared/lib/workspaces/types.ts`) y `BoardWorkspaceKind`
   (`shared/lib/boards/types.ts`). Nada los liga.
8. **Toda extensión debe tolerar `workspace.modality === undefined`.** El mismo
   `BoardExtension` corre en boards sueltos sin modalidad; los 5 puntos de
   entrada de Carnaval empiezan comprobándolo.

## 5. La trampa de los ids

**`librePlugin.id === 'libre'`, pero el union usa `'free'`.** Son espacios de
nombres distintos que nadie concilia:

- `WorkspaceUiPlugin.id` es `string` **sin tipar** → un typo (`'carnabal'`)
  compila, `getWorkspaceUi` devuelve `undefined`, y la card cae a valores por
  defecto en silencio.
- `WorkspacesScreen` llama `getWorkspaceUi(p.kind)` con el `kind` que viene del
  **documento de proyecto de la API**, no del `BoardWorkspace.kind`.

Además: **la landing es data-driven pero las rutas y la API no.**
`WorkspacesScreen` hace fetch hardcodeado a `/api/carnaval-projects`, y
`/dashboard/workspaces/[id]/page.tsx` importa directamente la pantalla de
Carnaval. Un tipo nuevo aparecería en el selector pero navegaría a Carnaval.

## 6. Añadir un tipo de workspace nuevo

No hay un solo paso de registro. Según lo que necesite, toca 1, 2 o los 3:

1. **Dominio** (si necesita escala propia): implementar `WorkspaceDomain` y
   añadir la llamada `registerWorkspaceDomain(...)` **editando**
   `shared/lib/workspaces/registry.ts` — no hay auto-registro.
2. **UI de la landing**: implementar `WorkspaceUiPlugin` y añadirlo al array
   `REGISTRY` de `workspaceRegistry.ts` (el orden del array = orden en el
   selector). Un plugin con `enabled: true` y sin `createProject` es un **no-op
   silencioso**.
3. **Extensión de lienzo** (si dibuja algo en el board): implementar
   `BoardExtension`, llamar `registerBoardExtension(...)` desde el `index.ts`
   del plugin, y añadir `import './<tipo>'` en
   `features/workspaces/index.ts`.
4. Añadir el literal a **ambos** unions (§4.7).

### Regla de dependencias

`boards` → su propia interfaz · `workspaces/<tipo>` → `boards` + `shared` ·
**nunca** `boards` → `workspaces/<tipo>` ni `workspaces/A` → `workspaces/B`.
No hay lint rule que lo imponga: es convención en comentarios.

## Deuda conocida

- **`BoardExtSlotProps.lateralMirrorEnabled` es una fuga de dominio**:
  concepto de Carnaval dentro de la interfaz genérica, con lógica dependiente
  ya en `BoardEditor`.
- `src/frontend/features/workspaces/README.md` tenía 5 errores (función
  inexistente `registerWorkspaceUi`, registro ubicado en el fichero
  equivocado, `extension.tsx` en vez de `.ts`, y omitía 4 de los 7 slots).
  Corregido el 2026-08-14 para que apunte aquí.
- La capa de grid híbrido de Carnaval está apagada de facto — ver
  [`../ops/known-issues.md`](../ops/known-issues.md#5).

## Última verificación

- Fecha: 2026-08-14
- Commit: HEAD
- Verificado leyendo los 3 registros, `boardExtension.ts`, `Host.tsx`, los
  `ui.ts`/`index.ts` de ambos plugins y los dos unions. La ausencia de
  `registerWorkspaceUi` confirmada con `grep` en todo `src/` (0 definiciones).

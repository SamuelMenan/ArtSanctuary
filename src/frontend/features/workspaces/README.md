# Workspaces

Sistema de tipos de workspace (Libre, Carnaval, y a futuro Escultura, Diseño de
Personajes, Arte-Terapia…). Cada tipo es un **plugin autocontenido**. El motor
de lienzo (`features/tools/boards`) es agnóstico: no conoce ningún tipo concreto.

> 📖 **Documentación completa** (los 3 registros, los 7 slots, invariantes que
> rompen en silencio): [`docs/architecture/workspaces-plugins.md`](../../../../docs/architecture/workspaces-plugins.md).
> Este README es el resumen de orientación dentro del código.

## Arquitectura (contrato + composición, NO herencia)

```
features/tools/boards/extensions/   ← el motor define el punto de extensión
  boardExtension.ts   BoardExtension (7 slots: Provider?, Layers?, Overlays?,
                      WorkspaceActions?, snapLines?, gridSquareCm?,
                      suppressBaseGrid?) + BoardExtSlotProps
  registry.ts         register/getBoardExtension
  Host.tsx            BoardExtProvider / BoardExtLayers / BoardExtOverlays /
                      BoardExtWorkspaceActions

shared/lib/workspaces/              ← dominio puro (sin React)
  types.ts  registry.ts (workspaceScaler)  carnaval/ (rules, validate, views, planos, domain)

features/workspaces/                ← UI + plugins por tipo
  index.ts            importa cada plugin (side-effect = registro). Único sitio que lista tipos.
  shared/
    workspacePlugin.ts     define la interfaz WorkspaceUiPlugin
    workspaceRegistry.ts   el registro en sí (array REGISTRY + getWorkspaceUi)
    screens/WorkspacesScreen.tsx   landing genérica: itera allWorkspaceUi(), no nombra tipos
  carnaval/
    index.ts          registra extensión de lienzo + plugin de UI
    ui.ts             WorkspaceUiPlugin (card, variants=modalidades, createProject)
    board/            extension.ts + context + CarnavalLayers/Overlays + Guide/Base/Alerts/Inspector
    lib/              carnavalGuide, carnavalInspect, humanFigure (+tests)
    screens/          WorkspaceProjectScreen, ExpedienteScreen
  libre/              stub (ui.ts enabled:false, sin extensión de lienzo)
```

**Dirección de dependencias:** `boards → (su propia interfaz)`. `workspaces/<tipo> →
boards + shared`. La capa app (rutas) hace el `import '@frontend/features/workspaces'`
(composition root). NUNCA `boards → workspaces`, NUNCA `workspaces/A → workspaces/B`.

## Cómo agregar un tipo nuevo (p. ej. Escultura)

1. **Dominio** (si tiene reglas/escala propias): `shared/lib/workspaces/escultura/`
   con su `domain.ts` (scaler) y regístralo en `shared/lib/workspaces/registry.ts`.
   Añade `'escultura'` al union `WorkspaceKind`.
2. **Carpeta del plugin**: `features/workspaces/escultura/`.
3. **UI plugin**: `escultura/ui.ts` exporta un `WorkspaceUiPlugin`
   (`{ id, enabled, meta, variants?, createProject?, card }`) y hay que
   **añadirlo al array `REGISTRY`** de `shared/workspaceRegistry.ts` con su
   import. No hay función `registerWorkspaceUi()`. Esto lo hace aparecer en la
   landing solo.
4. **Extensión de lienzo** (opcional, si dibuja guías): `escultura/board/extension.ts`
   con los slots que necesite; regístrala en `escultura/index.ts` vía
   `registerBoardExtension`. Si no dibuja nada, omítela (lienzo limpio).
5. **Screen de proyecto**: `escultura/screens/EsculturaProjectScreen.tsx` + su ruta.
6. **Engancha**: añade `import './escultura'` en `features/workspaces/index.ts`.
7. **Añade el literal a AMBOS unions**: `WorkspaceKind`
   (`shared/lib/workspaces/types.ts`) y `BoardWorkspaceKind`
   (`shared/lib/boards/types.ts`). Están duplicados y nada los liga.

Cero cambios en `boards`, en `WorkspacesScreen` ni en los otros plugins.

> ⚠️ El `id` del plugin de UI y el literal del union **no comparten espacio de
> nombres**: hoy `librePlugin.id === 'libre'` mientras el union usa `'free'`.
> `WorkspaceUiPlugin.id` es `string` sin tipar, así que un typo no falla en
> compilación — cae a `undefined` en silencio.

> Nota: el modelo/colección de proyectos y la API `/api/carnaval-projects` se
> conservan por compatibilidad; conceptualmente es un "Project" genérico —
> también lo usa el Workspace Libre (`kind: 'libre'`).

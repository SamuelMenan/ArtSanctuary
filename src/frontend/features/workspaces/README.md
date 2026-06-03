# Workspaces

Sistema de tipos de workspace (Libre, Carnaval, y a futuro Escultura, Diseño de
Personajes, Arte-Terapia…). Cada tipo es un **plugin autocontenido**. El motor
de lienzo (`features/tools/boards`) es agnóstico: no conoce ningún tipo concreto.

## Arquitectura (contrato + composición, NO herencia)

```
features/tools/boards/extensions/   ← el motor define el punto de extensión
  boardExtension.ts   BoardExtension { Provider?, Layers?, Overlays? } + BoardExtSlotProps
  registry.ts         register/getBoardExtension
  Host.tsx            BoardExtProvider / BoardExtLayers / BoardExtOverlays

shared/lib/workspaces/              ← dominio puro (sin React)
  types.ts  registry.ts (workspaceScaler)  carnaval/ (rules, validate, views, planos, domain)

features/workspaces/                ← UI + plugins por tipo
  index.ts            importa cada plugin (side-effect = registro). Único sitio que lista tipos.
  shared/
    workspacePlugin.ts   WorkspaceUiPlugin (landing data-driven) + registry
    screens/WorkspacesScreen.tsx   landing genérica: itera allWorkspaceUi(), no nombra tipos
  carnaval/
    index.ts          registra extensión de lienzo + plugin de UI
    ui.ts             WorkspaceUiPlugin (card, variants=modalidades, createProject)
    board/            extension.tsx + context + CarnavalLayers/Overlays + Guide/Base/Alerts/Inspector
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
3. **UI plugin**: `escultura/ui.ts` → `registerWorkspaceUi({ id:'escultura', enabled, meta,
   variants?, createProject?, card })`. Esto lo hace aparecer en la landing solo.
4. **Extensión de lienzo** (opcional, si dibuja guías): `escultura/board/extension.tsx`
   con `Layers`/`Overlays`/`Provider`; regístrala en `escultura/index.ts` vía
   `registerBoardExtension`. Si no dibuja nada, omítela (lienzo limpio).
5. **Screen de proyecto**: `escultura/screens/EsculturaProjectScreen.tsx` + su ruta.
6. **Engancha**: añade `import './escultura'` en `features/workspaces/index.ts`.

Cero cambios en `boards`, en `WorkspacesScreen` ni en los otros plugins.
```

> Nota: el modelo/colección de proyectos y la API `/api/carnaval-projects` se
> conservan por compatibilidad; conceptualmente es un "Project" genérico.

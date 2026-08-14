---
title: "Plan i18n F3: migrar Boards a i18n"
audience: dev, ai-agent
status: draft
updated: 2026-06-01
owner: TBD
---

# Plan i18n F3 — Boards (lienzo infinito)

> Fase 3 del [`plan-i18n-maestro.md`](./plan-i18n-maestro.md). **Autocontenido**:
> incluye todo el contexto para ejecutarse sin sesión previa.

## Contexto (qué venimos haciendo)

Proyecto **ArtSanctuary** (Next 16 App Router, Mongo/Mongoose, Auth.js). Estamos
eliminando el **copy español hardcodeado**: todo el texto visible debe salir de
`t('namespace.key')`. Ya hechos: **F1 validaciones**, **F2 crop + grid** (commits
`233cfff`, `e5aad68`, `a369a83`, `0fe6fed`). Esta fase migra **Boards**, el módulo
más grande.

### Sistema i18n (cómo funciona)
- `src/shared/i18n/index.ts` — API **client-safe** (NO importa diccionarios):
  `createTranslator`, `loadDictionary`, `translateFields`, tipos, `Locale`.
- `src/shared/i18n/dictionaries.ts` — **server-only**: `getDictionary(locale)` (síncrono).
- `src/shared/i18n/messages/es.ts` y `en.ts` — diccionarios por idioma (**hay que
  editar AMBOS**, mismas claves). Namespaces actuales: `common, nav, menu, home,
  gallery, explore, profile, settings, sidebar, upload, auth, modal, validation,
  crop, grid`.
- **Cliente**: `const { t } = usePreferences()` desde
  `@frontend/shared/providers/AppPreferencesProvider`. Uso: `t('boards.save')`.
- **Servidor (RSC sin 'use client')**: `createTranslator(getDictionary(locale))`
  con `getDictionary` desde `@shared/i18n/dictionaries`.
- **Interpolación**: `{{var}}` en el valor; `t('k', { var })` al usar.
- **Mapas de error de campo** (validación): `translateFields(fields, t)` desde `@shared/i18n`.

### Reglas (decididas por el equipo)
- **NO se traducen los comentarios** (trabajo innecesario; se conservan en español).
- Identificadores/logs → inglés (oportunista, mismo PR).
- **No** tocar claves persistidas en BD ni nombres de campos de API.
- El valor **ES** debe quedar **idéntico** (el usuario es no ve cambios); solo se
  mueve a i18n y se añade el **EN** correcto.
- Los **nombres de iconos** de `material-symbols-outlined` (p. ej. `>undo<`,
  `>dashboard<`) **NO son copy** — no tocar.

### Verificación por archivo/commit
- `npx tsc --noEmit` → 0 errores.
- `npx vitest run` → 28 tests verdes.
- `npm run i18n:scan` → debe bajar (objetivo final 0). **OJO**: el scan
  **subcuenta** — no detecta labels en MAYÚSCULAS ASCII (BOARDS, EXPORTAR…) ni texto
  sin tildes. Hay que **revisar manualmente** el texto de botones/spans además del scan.
- Commit por sub-módulo: `i18n(F3): <pieza>`.

## Objetivo

Crear el namespace `boards` (en `es.ts` + `en.ts`) y migrar **todo** el copy de
`src/frontend/features/tools/boards/**` a `t('boards.*')`.

## Inventario (scan + labels mayúsculas a cazar a mano)

Los componentes ya están troceados (sesión previa de anti-monolitos). Targets:

| Archivo | Copy (scan + manual) |
|---|---|
| `toolbars/TopBar.tsx` | "Solo lectura", "Guardando…", "Guardado", titles Volver/Deshacer/Rehacer/Descargar |
| `toolbars/ToolIsland.tsx` | titles: Seleccionar (V), Mover tablero (H·Espacio·botón central), Medir distancia (M), Añadir imagen/texto/nota, Rectángulo, Elipse, Línea, Flecha |
| `toolbars/InspectorIsland.tsx` | titles: Bloquear/Desbloquear, Duplicar (Ctrl+D), Traer al frente, Enviar al fondo, Editar en Recorte…, Medir en Cuadrícula, Borrar (Supr), Fondo: milimetrado/liso, Imán a la cuadrícula, "cm por cuadro", Usar N cm, Capas |
| `toolbars/TextFormatBar.tsx` | titles: Fuente, Tamaño, Menos, Más, Negrita, Cursiva, Subrayado, Izquierda, Centro, Derecha, Color de texto, Color de nota |
| `toolbars/ShapeStyleBar.tsx` | "Relleno", "Borde", "Grosor", titles Quitar relleno/Rellenar/Menos/Más |
| `toolbars/DimensionsFooter.tsx` | "objeto/objetos", "seleccionados", "1 cuadro = N cm", X/Y/An/Al/∠ labels |
| `overlays/MeasureLabel.tsx` `overlays/DimensionLabel.tsx` | "Referencia:", "Final:" (reusar `common`/nuevo `boards.reference`/`final`) |
| `overlays/TextEditor.tsx` | placeholder "Escribe…" |
| `components/LayersPanel.tsx` | "Capas", "Sin capas", titles Mostrar/Ocultar, Desbloquear/Bloquear, nombres de capa (Imagen/Texto/Nota/Rectángulo/…) |
| `components/BoardStage.tsx` | (revisar; casi todo es Konva sin texto) |
| `screens/BoardsListScreen.tsx` | "Imagen lista para colocar", "Aún no tienes boards.", "Borrar board", + títulos/acciones de la lista |
| `screens/BoardEditorScreen.tsx` | (shim; revisar) |
| `BoardEditor.tsx` | "Board no encontrado o sin acceso.", "← Volver a boards", "Board sin título" (default), "Añade imagen, texto o nota para empezar", confirm/alert si los hay |

> Estimado: **40–60 claves**. Las `LAYER_NAMES` (Imagen/Texto/Nota/Rectángulo/Elipse/
> Línea/Flecha) en `LayersPanel` ya son un mapa → migrar a `boards.layer.image`, etc.,
> o a `t('boards.layerImage')`.

## Procedimiento (un commit por grupo)

1. **Toolbars** (`TopBar`, `ToolIsland`, `InspectorIsland`, `TextFormatBar`,
   `ShapeStyleBar`, `DimensionsFooter`): añadir `usePreferences` en cada uno
   (son client). Reemplazar literales y `title=` por `t('boards.*')`.
2. **Overlays** (`MeasureLabel`, `DimensionLabel`, `TextEditor`): igual.
3. **LayersPanel** + `BoardEditor` + screens: igual; cuidado con `LAYER_NAMES`,
   el nombre por defecto `'Board sin título'` (también aparece en el backend
   `boards.service.ts`/route — **eso es API, NO se toca**; solo el cliente).
4. Tras cada grupo: tsc + tests + scan; commit.

### Patrón de edición (ejemplo real, de F2)
```tsx
// ANTES
<button title="Añadir imagen">…Añadir nota</button>
// DESPUÉS
const { t } = usePreferences()
<button title={t('boards.addImageTip')}>…{t('boards.addNote')}</button>
```
```ts
// es.ts y en.ts (AMBOS)
boards: { addImageTip: 'Añadir imagen', addNote: 'Añadir nota', /* … */ },
```

## Métrica de éxito
- `npm run i18n:scan` sin hits de `tools/boards`.
- Cambiar idioma ES↔EN traduce **todo** Boards (hoy fijo en español).
- tsc + 28 tests verdes; ES idéntico.

## Notas
- `BoardEditor.tsx` es grande pero ya troceado: la mayoría del copy vive en los
  `toolbars/*` y `components/*`, no en el orquestador.
- Si un componente presentacional no tiene `'use client'` y solo lo usa un padre
  cliente, puedes añadir `usePreferences` igualmente (queda como cliente).

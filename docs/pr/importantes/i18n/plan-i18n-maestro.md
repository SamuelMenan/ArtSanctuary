---
title: "Plan maestro: i18n + código en inglés (cero copy hardcodeado)"
audience: dev
status: completed
updated: 2026-06-01
owner: TBD
---

# Plan maestro de idioma — app 100 % bilingüe, código 100 % inglés

> **Documentación Estratégica:** Para comprender cómo el diseño de i18n no destruye el bundle del cliente, revisa previamente [`../performance/03-optimizacion-diccionarios-i18n.md`](../performance/03-optimizacion-diccionarios-i18n.md).

> Fusiona `plan-i18n-migracion.md` + la parte de idioma de
> `plan-refactor-estructura-i18n.md` en **un solo plan** que resuelve **todos** los
> problemas de i18n y de idioma del código.
>
> **Objetivo único**: que (a) **ningún** texto visible esté hardcodeado —todo sale de
> `t('namespace.key')`—, (b) el **código** (identificadores, comentarios, logs) esté
> **100 % en inglés**, y (c) existan guardarraíles que lo mantengan.

## Contexto: lo que YA está hecho (cimientos)

- ✅ Estructura por capas en `src/` (`frontend/ backend/ shared/`) y alias
  `@frontend`/`@backend`/`@shared`.
- ✅ `page.tsx`/`layout.tsx` como shims finos → `*Screen`/`*Layout`.
- ✅ i18n troceado: `shared/i18n/index.ts` (API + `createTranslator`),
  `messages/es.ts`, `messages/en.ts`, `labels.ts`. Namespaces existentes:
  `common, nav, menu, home, gallery, explore, profile, settings, sidebar, upload,
  auth, modal`.
- ✅ Patrón de uso: cliente `const { t } = usePreferences()`; servidor
  `createTranslator(getDictionary(locale))`.

> El i18n **ya funciona**; el problema es que conviven dos mundos: lo que pasa por
> `t()` y lo que sigue **incrustado en español** (sobre todo las herramientas nuevas).

## Problema (medido)

Dos frentes abiertos del trabajo "todo en inglés":

1. **Copy de UI hardcodeado en español** (no pasa por i18n) — el grueso en
   herramientas: `tools/boards/*`, `tools/grid/*`, `tools/crop/*` están **0 % i18n**.
2. **Código en español** — ~27 archivos con identificadores/comentarios/strings
   internos en español (lo último que se trabajó: boards/grid/crop quedó todo en
   español: variables, comentarios, helpers).

Ambos degradan ISO/IEC 25010 → **Mantenibilidad (Legibilidad/Consistencia)** y la
**Adecuación funcional** del bilingüismo (cambiar ES↔EN hoy **no** traduce las tools).

## Inventario del copy hardcodeado (a migrar a `t()`)

1. **Herramientas (máxima prioridad, 0 % i18n)**:
   - `boards/BoardEditor` y piezas: títulos, tooltips, "Guardando…", "Board sin
     título", etiquetas de medidas (Referencia/Final), confirmaciones.
   - `grid/ReferenceGridScreen`: "CAMBIAR FOTO", "Medidas", "Numerar", presets,
     "Referencia/Final", avisos de export.
   - `crop/CropTool` + `CutoutTool`: "CAMBIAR FOTO", "VARITA", "BORRAR",
     "RESTAURAR", "QUITAR FONDO (IA)", "Enviar a…", mensajes de error.
2. **Validaciones** `shared/lib/validation/*` — mensajes (`"Tipo inválido"`,
   `"Máximo 60 caracteres"`, `"URL inválida"`) devueltos al cliente. → devolver
   **clave** (`'validation.maxLen'`) + params (`{ n: 60 }`); el formulario traduce.
3. **JSX suelto**: marketing de `HomeScreen` (ternario es/en inline → `home.*`),
   avisos de `ColorMixScreen` ("mezcla fangosa…"), `ToolsScreen` (descripciones).
4. **Atributos**: `title`, `aria-label`, `placeholder`, `alt` en español.
5. **Imperativos**: `confirm('¿Borrar este board?…')`, `alert(...)`, nombres por
   defecto ("Desde recorte").
6. **Errores**: `setError('No se pudo…')`, `catch` con texto fijo.

## Inventario del código en español (a traducir a inglés)

- Identificadores/funciones/variables en español en `tools/boards`, `tools/grid`,
  `tools/crop` (p. ej. `cuadricula`, `medidas`, etc. en hooks/components).
- **Logs / mensajes internos** (`console.error("...")`).

Regla: se traducen **identificadores** (variables, funciones, tipos, archivos),
**logs** y **claves internas**. **NO se traducen los comentarios** (decisión del
equipo 2026-06-01: es trabajo innecesario; los comentarios en español se conservan).
**No** se tocan claves persistidas en BD ni nombres de campos de API (evita
migraciones). La **copy visible** sigue saliendo de i18n (mismo valor para `es`).

## Estrategia

- **Una clave por string**, agrupada por namespace de dominio: nuevos `boards.*`,
  `grid.*`, `crop.*`, `validation.*`; ampliar `home.*`, `tools.*`.
- **Cliente**: literal → `t('boards.saving')`.
- **Servidor / validación**: las funciones devuelven una **clave** (+ params); el
  formulario traduce con `t(key, params)`. Cero texto fijo en backend.
- **Interpolación**: `{{var}}` (ya soportado por `createTranslator`).
- **Pluralización simple**: si surge, claves `_one`/`_other`; sin lib pesada.
- **Idioma del código**: traducir **identificadores/logs** archivo por archivo, en el
  **mismo PR** que su migración de copy (un PR por módulo), sin cambios de
  comportamiento. **Los comentarios se dejan como están** (no se traducen). No mezclar
  con cambios estructurales.

## Tooling

- `scripts/find-hardcoded-strings.mjs`: recorre `src/frontend` buscando literales con
  caracteres español (`áéíóúñ¿¡`) o palabras-stop en JSX/atributos → `archivo:línea`.
  Guía la migración y mide el progreso (objetivo: 0 hits).
- (Opcional) un segundo modo del script que marque **identificadores/comentarios** en
  español para el frente de "código en inglés".

## Fases (un módulo por PR, build + typecheck + lint verdes)

- **F0 — Cimientos.** Namespaces vacíos `boards`/`grid`/`crop`/`validation` en
  `messages/es.ts` + `en.ts`. Añadir el script de detección. Confirmar que `t()` está
  disponible donde haga falta (algún componente sin `usePreferences`).
- **F1 — Validaciones.** `validation/*` → claves; formularios de `settings/*`
  traducen. Aislado, alto valor, testeable.
- **F2 — Tools crop + grid.** `CropTool`, `CutoutTool`, `ReferenceGridScreen`,
  `ToolActiveLayout`: copy → i18n **y** comentarios/identificadores → inglés.
- **F3 — Tools boards.** `BoardEditor` y sus ~24 piezas (el de más copy): tooltips,
  estados, medidas, confirmaciones; + traducción de código.
- **F4 — Screens varios.** `HomeScreen` (marketing), `ToolsScreen`, `ColorMixScreen`,
  restos de layouts (`Navbar`/`Sidebar`), modales.
- **F5 — Barrido + guardarraíl.** Script hasta **0 hits**; activar guardarraíles.

## Guardarraíles (que no reentre español)

- `eslint-plugin-react/jsx-no-literals` (warn) → bloquea copy hardcodeado en JSX.
- (Opcional) regla/CI con el script de detección: falla si reaparecen literales
  español en `src/frontend`.
- (Opcional) lint que marque palabras español frecuentes en **identificadores nuevos**.

## Decisiones / notas

- **Idioma por defecto**: se mantiene `es` (`defaultLocale`). La migración no cambia
  lo que ve el usuario; solo mueve el texto a i18n (mismo valor).
- **No romper claves de BD/API**: solo strings de presentación y código interno.
- **`confirm`/`alert` nativos**: a futuro un modal propio; aquí basta con que su texto
  venga de `t()`.
- **Rendimiento del i18n**: cargar solo el idioma activo en el bundle de cliente es un
  problema **de rendimiento**, no de cobertura → vive en `plan-rendimiento.md`
  (Palanca 1). Este plan asume el diccionario disponible y se centra en cobertura.

## Orden de ejecución (dependencia)

Objetivo general del proyecto = **velocidad** → este plan va **SEGUNDO**, después de
`plan-rendimiento`.

- **Bloqueo blando**: ejecutar la **Palanca 1 de `plan-rendimiento`** (i18n: enviar
  solo el idioma activo + `import()` dinámico del diccionario) **antes** de empezar
  aquí. Esa palanca deja el *loader* en su forma final (diccionario como prop del
  provider). Este plan solo **añade claves/valores** sobre ese loader → no lo modifica.
- Si se hace al revés (maestro primero), se migran cientos de strings con el bundle aún
  cargando ambos idiomas, y al integrar la Palanca 1 después hay que revisar el
  cableado del provider de nuevo. Evítalo.
- Este plan **no afecta la velocidad** (es cobertura/bilingüe correcto). No bloquea ni
  es bloqueado por `plan-fusion-app-backend` (independiente).

## Métrica de éxito

- `scripts/find-hardcoded-strings.mjs` → **0 hits** en `src/frontend`.
- Cambiar idioma ES↔EN traduce **también** Boards/Grid/Crop (hoy quedan fijos en español).
- **0** archivos de código con identificadores/comentarios en español (muestreo).
- `jsx-no-literals` activo (warn).
- Build + typecheck + lint verdes; **0 cambios de comportamiento** para el usuario `es`.

## Fuera de alcance (lo que NO es i18n)

Heredado de `plan-refactor-estructura-i18n.md` pero **no** es problema de idioma; se
trata en otros planes para no mezclar "mover/renombrar" con "traducir":

- Capa `backend/services` + **Server Actions** + Server Components para lecturas, y
  adelgazar `route.ts` → **`plan-fusion-app-backend.md`**.
- Reglas de frontera `eslint-plugin-boundaries` (`@frontend` no importa `@backend/db`,
  features no se importan entre sí) → **`plan-fusion-app-backend.md`** (guardarraíl).
- Reducir `'use client'` / Server Components por rendimiento → **`plan-rendimiento.md`**.

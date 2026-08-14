---
title: "Resultados de verificación de código (2026-06-02)"
audience: dev
status: historical
updated: 2026-08-14
owner: TBD
---

# Resultados de verificación — Fases 0, 1, 2, 3 y 4

> Fecha: 2026-06-02 · Base: [plan-verificacion-codigo.md](../pr/completos/plan-verificacion-codigo.md)
> Estado: **medido y documentado. Nada corregido aún** — esta es la cola de trabajo priorizada.

---

## Fase 0 — Baseline

| Check | Comando | Resultado | |
|-------|---------|-----------|---|
| Typecheck | `tsc --noEmit` | **0 errores** | ✅ |
| Tests | `npm test` | **28/28** pasan · i18n 0 hardcoded | ✅ |
| Build | `npm run build` | **OK · 20.8 s** | ✅ |
| Lint | `eslint .` | 8 errores · 2000 warnings | 🟡 |

**Veredicto: base sana.** Compila, testea y buildea limpio. El ruido de lint es mayormente un guardarraíl mal calibrado, no bugs.

### Errores de lint (8) — triage

| Ubicación | Nº | Regla | ¿App? | Acción |
|-----------|---:|-------|-------|--------|
| `scripts/reset_social.js` | 2 | `no-require-imports` | No (local-only) | Ignorar / excluir de eslint. |
| `scripts/seed.ts` | 4 | `no-explicit-any` | No (dev script) | Tipar cuando se toque. Baja prioridad. |
| **`src/backend/http/handler.ts`** | 2 | `no-explicit-any` | **Sí** | 🟢 Quick win: tipar los 2 `any`. Único error en código de app. |

### Warnings de lint (2000) — triage

| Regla | Nº | Naturaleza | Acción |
|-------|---:|-----------|--------|
| `react/jsx-no-literals` | **1920** | Guardarraíl i18n hiperagresivo (marca números, signos, etc.). **Ruido, no bugs.** | 🟢 **Decisión de config**: afinar la regla (ignorar números/puntuación o acotar a componentes con texto). Mata ~1920 de golpe. |
| `react-hooks/set-state-in-effect` | 13 | Perf real: `setState` en efecto → cascading renders. | 🟡 Revisar caso a caso. Líder: `useArtworkAutoFill.ts:137`. |
| `react-hooks/refs` | 8 | Uso de refs en render. | 🟡 Correctness. |
| `react-hooks/exhaustive-deps` | 6 | Deps de efecto incompletas. | 🟡 Revisar (puede ocultar bugs). |
| `no-explicit-any` | 6 | Tipos flojos. | 🟢 Tipar. |
| `no-unused-vars` | 18 | Variables/imports muertos. | 🟢 Trivial, autofix parcial. |
| `react-hooks/immutability` | 4 | Mutación de estado. | 🟡 Revisar. |
| `@next/next/no-img-element` | 3 | `<img>` en vez de `next/image`. | 🟡 **Cruza con Fase 3** (perf de imágenes). |
| `no-page-custom-font` | 1 | Fuente fuera de `next/font`. | 🟢 Menor. |

> **Insight clave:** "2008 problems" → quitando los 1920 de `jsx-no-literals` (config), quedan **~88 warnings reales + 2 errores de app**. El código está mucho mejor de lo que el número sugiere.

---

## Fase 1 — Código muerto (`knip`)

Verificado manualmente (knip tiene falsos positivos conocidos). Clasificado:

### 🟢 Muerto real — seguro de borrar
| Tipo | Item | Nota |
|------|------|------|
| Archivo | `src/backend/services/index.ts` | Barrel no importado por nadie. |
| Archivo | `src/frontend/features/tools/shared/workspace/ToolToolbar.tsx` | Componente sin importadores. |
| Dependencia | `next-themes` | **0 usos** en `src/`. Quitar de `package.json`. |
| devDependency | `ts-morph` | Sin uso en código. Quitar (se reinstala si se necesita un codemod). |
| Export | `metadata` en `ProfileScreen.tsx` y `SettingsScreen.tsx` | `metadata` solo lo lee Next en `app/*`. En un screen de feature **no hace nada**. Borrar o mover al `page.tsx`. |

### 🟡 Probable muerto — verificar antes de borrar
Exports sin importadores (confirmar que no son API pública intencional):
`USERNAME_RE`, `URL_RE` (`settings/profile/profileLogic.ts`) · `cmykToRgb` (`colorMix.ts`) · `SCALE_RATIO` (`measure.ts`) · `inferCategoryFromExif`, `buildSuggestions` (`useArtworkAutoFill.ts`) · `validatePreferences` (`validation/settings.ts`).

### ⚪ Falsos positivos — NO tocar
| Item | Por qué no es dead |
|------|--------------------|
| `server-only` (12 "unlisted") | Paquete real y correcto; protege módulos de servidor. **Acción opuesta:** declararlo en `package.json` (`dependencies`) para que deje de figurar como no listado. |
| `signIn`, `signOut` (`auth/index.ts`) | Superficie del wrapper de next-auth; API intencional aunque hoy sin uso directo. |
| 20 `interface`/`type` exportados (`IArtwork`, `IBoard`, `BoardViewport`…) | Tipos de modelos/contratos. "Export sin uso" ≠ borrar; documentan los esquemas y se importan por tipo. Revisión opcional, baja prioridad. |

---

## Fase 2 — Organizado (estructura y límites de capa)

### Límites de capa — casi perfectos

| Regla | Resultado |
|-------|-----------|
| `shared/` no importa de `frontend`/`backend` | ✅ limpio (shared es puro) |
| `backend/` no importa de `frontend` | ✅ limpio |
| `frontend/` no importa de `backend` | 🟡 6 screens lo hacen (ver abajo) |

### 🟡 Hallazgo principal: dos patrones de acceso a datos

Existe una capa `backend/services/` (8 servicios). **Las rutas API la usan bien** (22/30 rutas vía services, **0 tocan modelos directamente**). Pero **6 server-component screens la saltan** y consultan los modelos a pelo:

| Screen | Acceso directo |
|--------|----------------|
| `gallery/screens/GalleryScreen.tsx` | `connectDB` + `Artwork.find({visibility:'public'})` |
| `home/screens/HomeScreen.tsx` | `User.findById` + `Artwork.find(...)` |
| `profile/screens/ProfileScreen.tsx` | `User.findById` + `Artwork.find(...)` |
| `profile/screens/ProfileDetailScreen.tsx` | `User.findById` + `Artwork.find({visibility:'public'})` |
| `settings/screens/SettingsScreen.tsx` | `User.findById` |
| `collections/screens/CollectionDetailScreen.tsx` | `connectDB` + `Collection` |

**Consecuencia:** lógica de query duplicada (el filtro `visibility:'public'`, populates, `.lean()` se repiten en cada screen en vez de vivir una vez en `artworks.service.ts`). No es un bug —los Server Components pueden llamar código de servidor— pero rompe la consistencia y el DRY.

> **Recomendación:** mover esas queries a `backend/services/*`. Los screens llaman al servicio (superficie intencional), no a `connectDB`+modelos. Un solo sitio donde cambiar filtros/proyecciones. Alinea screens con el patrón que ya usan las rutas API.

### 🟢 Imports relativos profundos — trivial
4 archivos usan `../../../../../shared/lib/measure` en vez del alias `@shared`:
`boards/lib/grid.ts` (+ `.test`), `grid/lib/gridGeometry.ts` (+ `.test`).
→ Reemplazar por `@shared/lib/measure`. Mecánico.

### 🟡 Convención de carpetas (de la auditoría, sigue pendiente)
- `features/profile/` → 7 componentes sueltos en raíz → `components/`.
- `features/settings/` → 11 archivos sueltos → `components/ hooks/ lib/`.

**Entregable Fase 2:** centralizar 6 screens en `services/` · alias `@shared` en 4 archivos · recolocar `profile`/`settings`.

---

## Fase 3 — Rápido (rendimiento)

**Veredicto: en muy buen estado.** Lo pesado está correctamente diferido; no hay fugas de librerías al bundle compartido.

### Code-splitting de librerías pesadas — ✅ correcto

| Librería | Peso (chunk) | Dónde carga | Cómo |
|----------|-------------:|-------------|------|
| ONNX Runtime (IA quitar-fondo) | **~760 KB** (2×380) | Solo al pulsar la IA en `/crop` | `await import('@imgly/background-removal')` dentro de `useCutoutEditor.ts:177` — **lazy** ✅ |
| `konva` + `react-konva` | **~351 KB** | Solo `/dashboard/tools/boards` | `BoardEditor` vía `next/dynamic` ✅ |
| `react-dom` (framework) | ~221 KB | Compartido (todas las rutas) | Baseline normal de React 19. |

- Total `.next/static/chunks`: **2.7 MB**, pero **route-split**: ninguna página carga todo. El usuario solo descarga el chunk pesado de la herramienta que abre.
- **Sin fugas**: ni `mongoose`, ni `bcrypt`, ni `exifr`, ni código de servidor aparecen en chunks de cliente. Los límites de capa se respetan a nivel de bundle.

### Server vs Client Components — ✅ buen patrón
- 86 archivos `'use client'`, pero las **páginas** (`app/*`) son Server Components; solo 2 son cliente (`tools/page`, `tools/boards/page`). La galería renderiza en servidor (0 JS de página). El `'use client'` vive en los features (correcto: la UI interactiva es isla).

### Backend — ✅ queries eficientes
- `.lean()` en los 7 servicios (20 llamadas) → devuelve POJOs, sin overhead de hidratación Mongoose.
- `.select()` en auth + 4 servicios → proyección de campos, no trae documentos completos.

### 🟡 Quick wins de rendimiento (pocos)
| Item | Nº | Impacto | Acción |
|------|---:|---------|--------|
| `<img>` crudo en vez de `next/image` | 3 (`no-img-element`) | Imágenes de Blob sin optimizar (sin resize/AVIF/lazy nativo de Next). | Evaluar `next/image` + `remotePatterns` del dominio Blob. Cruza con lint Fase 0. |
| Precarga del modelo IA | — | Primera quitada-de-fondo descarga 760 KB + pesos. | Opcional: `prefetch`/`preload` al entrar a `/crop` para que la espera no sea en el clic. |

> No hay nada urgente en perf. La arquitectura de carga ya es la correcta. Los dos puntos de arriba son pulido, no deuda.

---

## Fase 4 — Red de seguridad (tests)

**Estado actual:** 3 archivos de test, 28 tests, todos verdes. Cubren `measure.ts`, `boards/lib/grid.ts`, `grid/lib/gridGeometry.ts` (la geometría de las herramientas). El resto de la lógica pura está **sin cubrir**.

Criterio: testear **funciones puras** (entrada→salida, sin DOM/red) que, si se rompen, tumban una herramienta entera. Barato y de alto valor.

### Backlog priorizado de tests

| # | Módulo | Funciones | Valor | Esfuerzo | Por qué |
|---|--------|-----------|-------|----------|---------|
| 1 | `shared/lib/colorMix.ts` | `hexToRgb`, `rgbToHex`, `rgbToCmyk`, `cmykToRgb`, `rgbToHsl`, `rgbToLab`, `mixColors`, `isMuddy` | 🔴 Alto | Bajo | Motor de la herramienta de mezcla de color. Determinista: round-trips (`hex→rgb→hex`) y valores conocidos (blanco, negro, primarios). |
| 2 | `shared/lib/validation/settings.ts` | `validateProfile`, `validateEmail`, `validatePassword`, `validatePreferences`, `validateNotifications`, `validatePrivacy` | 🔴 Alto | Bajo | Guarda **toda** la entrada de usuario en settings. Casos válido/inválido/límite. |
| 3 | `tools/grid/lib/colLabel.ts` | `colLabel` | 🟡 Medio | Trivial | Edge cases clásicos: `0→A`, `25→Z`, `26→AA`, `701→ZZ`, `702→AAA`. Win rápido. |
| 4 | `tools/color-mixing/colorMixHelpers.ts` | `lighten`, `darken` | 🟡 Medio | Bajo | Math de hex; `getMixLabels` es data i18n (skip). |
| 5 | `shared/lib/image/autocrop.ts` | `padBounds`, `computeContentBounds` | 🟡 Medio | Medio | `padBounds` es math puro (fácil). `computeContentBounds` requiere mock de `ImageData` (medio). |

### No testear (efectos secundarios, mal ROI en unit)
`canvas.ts` (DOM/canvas), `floodfill.ts` (píxeles de canvas), `tools/handoff.ts` (sessionStorage), `mediums.ts` (datos). → Mejor cubrir con tests de integración si hace falta, no unit.

**Entregable Fase 4:** empezar por #1 y #2 (alto valor, bajo esfuerzo). Con eso el corazón de color + la validación de entrada quedan blindados. #3 es un win de 5 min.

---

## Cola de trabajo priorizada (para "luego")

### Quick wins (bajo riesgo, alto orden)
1. Borrar `services/index.ts` + `ToolToolbar.tsx`.
2. Quitar deps `next-themes` y `ts-morph`; declarar `server-only`.
3. Borrar exports `metadata` muertos de los 2 screens.
4. Tipar los 2 `any` de `handler.ts`.
5. Afinar `react/jsx-no-literals` → elimina ~1920 warnings de ruido.

### Estructura (Fase 2)
6. Centralizar las queries de los 6 screens en `backend/services/*` (quita duplicación + alinea con las rutas API).
7. Alias `@shared/lib/measure` en los 4 archivos con `../../../../../`.
8. Recolocar `features/profile` (→ `components/`) y `features/settings` (→ `components/ hooks/ lib/`).

### Requiere criterio (correctness/perf)
9. ~30 warnings de `react-hooks` (empezar por `set-state-in-effect` en `useArtworkAutoFill.ts:137`).
10. Verificar y limpiar los 7 exports "probable muerto".

### Rendimiento (Fase 3) — pulido, no urgente
11. Los 3 `no-img-element` → evaluar `next/image` para imágenes de Blob.
12. Precargar el modelo de IA al entrar a `/crop` (mover la espera de 760 KB fuera del clic).

### Tests (Fase 4) — alto valor, bajo esfuerzo
13. Tests de `colorMix.ts` (#1) y `validation/settings.ts` (#2).
14. Test de `colLabel.ts` (#3, win de 5 min) + `colorMixHelpers`/`autocrop` (#4-5).

> Tras los quick wins 1-5, el lint debería pasar de "2008 problems" a **decenas**, y reflejar solo señal real.

---

## Resumen ejecutivo de las 3 fases

| Eje | Estado | Detalle |
|-----|--------|---------|
| **Sano** (Fase 0) | 🟢 | tsc 0 · 28/28 tests · build 20.8 s. Lint inflado por ruido de config. |
| **Simple** (Fase 1) | 🟢 | Poco código muerto: 2 archivos, 2 deps, ~10 exports. Limpieza menor. |
| **Organizado** (Fase 2) | 🟡 | Capas casi limpias. 6 screens saltan `services/` (queries duplicadas) · 4 imports sin alias · `profile`/`settings` por recolocar. |
| **Rápido** (Fase 3) | 🟢 | Code-splitting correcto, libs pesadas diferidas, queries `lean`. Sin deuda. |
| **Tests** (Fase 4) | 🟡 | 28 tests verdes en geometría. Falta cubrir `colorMix` y `validation` (alto valor, bajo esfuerzo). |

El proyecto está **mejor de lo que aparenta**. El mayor "ruido" (2000 warnings, 4191 archivos en git) era cosmético/config, ya identificado. El núcleo —arquitectura, carga, datos— es sólido. Lo accionable real cabe en una tarde: limpiar config de lint, centralizar 6 queries en `services/`, y añadir 2-3 archivos de test.

---
title: "Plan: Rendimiento — menos JS al cliente, carga más rápida"
audience: dev
status: completed
updated: 2026-06-01
owner: TBD
---

# Plan: Rendimiento (página súper rápida)

> ✅ **COMPLETADO (2026-06-01).** Commits: Palanca 1 (i18n un idioma) `743d3f9` ·
> Palanca 2 (ArtworkGrid Server Component, `?art=id`) `9f3ccfc` · Palanca 4 (cache
> listas públicas) `a603e2c` · Palanca 5 (bundle-analyzer) `d5df7f1` · Palanca 2c
> (ToolsScreen/AccountForm a server) `12cf53e`. Palanca 3 ya estaba cumplida.
> Pendiente solo **medir** con `npm run analyze` + Lighthouse en entorno con build.

> **Documentación Estratégica:** Este plan materializa las directrices teóricas definidas en [`../performance/01-optimizacion-servidor-rsc.md`](../../docs/performance/01-optimizacion-servidor-rsc.md) y [`../performance/02-estrategia-carga-cliente.md`](../../docs/performance/02-estrategia-carga-cliente.md).

> Objetivo: que la página cargue y responda lo más rápido posible **sin** cambiar
> funcionalidad ni UX. Palanca principal = **enviar menos JavaScript al navegador**.

## Línea base medida (2026-06-01)

| Señal | Valor | Lectura |
|---|---|---|
| Componentes `'use client'` | **64 de 95** `.tsx` (67%) | Mucho JS de interactividad al cliente. |
| i18n | `@shared/i18n` importa **`es` + `en`** estáticos; `AppPreferencesProvider` (cliente, envuelve toda la app) mete el diccionario en contexto | **Ambos idiomas (664 líneas de strings) viajan al bundle de TODA página.** |
| Libs pesadas | `konva`/`react-konva` (solo `boards/`, `BoardEditor` con `dynamic()`), `@imgly/background-removal` (`await import()`) | ✅ Ya perezosas y aisladas por ruta. |
| Imágenes | 10 archivos con `next/image`; 4 `<img>` crudos (todos en tools con blob/canvas) | ✅ Correcto: los `<img>` de tools usan URLs de blob/objeto; `next/image` no aplica ahí. |
| Barrels (`index.ts` re-export) | 2 (auth, i18n) | ✅ Mínimos (no estorban al tree-shaking). |
| Screens de display ya en servidor | Home, Gallery, Profile, ProfileDetail, Settings, CollectionDetail (no llevan `'use client'`) | ✅ Buen punto de partida. |
| Lecturas de UI | Esos screens **importan `@backend` directo**; **0** `fetch('/api/...')` interno desde servidor (los 41 `fetch('/api')` son de componentes cliente = mutaciones). | ✅ **Sin salto HTTP interno que optimizar** → no hay palanca de velocidad en mover `route.ts`. |

**Diagnóstico**: lo pesado (konva, IA) ya está bien. Los dos focos reales son
**(1) i18n duplicado en cada bundle** y **(2) frontera cliente demasiado arriba** en
listas/tarjetas de solo-mostrar.

---

## Palanca 1 — i18n: enviar solo el idioma activo  🔴 mayor impacto / menor esfuerzo

**Problema**: `src/shared/i18n/index.ts` hace `import { es }` **y** `import { en }`.
Como `AppPreferencesProvider` (cliente) consume `getDictionary`, el bundler incluye
**los dos** diccionarios en el JS de cliente de cada página.

**Arreglo (App Router idiomático)**: cargar el diccionario del idioma activo en un
**Server Component** (el root `layout.tsx` o un layout de sección) y pasarlo como
**prop inicial** al provider cliente. Solo el idioma activo se serializa.

```tsx
// app/layout.tsx (Server Component) — lee cookie, carga UN diccionario
import { cookies } from 'next/headers'
import { getDictionary, normalizeLocale, LOCALE_COOKIE } from '@shared/i18n'

export default async function RootLayout({ children }) {
  const locale = normalizeLocale((await cookies()).get(LOCALE_COOKIE)?.value)
  const dictionary = getDictionary(locale)   // solo el activo
  return (
    <html>
      <body>
        <AppPreferencesProvider initialLocale={locale} initialDictionary={dictionary}>
          {children}
        </AppPreferencesProvider>
      </body>
    </html>
  )
}
```

```ts
// AppPreferencesProvider: recibe el diccionario, ya NO importa el módulo con ambos
function AppPreferencesProvider({ initialLocale, initialDictionary, children }) {
  const [locale, setLocale] = useState(initialLocale)
  const [dict, setDict] = useState(initialDictionary)
  // Al cambiar de idioma en cliente: dynamic import SOLO del nuevo locale.
  const switchLocale = async (l: Locale) => {
    const next = await import(`@shared/i18n/messages/${l}`)
    setDict(next[l]); setLocale(l)
  }
  const t = useMemo(() => createTranslator(dict), [dict])
  // …
}
```

```ts
// shared/i18n/index.ts: separar la carga estática de la API
// getDictionary se queda para SERVIDOR; el cliente usa import() dinámico.
export async function loadDictionary(locale: Locale) {
  const m = await import(`./messages/${locale}`)
  return m[locale]
}
```

**Efecto**: ~la mitad del peso de strings fuera del bundle inicial; el idioma
secundario solo se baja si el usuario cambia de idioma. Aplica a **todas** las páginas.

**Riesgo**: bajo. Verificar que ningún componente cliente importe `getDictionary`
estático (hoy lo hacen los **screens de servidor** Home/Gallery/Profile/Settings —
ésos pueden seguir usando `getDictionary` porque corren en servidor; el problema es
solo la cadena `provider cliente → index con ambos idiomas`).

---

## Palanca 2 — bajar la frontera `'use client'`  🔴 alto impacto

**Principio**: `'use client'` debe estar en la **hoja interactiva**, no en el
contenedor. Un componente que solo **muestra** datos (sin `useState`/`onClick`/efectos)
debe ser **Server Component** (cero JS al cliente).

### 2a. `ArtworkGrid` (`shared/ui/ArtworkGrid.tsx`) — split servidor/cliente
Hoy es cliente solo por el modal (`useState selectedIdx`). Se usa en Explore, Gallery,
Profile, colecciones → alto alcance.

- **Server**: render de las tarjetas (imagen + título + categoría) en un componente
  servidor `ArtworkGridView`.
- **Client**: una isla fina `ArtworkLightbox` que maneja apertura/navegación del modal.
- Patrón: el grid servidor renderiza tarjetas; el click lo captura un wrapper cliente
  ligero (o se sube el índice por URL `?art=ID` para abrir el modal sin estado cliente).

### 2b. `ExploreScreen` (`features/explore/screens/ExploreScreen.tsx`)
Si la grilla y filtros se pueden resolver en servidor (fetch + render), dejar cliente
solo los controles que cambian filtros (o moverlos a `searchParams` → server re-render).

### 2c. Auditar el resto de la lista de 64
Clasificar cada `'use client'` en:
- **Necesario** (canvas/tools, formularios, modales, menús): se queda. La mayoría de
  `tools/*`, `settings/*` forms, `navbar/*` menús son legítimos.
- **Innecesario** (solo muestra): quitar `'use client'`, volverlo servidor.

> Candidatos a revisar primero: `FollowStats`, `ArtworkMeta`, `ArtworkComments`
> (si solo listan), banners/labels estáticos.

**Efecto**: menos hidratación = First Load JS más bajo = interactividad más rápida.

---

## Palanca 3 — codificar el patrón de libs perezosas  🟡 mantener lo bueno

Ya funciona (konva, @imgly). Convertirlo en **regla** para que escale:

- Cualquier dependencia pesada de cliente (editores, charts, mapas, parsers) se carga
  con `next/dynamic({ ssr:false })` o `await import()` **dentro del handler**, nunca en
  el import de nivel superior de un componente montado siempre.
- Mantener cada lib pesada **aislada a su feature** (como konva→`boards/`) para que el
  bundler la ponga solo en el chunk de esa ruta.

---

## Palanca 4 — higiene de bundle y datos  🟡

- **Sin barrels nuevos** que reexporten features enteras (rompen tree-shaking). Los 2
  actuales (auth, i18n) son chicos; no crecerlos.
- **`.lean()` + proyección** en las queries de listas (ya se hace en `boards`): traer
  solo los campos que la vista pinta.
- **Paginación/`limit`** en Explore/Gallery/búsqueda (evita traer colecciones enteras).
- **Cache de fetch**: usar `revalidate`/`cache` de Next en listas públicas (explore,
  gallery) para servir desde caché.

---

## Palanca 5 — medir (sin medir no hay rendimiento)  🟢

1. **Bundle analyzer**: `@next/bundle-analyzer` → ver First Load JS por ruta antes/después.
2. **Lighthouse / PageSpeed** en Home, Explore, Board: registrar **LCP**, **TBT**, **JS transferido**.
3. Hacerlo **antes** de tocar nada (baseline) y tras cada palanca.

---

## Guardarraíl (que no se degrade)

- ESLint: avisar si un componente sin hooks/eventos lleva `'use client'` (revisión manual
  o regla custom). Como mínimo, **checklist de PR**: "¿este `'use client'` es necesario?".
- CI: presupuesto de bundle (`First Load JS` máx por ruta) con el analyzer; falla si sube.
- Regla de imports: prohibir `import` estático de libs pesadas en componentes de layout/always-mounted.

## Orden recomendado (impacto ↓, esfuerzo ↑)

1. **Palanca 5 (medir baseline)** — primero, para comparar.
2. **Palanca 1 (i18n un idioma)** — máximo impacto, app-wide, riesgo bajo.
3. **Palanca 2a (`ArtworkGrid` split)** — alto alcance (4+ vistas).
4. **Palanca 2b/2c (explore + auditoría `use client`)**.
5. **Palancas 3 y 4 (reglas + datos)** — consolidar.

## Métrica de éxito

- **First Load JS** de las rutas públicas (Home/Explore/Gallery) baja de forma medible
  (objetivo: −20–35% tras Palancas 1+2).
- Solo **un** diccionario i18n en el bundle inicial.
- `'use client'` solo en componentes con interactividad real (auditado).
- **LCP** y **TBT** mejoran en Lighthouse (antes/después documentado).
- Build + typecheck + lint verdes; **0 cambios de UX**.

## Orden y relación con los otros planes

Objetivo general = **velocidad** → este plan va **PRIMERO**.

1. **`plan-rendimiento` (este)** — única palanca directa de velocidad.
2. **`plan-i18n-maestro`** — después. Razón: la **Palanca 1** de este plan cambia el
   *loader* de i18n (enviar solo el idioma activo + `import()` dinámico al cambiar).
   El maestro **añade muchas claves** (boards/grid/crop) **sobre** ese loader ya
   optimizado. Si se hiciera al revés, se migraría todo el copy con el bundle aún
   duplicado y habría que rehacer la integración con el provider.
   → **Bloqueo blando: ejecutar la Palanca 1 antes de empezar `plan-i18n-maestro`.**
3. **`plan-fusion-app-backend`** — **NO aporta velocidad**: las lecturas ya van
   Server Component → `@backend` directo (sin HTTP interno; ver línea base). Es orden
   y mantenibilidad. **Diferir**; opcional para este objetivo.

## Lo que este plan NO hace

- No reescribe los tools de canvas (son cliente por naturaleza; ya están aislados/lazy).
- No cambia el contrato de datos ni las URLs.
- No migra copy a i18n (eso es `plan-i18n-maestro`); aquí solo se optimiza **cómo** se
  carga el diccionario (Palanca 1), no su contenido.
- No toca `app→backend` (`plan-fusion-app-backend`): es orden, no velocidad.

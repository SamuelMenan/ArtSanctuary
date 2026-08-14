# Plan de verificación de salud del código

> Fecha: 2026-06-02 · Objetivo: medir el estado actual contra 3 ejes — **simple, organizado, rápido** — usando el tooling que el repo ya tiene. Cada fase deja un número o lista accionable, no opiniones.

## Punto de partida (ya medido)

| Señal | Valor | Lectura |
|-------|-------|---------|
| TypeScript `strict` | ✅ true | Base sólida. |
| LOC en `src/` | 18 506 | Proyecto mediano. |
| Tests | **3 archivos** | 🔴 Cobertura muy baja para el tamaño. |
| Archivo más grande (código) | `BoardEditor.tsx` 367 | OK, nada monstruoso. |
| Stack | Next 16, React 19, Konva, @imgly/background-removal | Pesado en cliente (canvas + IA). |

Herramientas disponibles: `eslint`, `vitest`, `@next/bundle-analyzer`, `react-doctor`, `ts-morph`.

---

## Fase 0 — Baseline: ¿compila y pasa? (5 min)

Antes de juzgar calidad, confirmar que lo básico está verde.

```bash
npx tsc --noEmit          # typecheck completo (strict)
npm run lint              # eslint
npm test                  # i18n:scan + vitest
npm run build             # build de producción Next
```

**Salida esperada:** 4 verdes. Cualquier rojo aquí es prioridad #1 — bloquea todo lo demás.
Anotar: nº de errores TS, nº de warnings eslint, tests pass/fail, tiempo de build.

---

## Fase 1 — SIMPLE (complejidad y código muerto)

**Objetivo:** menos código, menos ramas, cero muerto.

### 1.1 Diagnóstico automático
```bash
npm run doctor            # react-doctor: lint, a11y, bundle, arquitectura
```

### 1.2 Código muerto / exports sin usar
```bash
npx ts-prune              # exports nunca importados (ts-prune o knip)
# alternativa más completa:
npx knip                  # dead files, deps, exports
```
> `ts-morph` ya está instalado → se puede scriptar detección de imports huérfanos a medida si hace falta.

### 1.3 Revisión manual de los 5 archivos más grandes
`BoardEditor` (367), `CropTool` (357), `useCutoutEditor` (348), `HomeScreen` (303), `ExploreScreen` (301).
Buscar: funciones >50 líneas, anidamiento >3, lógica que debería ser un hook/`lib` puro.

**Entregable:** lista de exports muertos + archivos/deps a borrar + 0-3 candidatos a extraer.

---

## Fase 2 — ORGANIZADO (estructura y límites)

**Objetivo:** cada archivo en su sitio, dependencias en una sola dirección.

### 2.1 Convención de features
Confirmar que todos siguen `components/ hooks/ lib/ screens/`. Pendientes ya detectados en la auditoría:
- `features/profile/` → 7 componentes sueltos → mover a `components/`.
- `features/settings/` → 11 archivos sueltos → `components/ hooks/ lib/`.

### 2.2 Límites de capas (lo más importante para "rápido y predecible")
Regla: `frontend/` no importa de `backend/`; `shared/` no importa de ninguno de los dos.
```bash
# detectar fugas de capa
grep -rn "@backend/" src/frontend && echo "FUGA: frontend->backend"
grep -rn -E "@frontend/|@backend/" src/shared && echo "FUGA: shared->app"
```
> Si sale limpio, la arquitectura está sana. Si hay fugas, son la causa típica de bundles cliente inflados (código de servidor arrastrado al navegador).

### 2.3 Imports relativos profundos
```bash
grep -rn "\.\./\.\./\.\." src --include=*.ts --include=*.tsx
```
Cada `../../../` es señal de que falta usar el alias `@…`.

**Entregable:** plan de movimientos (profile/settings) + lista de fugas de capa (debería ser 0).

---

## Fase 3 — RÁPIDO (rendimiento real)

**Objetivo:** que el usuario vea pixeles rápido. Foco en el peso de cliente, que aquí es el riesgo (Konva + IA).

### 3.1 Análisis de bundle
```bash
npm run analyze           # ANALYZE=true next build → reporte visual
```
Mirar específicamente:
- ¿`@imgly/background-removal` (modelo IA, MB) entra en el bundle inicial o está en `dynamic import`? **Debe** cargarse solo al abrir el tool de recorte.
- ¿`konva`/`react-konva` solo en las rutas de boards/grid, no en el shell global?

### 3.2 Server vs Client Components
```bash
grep -rln "'use client'" src/frontend | wc -l    # cuántos son cliente
```
Por cada `'use client'` en una pantalla: ¿necesita JS o podría ser Server Component? Gallery ya es server (bien). Revisar que las páginas pesadas no sean cliente sin motivo.

### 3.3 Carga diferida de lo pesado
Confirmar `next/dynamic` (o import dinámico) para:
- Editor de boards (Konva).
- Tool de recorte (@imgly).
- Modales/lightbox que no se ven en el primer render.

### 3.4 Imágenes y datos
- Imágenes de galería: ¿`loading="lazy"`? (ArtworkGrid ya lo tiene ✅).
- Consultas Mongo: ¿`.lean()` + `.select()` para no traer campos de más? (Gallery usa `.lean()` ✅, revisar el resto).
- ¿`next/image` para servir blob optimizado en vez de `<img>` crudo? Decisión coste/beneficio (requiere `remotePatterns` del dominio blob).

**Entregable:** tabla de qué carga en el bundle inicial vs diferido + 1-3 quick wins de peso.

---

## Fase 4 — Red de seguridad (tests donde más duele)

Solo 3 tests para 18k LOC. No buscar 100 % — cubrir la **lógica pura crítica** que ya vive aislada en `lib/`:
- `shared/lib/image/` (autocrop, floodfill, canvas)
- `shared/lib/measure.ts`, `colorMix.ts`
- `features/tools/*/lib/` (gridGeometry, grid)

Estos son funciones puras → tests baratos y de alto valor. Apuntar a cubrir la lógica que, si se rompe, rompe una herramienta entera.

**Entregable:** lista priorizada de 5-10 funciones puras a testear.

---

## Orden de ejecución

1. **Fase 0** (baseline) — sin esto, nada es fiable.
2. **Fase 1** (simple) + **Fase 2** (organizado) — limpieza, bajo riesgo, commiteable por partes.
3. **Fase 3** (rápido) — el de mayor impacto percibido por el usuario; hacerlo con números del analyzer, no a ojo.
4. **Fase 4** (tests) — blindar lo limpiado antes de seguir construyendo.

Cada fase produce una lista concreta. Tras recorrerlas tendremos un retrato medible del código y una cola de tareas ordenada por impacto/esfuerzo.

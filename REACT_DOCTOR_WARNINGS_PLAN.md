# Plan de corrección de warnings — React Doctor

Estado base (2026-06-02, tras commits `0b7411a` + `7d6b839`):
**0 errores · 300 warnings · score 76/100**

Regenerar conteos en cualquier momento:
```bash
npx react-doctor@latest --json | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const a=(JSON.parse(s).diagnostics);const b={};for(const x of a)b[x.rule]=(b[x.rule]||0)+1;for(const [k,v] of Object.entries(b).sort((a,b)=>b[1]-a[1]))console.log(v,k)})"
```

## Reglas de oro (para quien ejecute el plan)

1. Antes de tocar cada regla, hacer `curl` sin caché de su receta canónica:
   `https://www.react.doctor/prompts/rules/react-doctor/<regla>.md`
   (tiene sección **Validation prompt** = cómo detectar falso positivo, y **Fix prompt** = arreglo correcto).
2. Leer el código real antes de confirmar. No suprimir reglas ni tocar config.
3. Arreglar la **causa**, no el síntoma.
4. Tras cada lote: `npx tsc --noEmit` y `npx react-doctor@latest --json`. Si rompe, revertir ese lote.
5. Un commit por fase (o por regla en las fases grandes).

---

## Orden recomendado: bugs → accesibilidad → dead code → perf → estilo

El score cuenta **variedad de reglas**, no cantidad de ocurrencias. Borrar 181 archivos
muertos = +0.75 puntos. El valor real no está en el número: está en arreglar bugs y
accesibilidad. No perseguir el 100 — el objetivo es repo sano.

---

### FASE 1 — Correctness / Bugs (≈25 warnings) · ALTA prioridad

Bugs reales: datos viejos en pantalla, race conditions, renders en cascada.
Requieren leer cada caso y criterio. NO mecánico.

| Regla | Nº | Qué hacer |
|-------|----|-----------|
| `no-fetch-in-effect` | 9 | Mover fetch a Server Component / `loader` / React Query; o al menos manejar race + cleanup. Caso por caso. |
| `exhaustive-deps` | 4 | Añadir deps faltantes al `useEffect`. Cuidado: si añadirla provoca bucle, el problema es de diseño (memoizar la dep, no silenciar). |
| `no-derived-state` / `no-derived-useState` | 2+2 | Estado que se puede calcular de props/estado → derivar en render, borrar el `useState`. |
| `rerender-lazy-state-init` | 2 | `useState(expensiveFn())` → `useState(() => expensiveFn())`. Mecánico. |
| `rerender-state-only-in-handlers` | 1 | Mover el `setState` al handler, no en render. |
| `no-chain-state-updates` | 1 | Combinar updates de estado encadenados. |
| `no-uncontrolled-input` | 1 | Input con `value` sin `onChange` (o viceversa) → controlar o usar `defaultValue`. |
| `nextjs-no-use-search-params-without-suspense` | 1 | Envolver el componente que usa `useSearchParams` en `<Suspense>`. |
| `no-react19-deprecated-apis` | 2 | Migrar API deprecada de React 19 (revisar cuál: `propTypes`/`defaultProps` en función, etc.). |

**Validación extra:** correr la app y probar los flujos tocados (subida, perfil, explore).

---

### FASE 2 — Accesibilidad (≈45 warnings) · ALTA-MEDIA prioridad

Afecta teclado y lectores de pantalla. Mayormente mecánico.

| Regla | Nº | Qué hacer |
|-------|----|-----------|
| `control-has-associated-label` | 36 | Cada `<input>/<select>/<textarea>` necesita `<label htmlFor>` asociado o `aria-label`. El grueso del trabajo; es repetitivo. |
| `prefer-tag-over-role` | 4 | `<div role="button">` → `<button>`. Usar el tag semántico. |
| `click-events-have-key-events` | 3 | Elemento con `onClick` sin `onKeyDown` → añadir handler de teclado, o convertir a `<button>`. |
| `no-static-element-interactions` | 1 | `<div onClick>` sin rol → `<button>` o añadir `role`+`tabIndex`+teclado. |
| `no-noninteractive-element-interactions` | 1 | Igual: mover interacción a elemento interactivo. |

**Nota:** varios de estos comparten causa con FASE 1 (divs clicables). Resolver juntos
los que estén en el mismo archivo.

---

### FASE 3 — Dead code (≈183 warnings) · MEDIA prioridad, ALTO cuidado

Cero impacto en usuario, pero limpia el repo enormemente.

| Regla | Nº | Qué hacer |
|-------|----|-----------|
| `unused-file` | 181 | Borrar archivos no referenciados. **VERIFICAR ANTES** cada uno: ¿import dinámico? ¿entrypoint de Next (page/layout/route)? ¿usado por config? Falsos positivos posibles. |
| `unused-dev-dependency` | 1 | Quitar de `package.json` devDeps + correr `npm install` para actualizar lockfile. |
| `only-export-components` | 1 | Separar el export no-componente a otro archivo (fast-refresh). |

**Procedimiento seguro para `unused-file`:**
```bash
# por cada archivo candidato, confirmar 0 referencias (incl. imports dinámicos y alias)
npx react-doctor@latest --json | node -e "..."   # listar los 181
# para cada uno: grep del basename por todo src/ antes de borrar
```
Borrar en lotes pequeños, `tsc` + build entre lotes. Este es el único punto donde se
toca `package.json`/lockfile (solo para la dep no usada).

---

### FASE 4 — Performance (≈11 warnings) · MEDIA prioridad

| Regla | Nº | Qué hacer |
|-------|----|-----------|
| `nextjs-no-img-element` | 2 | `<img>` → `next/image` (`<Image>`) con width/height. |
| `js-flatmap-filter` | 3 | `.filter().map()` → `.flatMap()`. Mecánico. |
| `js-hoist-intl` | 2 | Sacar `new Intl.*` fuera del render (módulo). |
| `js-tosorted-immutable` | 1 | `[...a].sort()` → `a.toSorted()`. |
| `server-hoist-static-io` | 1 | Subir I/O estático fuera del request handler. |
| `prefer-module-scope-static-value` | 1 | Constante estática a scope de módulo. |
| `no-dynamic-import-path` | 1 | `import(variable)` → path estático o mapa explícito. |
| `async-parallel` | 1 | **DEFERIDO A PROPÓSITO** — `deleteAccountCascade` (`users.service.ts:34`). Cascade delete sin transacciones; paralelizar arriesga estado a medias. NO tocar sin diseñar rollback. |

---

### FASE 5 — Estilo / Maintainability (≈30 warnings) · BAJA prioridad

Opinión de linter, sin impacto de usuario. Hacer al final o ignorar.

| Regla | Nº | Qué hacer |
|-------|----|-----------|
| `no-initialize-state` | 5 | No inicializar estado con valor recalculable; derivar. |
| `design-no-redundant-padding-axes` | 5 | `px-4 py-4` → `p-4`. Mecánico. |
| `prefer-useReducer` | 4 | Varios `useState` relacionados → `useReducer`. Refactor con criterio. |
| `design-no-redundant-size-axes` | 3 | `w-10 h-10` → `size-10`. Mecánico. |
| `no-many-boolean-props` | 3 | Componente con muchos props boolean → objeto `variant`/config. |
| `no-pure-black-background` | 3 | `bg-black`/`#000` → token de superficie. |
| `no-event-handler` | 3 | Revisar (handlers inline problemáticos). |
| `prefer-use-effect-event` | 2 | `useEffectEvent` para no-reactivos en effects. |
| `design-no-em-dash-in-jsx-text` | 1 | `—` en texto JSX → entidad o copy. |
| `prefer-html-dialog` | 1 | Modal manual → `<dialog>` nativo. |
| `nextjs-no-font-link` | 1 | `<link>` de fuente → `next/font` (ya usado en layout para Manrope/JetBrains; queda Material Symbols). |
| `jsx-no-constructed-context-values` | 1 | Memoizar el `value` del Context Provider. |
| `no-array-index-key` / `no-array-index-as-key` | 1+1 | `key={i}` → id estable. |

---

## Resumen de esfuerzo

| Fase | Warnings | Esfuerzo | Impacto usuario |
|------|----------|----------|-----------------|
| 1 Bugs | ~25 | Alto (criterio) | Alto |
| 2 A11y | ~45 | Medio (repetitivo) | Medio-alto |
| 3 Dead code | ~183 | Medio (verificar) | Nulo (limpieza) |
| 4 Perf | ~11 | Bajo-medio | Bajo-medio |
| 5 Estilo | ~30 | Bajo | Nulo |

**Recomendación:** Fases 1 y 2 valen la pena de verdad. La 3 cuando moleste el ruido.
4 y 5 opcionales. El `async-parallel` deferido se queda como está salvo rediseño.

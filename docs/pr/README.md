# Planes (`docs/pr/`)

Los planes se clasifican por estado/alcance:

- ~~`completos/`~~ — **carpeta vacía, ya no existe** (corregido 2026-08-14).
  Todo su contenido (planes ya ejecutados) vive ahora en `docs/historical/`.
- **`importantes/`** — planes super-amplios que se dividen en VARIOS planes. Cada uno vive en su **subcarpeta** (umbrella + sub-planes juntos).
- **`incompletos/`** — planes incompletos, en general cambios menores o de alcance acotado, rápidamente aplicables.

> Nota: `docs/` **sí se trackea en git desde 2026-08-13** (decisión revertida
> respecto a lo que proponía `historical/plan-limpieza-git.md` — ver
> [ADR-0022](../adr/0022-docs-agents-tracked-in-git.md)). `mcp/` sigue fuera
> del repo.

---

## `importantes/`
- **`canon/`** — plataforma anatómica Canon (atlas escalable). Norte: medidas en unidades-cabeza, cualquier tamaño calculable.
  Bundle activo — se deja completo hasta que `arquitectura.md` (la espina)
  se declare cerrada. **Auditado 2026-08-14** (lectura de cada plan +
  1 spot-check verificado contra código: `plan-canon-musculos-frontal-atlas.md`
  dice "14 regiones", `partHits.ts` tiene exactamente 14 — coincide):
  - **Autodeclarados cerrados, sin caveat:** `plan-canon-animations.md`,
    `plan-canon-espalda-8-zonas.md`, `plan-canon-musculos-frontal-atlas.md`
    (verificado), `plan-canon-panel-jerarquico.md`, `plan-canon-png-features.md`,
    `plan-canon-redesign.md`.
  - **Con trabajo pendiente explícito en su propio texto:**
    `plan-canon-afinar-bordes-frontal.md` (3 ajustes finos),
    `plan-canon-anatomy-deep.md` (A5/A6), `plan-canon-espalda-referencia.md`
    (R5), `plan-canon-hover-vistas-partes.md` (N5 lateral),
    `plan-canon-png-refactor.md` (F3 pesado).
  - **Sin marcador de estado claro:** `plan-canon-laminas-faltantes.md`
    (describe una priorización en curso, no un hito cerrado).
  - No se releyeron los 13 completos línea por línea — el resto de
    "cerrados sin caveat" se acepta por su propio texto, no reverificado
    uno por uno contra código.
  - **`arquitectura.md`** — espina: capas (datos/render/interacción/contenido/salida), invariantes, puntos de extensión. **Leer primero.**
  - `plan-canon-redesign.md` — rediseño UI coherente + §9 ayuda anatómica.
  - `plan-canon-anatomy-deep.md` — sistema profundo por parte + modelo interactivo (hover/selección) + **auditoría §6** (referencias web, P1 edad, P2 copyright).
  - `plan-canon-panel-jerarquico.md` — panel derecho de lista plana → árbol región→parte→sub-parte (mano→dedos/falanges) amplio y escalable.
  - `plan-canon-laminas-faltantes.md` — qué láminas generar (Bloque D = partes).
  - `plan-canon-png-refactor.md` · `plan-canon-png-features.md` · `plan-canon-animations.md`.
- ~~`carnaval/`~~ — suite de acreditación Carnaval (workspace). **Movida a
  `docs/historical/carnaval/` el 2026-08-13** — las 11 fases están
  implementadas y `features/workspaces/carnaval.md` (`status: stable`) es
  la referencia vigente.
- **`i18n/`** — internacionalización es/en. **Corregido 2026-08-14**: F3 y
  F4 en realidad estaban implementados (`grep` confirma `t('boards.*')` en
  16 archivos, `t('home.*')`/`t('nav.*')` en Home/Navbar/Sidebar) — su
  `status: draft` era incorrecto, ya corregido a `done`. F5/maestro siguen
  `completed` pero con una regresión real sin resolver: `npm run i18n:scan`
  da 3 hoy (no 0), y nunca se montó el CI que debía bloquear eso. Se deja el
  bundle completo (no se archiva) porque ese pendiente sigue siendo
  accionable.
  - `plan-i18n-maestro.md` (umbrella) · `plan-i18n-f3-boards.md` · `plan-i18n-f4-screens.md` · `plan-i18n-f5-guardarrail.md`.
- `NOTIFICATIONS_REALTIME_PLAN.md` (suelto, en la raíz de `importantes/`) —
  notificaciones en tiempo real (quitar el poll de 30s). Verificado
  2026-08-13: sigue pendiente, el cliente real todavía usa
  `setInterval(30000)`.

## `incompletos/`

Corregido 2026-08-14 — la lista tenía 2 entradas obsoletas
(`plan-api-error-handler.md`, `plan-cutout-tool-split.md`) ya movidas a
`historical/` en una pasada anterior sin actualizar este README. Verificado
contra el contenido real de la carpeta (`ls`), no solo de memoria.

- `plan-boards-animaciones.md` · `plan-boards-ui-review.md` — boards (animaciones, revisión UI).
- `plan-modal-animations.md` · `plan-chrome-animations.md` — animaciones de chrome/modales.
- `plan-rediseno-tools-imagen.md` — coherencia de las 3 tools de imagen.
- `plan-rendimiento-redis.md` — caché Redis (pendiente, a futuro).

## `historical/` (referencia — no vive en `pr/`)

Los 7 planes que vivían en `completos/` (`plan-api-dead-code.md`,
`plan-appbar-unify.md`, `plan-chrome-hoist-smooth-nav.md`,
`plan-limpieza-git.md`, `plan-reestructuracion-global.md`,
`plan-rendimiento.md`, `plan-verificacion-codigo.md`), más 5 planes de
`incompletos/` que resultaron ya implementados pese a la etiqueta
(`plan-api-error-handler.md`, `plan-boards-image-grid-pdf-modal.md`,
`plan-cutout-tool-split.md`, `layers_system_plan.md`,
`plan-ai-context.md`), más el bundle `carnaval/` completo — todos
verificados contra código antes de moverse, ver `docs/historical/`.

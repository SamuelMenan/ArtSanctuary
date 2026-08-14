# Planes (`docs/pr/`)

Los planes se clasifican en 3 carpetas por estado/alcance:

- **`completos/`** — planes ya ejecutados (referencia histórica de qué se hizo y por qué).
- **`importantes/`** — planes super-amplios que se dividen en VARIOS planes. Cada uno vive en su **subcarpeta** (umbrella + sub-planes juntos).
- **`incompletos/`** — planes incompletos, en general cambios menores o de alcance acotado, rápidamente aplicables.

> Nota: `docs/` **sí se trackea en git desde 2026-08-13** (decisión revertida
> respecto a lo que proponía `historical/plan-limpieza-git.md` — ver
> [ADR-0022](../adr/0022-docs-agents-tracked-in-git.md)). `mcp/` sigue fuera
> del repo.

---

## `completos/`
- `plan-reestructuracion-global.md` — reestructuración global del repo.
- `plan-rendimiento.md` — optimización de rendimiento.
- `plan-chrome-hoist-smooth-nav.md` — chrome del dashboard izado a `layout.tsx`, nav sin re-montaje. ✅
- `plan-appbar-unify.md` — barras superiores unificadas (`appBarStyles`).
- `plan-verificacion-codigo.md` — auditoría simple/organizado/rápido (resultados en `architecture/resultados-verificacion.md`).

## `importantes/`
- **`canon/`** — plataforma anatómica Canon (atlas escalable). Norte: medidas en unidades-cabeza, cualquier tamaño calculable.
  Bundle activo — varios sub-planes están cerrados pero otros tienen
  próximos pasos explícitos (A5/A6, N5 lateral, F3 pesado, R5, 3 ajustes
  finos en bordes). Se deja completo hasta que `arquitectura.md` (la espina)
  se declare cerrada.
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
- **`i18n/`** — internacionalización es/en. Bundle mixto (F5 y el maestro
  dicen `completed`, F3/F4 siguen `draft`) — se deja completo, no se
  fragmenta, hasta que F3/F4 cierren.
  - `plan-i18n-maestro.md` (umbrella) · `plan-i18n-f3-boards.md` · `plan-i18n-f4-screens.md` · `plan-i18n-f5-guardarrail.md`.
- `NOTIFICATIONS_REALTIME_PLAN.md` (suelto, en la raíz de `importantes/`) —
  notificaciones en tiempo real (quitar el poll de 30s). Verificado
  2026-08-13: sigue pendiente, el cliente real todavía usa
  `setInterval(30000)`.

## `incompletos/`
- `plan-api-dead-code.md` · `plan-api-error-handler.md` — limpieza/manejo de errores API.
- `plan-boards-animaciones.md` · `plan-boards-ui-review.md` — boards (animaciones, revisión UI).
- `plan-boards-image-grid-pdf-modal.md` — modal Cuadrícula+PDF a escala para imagen del board (selector de hoja: pliego 70×100, medio pliego 70×50, A4/A3/…); mueve `download` al rail, elimina botones `grid_on`/`picture_as_pdf`.
- `plan-modal-animations.md` · `plan-chrome-animations.md` — animaciones de chrome/modales.
- `plan-rediseno-tools-imagen.md` — coherencia de las 3 tools de imagen.
- `plan-cutout-tool-split.md` — separar "Quitar fondo" de Recorte → herramienta propia con entrada en el sidebar.
- `plan-rendimiento-redis.md` — caché Redis (pendiente, a futuro).
- `plan-limpieza-git.md` — sacar tooling/docs del repo (solo local).

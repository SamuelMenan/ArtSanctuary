// Fuente ÚNICA de estilos para las barras superiores de chrome (navbar global y
// top bars de herramientas). Coherencia dura: iconos, tamaños y tipografía
// IGUALES en todas; el color de fondo PUEDE variar por contexto (glass vs
// sólido), siempre vía token. Ver docs/pr/plan-appbar-unify.md.

/** Estructura de la barra principal. */
export const appBarShell =
  'h-[var(--spacing-appbar-height)] border-b border-[var(--color-outline-variant)] px-[var(--spacing-grid-gutter)] flex items-center shrink-0'

/** Estructura de la barra secundaria (herramientas). */
export const appBarShellSecondary =
  'h-[var(--spacing-appbar-secondary-height)] border-b border-[var(--color-outline-variant)] px-[var(--spacing-grid-gutter)] flex items-center shrink-0'

/** Las dos superficies admitidas. Cada barra elige una; el resto es idéntico. */
export const appBarBg = {
  glass: 'bg-[var(--color-surface)]/60 backdrop-blur-md',
  solid: 'bg-[var(--color-surface-container)]',
} as const

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-surface-container)]'

// Botón-icono de barra: cuadrado, sin borde, hover con fondo. Icono a 20px
// (aplicado en el glifo dentro de AppBarButton / consumidores).
const btnBase = `flex items-center justify-center w-10 h-10 rounded-xl transition-colors disabled:opacity-40 shrink-0 ${focusRing}`
const btnIdleTone =
  'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-primary)]'
const btnActiveTone = 'bg-[var(--color-primary)] text-[var(--color-on-primary)]'

export const appBarIconBtnIdle = `${btnBase} ${btnIdleTone}`
export const appBarIconBtnActive = (on: boolean) => `${btnBase} ${on ? btnActiveTone : btnIdleTone}`

/** Tipografía única para títulos/marcas de barra. */
export const appBarTitle = 'font-display font-bold text-xl text-[var(--color-primary)] leading-none'
/** Tipografía única para estado/etiqueta secundaria de barra. */
export const appBarLabel = 'font-mono text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)]'

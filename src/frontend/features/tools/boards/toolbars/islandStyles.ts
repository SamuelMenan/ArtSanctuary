// Islas flotantes (estilo Figma): glassmorphism + sombra.
//
// Escala ÚNICA de espaciado/radios reutilizada por todas las islas. Una sola
// fuente de verdad elimina las inconsistencias de spacing/radio entre barras.
export const ISLAND = {
  btn: 'w-10 h-10',
  btnRadius: 'rounded-xl',
  islandRadius: 'rounded-2xl',
  pillRadius: 'rounded-full', // zoom/vista: pastilla intencional y documentada
  gap: 'gap-1',
  pad: 'p-1.5',
} as const

export const island =
  'absolute z-30 bg-[var(--color-surface-container)]/85 backdrop-blur-md border border-[var(--color-outline-variant)] shadow-xl'

/** Separador hairline estándar entre secciones de una isla vertical. */
export const islandSep = 'h-px w-7 bg-[var(--color-outline-variant)]/60 my-1'

const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-surface-container)]'

const base = `flex items-center justify-center ${ISLAND.btn} ${ISLAND.btnRadius} transition-colors disabled:opacity-40 ${focusRing}`

// Idle: peso bajo (icono on-surface-variant). Activo: fondo primario + anillo
// sutil + icono on-primary → estado activo claramente destacado (hallazgo 4).
const idleTone =
  'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-primary)]'
const activeTone =
  'bg-[var(--color-primary)] text-[var(--color-on-primary)] ring-1 ring-[var(--color-primary)]/40 shadow-sm'

export const islandIdle = `${base} ${idleTone}`
export const islandOn = (on: boolean) => `${base} ${on ? activeTone : idleTone}`

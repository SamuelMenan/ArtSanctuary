// Islas flotantes (estilo Figma): glassmorphism + sombra.
export const island =
  'absolute z-30 bg-[var(--color-surface-container)]/85 backdrop-blur-md border border-[var(--color-outline-variant)] shadow-xl'
const focusRing =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--color-surface-container)]'
export const islandIdle =
  `flex items-center justify-center w-10 h-10 rounded-xl text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-40 ${focusRing}`
export const islandOn = (on: boolean) =>
  `flex items-center justify-center w-10 h-10 rounded-xl transition-colors disabled:opacity-40 ${focusRing} ${
    on ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-primary)]'
  }`

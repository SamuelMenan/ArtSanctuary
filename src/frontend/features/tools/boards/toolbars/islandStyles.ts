// Islas flotantes (estilo Figma): glassmorphism + sombra.
export const island =
  'absolute z-30 bg-[var(--color-surface-container)]/85 backdrop-blur-md border border-[var(--color-outline-variant)] shadow-xl'
export const islandIdle =
  'flex items-center justify-center w-10 h-10 rounded-xl text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-40'
export const islandOn = (on: boolean) =>
  `flex items-center justify-center w-10 h-10 rounded-xl transition-colors disabled:opacity-40 ${
    on ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)]' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-primary)]'
  }`
